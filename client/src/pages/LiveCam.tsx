import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Video, VideoOff, Play, Square, Camera } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";

/**
 * LiveCam Page - Real-time face swap with webcam
 * Deep-Live-Cam style interface
 */
export default function LiveCam() {
  const { user, loading: authLoading } = useAuth();
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Enumerate cameras on mount
  useEffect(() => {
    enumerateCameras();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      
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
    } catch (error) {
      console.error('Failed to enumerate cameras:', error);
    }
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStreaming(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const startFaceSwap = async () => {
    if (!sourceImage) {
      toast.error("Please upload a source face image first");
      return;
    }

    if (!isCameraActive) {
      toast.error("Please start the camera first");
      return;
    }

    // For now, just show a message that real-time processing is coming soon
    // Real implementation would require WebSocket connection to server
    toast.info("Real-time face swap processing coming soon! For now, use the regular Face Swap feature.");
    
    // TODO: Implement WebSocket connection and frame streaming
    // setIsStreaming(true);
    // connectWebSocket();
  };

  const stopFaceSwap = () => {
    setIsStreaming(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
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
            Sign in to access real-time face swap with your webcam
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
          <p className="text-gray-400">Real-time face swap with your webcam</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Setup</h2>

              {/* Camera Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Camera
                </label>
                <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600">
                    <SelectValue placeholder="Choose camera..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.map((camera) => (
                      <SelectItem key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                      </SelectItem>
                    ))}
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

                {isCameraActive && !isStreaming && (
                  <Button
                    onClick={startFaceSwap}
                    disabled={!sourceImage}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Face Swap
                  </Button>
                )}

                {isStreaming && (
                  <Button
                    onClick={stopFaceSwap}
                    variant="outline"
                    className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Face Swap
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-xs text-blue-300">
                  <strong>How it works:</strong> Upload a source face, start your camera, and click "Start Face Swap" to see real-time face replacement.
                </p>
              </div>
            </Card>
          </div>

          {/* Right Panel - Video Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Live Preview</h2>

              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {/* Original Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isStreaming ? "hidden" : ""}`}
                />

                {/* Processed Canvas (for face swap) */}
                <canvas
                  ref={canvasRef}
                  className={`w-full h-full object-cover ${!isStreaming ? "hidden" : ""}`}
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

                {/* Processing Indicator */}
                {isStreaming && (
                  <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-semibold">LIVE</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-4 p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                <h3 className="font-semibold mb-2 text-purple-300">Tips for best results:</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Ensure good lighting on your face</li>
                  <li>• Look directly at the camera</li>
                  <li>• Use a high-quality source face image</li>
                  <li>• Keep your face centered in the frame</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
