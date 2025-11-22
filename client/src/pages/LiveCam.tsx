import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Video, VideoOff, Camera, RefreshCw, Play, Square, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

/**
 * LiveCam Page - Video recording with Wan 2.2 face swap
 * Record 5-10 second videos and process with Wan Animate Replacement mode
 */
export default function LiveCam() {
  const { user, loading: authLoading } = useAuth();
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [cameraPreviewUrls, setCameraPreviewUrls] = useState<Map<string, string>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user's Wan Animate jobs
  const { data: jobs, refetch: refetchJobs } = trpc.wanAnimate.getJobs.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 3000, // Poll every 3 seconds for updates
  });

  const createJobMutation = trpc.wanAnimate.createJob.useMutation({
    onSuccess: () => {
      refetchJobs();
      toast.success("Video submitted for processing!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create job");
    },
  });

  const deleteJobMutation = trpc.wanAnimate.deleteJob.useMutation({
    onSuccess: () => {
      refetchJobs();
      toast.success("Video deleted");
    },
  });

  // Enumerate cameras on mount and load saved preference
  useEffect(() => {
    enumerateCameras();
  }, []);

  // Save selected camera to localStorage
  useEffect(() => {
    if (selectedCameraId) {
      localStorage.setItem('livecam_preferred_camera', selectedCameraId);
    }
  }, [selectedCameraId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      
      // Generate preview thumbnails for each camera
      generateCameraPreviews(videoDevices);
      
      // Try to load saved camera preference first
      const savedCameraId = localStorage.getItem('livecam_preferred_camera');
      const savedCameraExists = savedCameraId ? videoDevices.find(d => d.deviceId === savedCameraId) : null;
      
      if (savedCameraExists && savedCameraId) {
        setSelectedCameraId(savedCameraId);
      } else {
        // Auto-select first non-virtual camera or first camera
        const realCamera = videoDevices.find(d => 
          !d.label.toLowerCase().includes('virtual') && 
          !d.label.toLowerCase().includes('xsplit') &&
          !d.label.toLowerCase().includes('obs')
        );
        
        if (realCamera) {
          setSelectedCameraId(realCamera.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      }
    } catch (error) {
      console.error('Failed to enumerate cameras:', error);
    }
  };

  const generateCameraPreviews = async (videoDevices: MediaDeviceInfo[]) => {
    const newPreviews = new Map<string, string>();
    
    for (const device of videoDevices) {
      // Skip devices without deviceId
      if (!device.deviceId) {
        console.warn(`Skipping camera without deviceId: ${device.label}`);
        continue;
      }
      
      try {
        // Capture a single frame from each camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: device.deviceId }, width: 160, height: 90 },
          audio: false
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        await video.play();
        
        // Wait for video to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 160, 90);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          newPreviews.set(device.deviceId, dataUrl);
        }
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        // Silently skip cameras that fail to generate preview
        console.warn(`Failed to generate preview for camera ${device.label || 'Unknown'}:`, error);
      }
    }
    
    setCameraPreviewUrls(newPreviews);
  };

  const handleRefreshCameras = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing camera list...");
    await enumerateCameras();
    setIsRefreshing(false);
    toast.success("Camera list updated");
  };

  const handleSourceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImage(file);
      const reader = new FileReader();
      reader.onload = () => setSourcePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId ? {
          deviceId: { exact: selectedCameraId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        toast.success("Camera started");
      }
    } catch (error: any) {
      console.error("Camera access error:", error);
      toast.error("Failed to access camera. Please grant camera permissions.");
    }
  };

  const stopCamera = () => {
    if (isRecording) {
      stopRecording();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startRecording = () => {
    if (!sourceImage) {
      toast.error("Please upload a source face image first");
      return;
    }

    if (!streamRef.current) {
      toast.error("Camera not active");
      return;
    }

    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoFile = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
        
        // Upload files to S3 and submit to Wan Animate API
        try {
          toast.info("Uploading video...");
          
          // Upload character image
          const charFormData = new FormData();
          charFormData.append('file', sourceImage!);
          const charUploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: charFormData,
          });
          if (!charUploadRes.ok) throw new Error('Failed to upload character image');
          const charData = await charUploadRes.json();
          
          // Upload video
          const videoFormData = new FormData();
          videoFormData.append('file', videoFile);
          const videoUploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: videoFormData,
          });
          if (!videoUploadRes.ok) throw new Error('Failed to upload video');
          const videoData = await videoUploadRes.json();
          
          // Submit to Wan Animate API
          await createJobMutation.mutateAsync({
            mode: 'replacement',
            characterImageKey: charData.key,
            characterImageUrl: charData.url,
            referenceVideoKey: videoData.key,
            referenceVideoUrl: videoData.url,
          });
        } catch (error: any) {
          console.error('Upload error:', error);
          toast.error(error.message || 'Failed to upload files');
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Start countdown timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 10) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

      toast.info("Recording started (max 10 seconds)");
    } catch (error: any) {
      console.error("Recording error:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
      await deleteJobMutation.mutateAsync({ jobId });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-gray-800/50 border-gray-700 text-center">
          <Video className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Live Face Swap</h2>
          <p className="text-gray-400 mb-6">
            Sign in to record videos and swap faces
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Video className="w-8 h-8 text-purple-400" />
            Live Face Swap
          </h1>
          <p className="text-gray-400">Record videos and swap faces with Wan 2.2</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Setup</h2>

              {/* Camera Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Select Camera
                  </label>
                  <Button
                    onClick={handleRefreshCameras}
                    disabled={isRefreshing}
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <Select value={selectedCameraId || undefined} onValueChange={setSelectedCameraId}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600">
                    <SelectValue placeholder="Choose camera..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {cameras.filter(c => c.deviceId).map((camera) => {
                      const previewUrl = cameraPreviewUrls.get(camera.deviceId);
                      return (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                          <div className="flex items-center gap-2">
                            {previewUrl ? (
                              <img 
                                src={previewUrl} 
                                alt={camera.label}
                                className="w-20 h-11 object-cover rounded border border-gray-600"
                              />
                            ) : (
                              <div className="w-20 h-11 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                                <Camera className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <span className="text-sm">
                              {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Source Face Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Source Face Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSourceImageChange}
                    className="hidden"
                    id="source-upload"
                  />
                  <label
                    htmlFor="source-upload"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors bg-gray-700/30"
                  >
                    {sourcePreview ? (
                      <img
                        src={sourcePreview}
                        alt="Source"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">Click to upload</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="space-y-3">
                {!isCameraActive ? (
                  <Button
                    onClick={startCamera}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    <VideoOff className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                )}

                {isCameraActive && !isRecording && (
                  <Button
                    onClick={startRecording}
                    disabled={!sourceImage || createJobMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                )}

                {isRecording && (
                  <Button
                    onClick={stopRecording}
                    variant="outline"
                    className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording ({recordingTime}s / 10s)
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-xs text-blue-300">
                  <strong>How it works:</strong> Upload a source face, start your camera, and record a 5-10 second video. We'll process it with Wan 2.2 face swap.
                </p>
              </div>
            </Card>
          </div>

          {/* Right Panel - Video Preview & Gallery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Preview */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Live Preview</h2>

              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {/* Camera Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Placeholder */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <VideoOff className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-500">Camera not started</p>
                    </div>
                  </div>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-semibold">REC {recordingTime}s</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Video Gallery */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Your Videos</h2>

              {!jobs || jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">No videos yet. Record your first video!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="relative group">
                      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                        {job.status === 'completed' && job.resultVideoUrl ? (
                          <video
                            src={job.resultVideoUrl}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : job.status === 'processing' ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-400" />
                              <p className="text-sm text-gray-400">Processing...</p>
                              {job.progress !== undefined && (
                                <p className="text-xs text-gray-500 mt-1">{job.progress}%</p>
                              )}
                            </div>
                          </div>
                        ) : job.status === 'failed' ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-sm text-red-400">Failed</p>
                              {job.errorMessage && (
                                <p className="text-xs text-gray-500 mt-1">{job.errorMessage}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {job.status === 'completed' && job.resultVideoUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-gray-900/80 border-gray-700"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = job.resultVideoUrl!;
                              a.download = `faceswap-${job.id}.mp4`;
                              a.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gray-900/80 border-red-700 text-red-500 hover:bg-red-500/10"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Timestamp */}
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                        {new Date(job.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
