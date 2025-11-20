import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Sparkles, Loader2, UserCircle, Users, Library, ChevronLeft, ChevronRight, Download, CheckCircle, XCircle, Clock, Trash2, Bookmark, RotateCcw, Crop, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import TemplateGallery, { Template } from "@/components/TemplateGallery";

import FullscreenLightbox from "@/components/FullscreenLightbox";
import SavedFacesDialog from "@/components/SavedFacesDialog";
import RegenerateDialog from "@/components/RegenerateDialog";
import CropDialog from "@/components/CropDialog";

/**
 * Get video duration in seconds
 */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

export default function FaceSwap() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [targetFiles, setTargetFiles] = useState<File[]>([]);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [targetPreviews, setTargetPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number}>({current: 0, total: 0});
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Template[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [showComparison, setShowComparison] = useState(true);
  const [previousCompletedCount, setPreviousCompletedCount] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState<'result' | 'source' | 'target'>('result');
  const [showSavedFaces, setShowSavedFaces] = useState(false);
  const [visibleJobsCount, setVisibleJobsCount] = useState(20);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerateJob, setRegenerateJob] = useState<typeof completedJobs[0] | null>(null);
  const [isDraggingSource, setIsDraggingSource] = useState(false);
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [isRegenerateMode, setIsRegenerateMode] = useState(false);
  const [regenerateSourceJobId, setRegenerateSourceJobId] = useState<number | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [modelPreference, setModelPreference] = useState<"high_quality" | "permissive">("high_quality");

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const { data: jobs, refetch } = trpc.faceSwap.getMyJobs.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // Poll every 5s for real-time updates
  });

  const { data: savedFaces } = trpc.savedFaces.getMySavedFaces.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createJobMutation = trpc.faceSwap.createJob.useMutation();
  const deleteJobMutation = trpc.faceSwap.deleteJob.useMutation();
  const cancelJobMutation = trpc.faceSwap.cancelJob.useMutation();
  const updateJobResultMutation = trpc.faceSwap.updateJobResult.useMutation();
  const softDeleteSourceMutation = trpc.faceSwap.softDeleteSourceImage.useMutation();
  const utils = trpc.useUtils();

  const completedJobs = jobs?.filter(job => job.status === "completed") || [];
  const currentJob = completedJobs[currentResultIndex];
  const visibleJobs = jobs?.slice(0, visibleJobsCount) || [];
  const hasMoreJobs = jobs && jobs.length > visibleJobsCount;

  // Reset to clean state on page load
  useEffect(() => {
    // Clear all input states
    setSourceFile(null);
    setTargetFiles([]);
    setSourcePreview(null);
    setTargetPreviews([]);
    setSelectedTemplates([]);
    setCurrentResultIndex(0);
    
    // Clear file inputs
    if (sourceInputRef.current) sourceInputRef.current.value = '';
    if (targetInputRef.current) targetInputRef.current.value = '';
  }, []); // Run only once on mount

  // Auto-refresh notification when new results are ready
  useEffect(() => {
    if (completedJobs.length > previousCompletedCount && previousCompletedCount > 0) {
      const newCount = completedJobs.length - previousCompletedCount;
      
      // Automatically switch to the newest result
      setCurrentResultIndex(completedJobs.length - 1);
      
      toast.success(`${newCount} new result(s) ready!`, {
        duration: 5000,
        action: {
          label: "View",
          onClick: () => {
            document.querySelector('[data-results-section]')?.scrollIntoView({ behavior: 'smooth' });
          },
        },
      });
    }
    setPreviousCompletedCount(completedJobs.length);
  }, [completedJobs.length, previousCompletedCount]);

  // Keyboard navigation for results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showLightbox) return; // Don't interfere with lightbox navigation
      
      if (e.key === "ArrowLeft" && currentResultIndex > 0) {
        setCurrentResultIndex(currentResultIndex - 1);
      } else if (e.key === "ArrowRight" && currentResultIndex < completedJobs.length - 1) {
        setCurrentResultIndex(currentResultIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentResultIndex, completedJobs.length, showLightbox]);

  const handleSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSourceFile(file);
    }
  };

  const processSourceFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setSourceFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSourcePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSourceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSource(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSourceFile(file);
    }
  };

  const handleSourceDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSource(true);
  };

  const handleSourceDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSource(false);
  };

  const handleTargetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processTargetFiles(files);
  };

  const processTargetFiles = (files: File[]) => {
    // Limit to 5 files maximum
    if (files.length > 5) {
      toast.error('Maximum 5 target media files allowed');
      if (targetInputRef.current) targetInputRef.current.value = '';
      return;
    }
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
    const invalidFiles = files.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error('Invalid file type. Please select images or videos.');
      return;
    }
    
    if (files.length > 0) {
      setTargetFiles(files);
      const previews: string[] = new Array(files.length);
      let loadedCount = 0;

      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews[index] = reader.result as string;
          loadedCount++;

          if (loadedCount === files.length) {
            setTargetPreviews(previews);
          }
        };
        reader.onerror = () => {
          console.error('Failed to load preview for:', file.name);
          loadedCount++;
          if (loadedCount === files.length) {
            setTargetPreviews(previews.filter(p => p)); // Filter out undefined
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleTargetDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTarget(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processTargetFiles(files);
    }
  };

  const handleTargetDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTarget(true);
  };

  const handleTargetDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTarget(false);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplates(prev => {
      const exists = prev.find(t => t.id === template.id);
      if (exists) {
        return prev.filter(t => t.id !== template.id);
      } else {
        return [...prev, template];
      }
    });
  };

  const handleUseTemplates = async () => {
    const templateUrls = selectedTemplates.map(t => t.mediaUrl);
    
    // Limit to 5 templates maximum
    if (templateUrls.length > 5) {
      toast.error('Maximum 5 templates allowed');
      return;
    }
    
    try {
      const responses = await Promise.all(
        templateUrls.map(url => fetch(url))
      );
      const blobs = await Promise.all(
        responses.map(r => r.blob())
      );
      const files = blobs.map((blob, idx) => {
        const template = selectedTemplates[idx]!;
        const extension = template.type === 'video' ? 'mp4' : 'jpg';
        const mimeType = template.type === 'video' ? 'video/mp4' : 'image/jpeg';
        
        // If blob is empty (CORS blocked), create proxy file with URL
        if (blob.size === 0) {
          const file = new File([new Blob()], `template-${idx + 1}.${extension}`, { type: mimeType });
          (file as any).__remoteUrl = template.mediaUrl;
          return file;
        }
        
        return new File([blob], `template-${idx + 1}.${extension}`, { type: blob.type || mimeType });
      });

      setTargetFiles(files);
      setTargetPreviews(templateUrls);
      setShowTemplateGallery(false);
      setSelectedTemplates([]);
      toast.success(`${files.length} template(s) loaded!`);
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast.error("Failed to load templates");
    }
  };

  const saveFaceMutation = trpc.savedFaces.saveFace.useMutation();
  const getFaceImageBlob = trpc.savedFaces.getFaceImageBlob.useMutation();

  const handleSaveCurrentFace = async () => {
    if (!sourceFile || !sourcePreview) {
      toast.error("No source face to save");
      return;
    }

    const faceName = prompt("Enter a name for this face:");
    if (!faceName) return;

    try {
      // Upload the source file first
      const formData = new FormData();
      formData.append("file", sourceFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      // Save to database
      await saveFaceMutation.mutateAsync({
        faceImageKey: uploadData.key || `saved-${Date.now()}`,
        faceImageUrl: uploadData.url,
        name: faceName,
      });
    } catch (error) {
      console.error("Failed to save face:", error);
      toast.error("Failed to save face");
    }
  };

  const handleLoadSavedFace = async (faceImageUrl: string) => {
    try {
      const response = await fetch(faceImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "saved-face.jpg", { type: blob.type });
      
      setSourceFile(file);
      setSourcePreview(faceImageUrl);
    } catch (error) {
      console.error("Failed to load saved face:", error);
      toast.error("Failed to load saved face");
    }
  };

  const handleSaveFaceFromLightbox = async (imageUrl: string) => {
    const faceName = prompt("Enter a name for this face:");
    if (!faceName) return;

    try {
      // Fetch the image and convert to File
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "source-face.jpg", { type: blob.type });

      // Upload the file
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      // Save to database
      await saveFaceMutation.mutateAsync({
        faceImageKey: uploadData.key || `saved-${Date.now()}`,
        faceImageUrl: uploadData.url,
        name: faceName,
      });

      toast.success(`Face "${faceName}" saved successfully!`);
      await utils.savedFaces.getMySavedFaces.invalidate();
    } catch (error) {
      console.error("Failed to save face from lightbox:", error);
      toast.error("Failed to save face");
    }
  };

  // Load target media from existing job (for regenerate mode)
  const loadTargetFromJob = async (job: typeof completedJobs[0]) => {
    try {
      // Fetch the original target media from the job
      const response = await fetch(job.targetMediaUrl, { mode: 'no-cors' });
      const blob = await response.blob();
      
      // Determine file extension from media type
      const extension = job.targetMediaType === 'video' ? 'mp4' : 'jpg';
      const mimeType = job.targetMediaType === 'video' ? 'video/mp4' : 'image/jpeg';
      
      // Create file object
      let file: File;
      if (blob.size === 0) {
        // CORS blocked - create proxy file with URL reference
        file = new File([new Blob()], `target-${job.id}.${extension}`, { type: mimeType });
        (file as any).__remoteUrl = job.targetMediaUrl;
      } else {
        file = new File([blob], `target-${job.id}.${extension}`, { type: blob.type || mimeType });
      }
      
      // Set target files and preview
      setTargetFiles([file]);
      setTargetPreviews([job.targetMediaUrl]);
      
      toast.success('Original photo loaded for regeneration');
    } catch (error) {
      console.error('Failed to load target from job:', error);
      // Fallback: create proxy file with URL
      const extension = job.targetMediaType === 'video' ? 'mp4' : 'jpg';
      const mimeType = job.targetMediaType === 'video' ? 'video/mp4' : 'image/jpeg';
      const file = new File([new Blob()], `target-${job.id}.${extension}`, { type: mimeType });
      (file as any).__remoteUrl = job.targetMediaUrl;
      setTargetFiles([file]);
      setTargetPreviews([job.targetMediaUrl]);
      toast.success('Original photo loaded (using URL)');
    }
  };

  const handleSubmit = async () => {

    
    if (!sourceFile || targetFiles.length === 0) {
      toast.error("Please upload both source face and target media");
      return;
    }

    // Limit to 5 jobs maximum
    if (targetFiles.length > 5) {
      toast.error('Maximum 5 target media files allowed');
      return;
    }

    // Validate video duration (max 30 seconds)
    for (const file of targetFiles) {
      if (file.type.startsWith('video/')) {
        try {
          const duration = await getVideoDuration(file);
          if (duration > 30) {
            toast.error(`Video "${file.name}" is too long (${duration.toFixed(1)}s). Maximum: 30 seconds`);
            return;
          }
        } catch (error) {
          console.error('Failed to get video duration:', error);
          toast.error(`Failed to validate video "${file.name}"`);
          return;
        }
      }
    }


    setIsUploading(true);
    setUploadProgress({ current: 0, total: targetFiles.length });

    try {
      for (let i = 0; i < targetFiles.length; i++) {

        setUploadProgress({ current: i + 1, total: targetFiles.length });

        // Check if source has remote URL (from regenerate/saved face)
        let sourceUploadData;
        if ((sourceFile as any).__remoteUrl) {
          // Use existing URL instead of uploading
          sourceUploadData = {
            key: `remote-${Date.now()}`,
            url: (sourceFile as any).__remoteUrl,
          };
        } else {
          // Upload source file
          const sourceFormData = new FormData();
          sourceFormData.append("file", sourceFile);

          const sourceUploadRes = await fetch("/api/upload", {
            method: "POST",
            body: sourceFormData,
          });
          sourceUploadData = await sourceUploadRes.json();
        }

        // Check if target has remote URL (from template/regenerate)
        let targetUploadData;
        const targetFile = targetFiles[i]!;
        if ((targetFile as any).__remoteUrl) {
          // Use existing URL instead of uploading
          targetUploadData = {
            key: `remote-${Date.now()}-${i}`,
            url: (targetFile as any).__remoteUrl,
          };
        } else {
          // Upload target file
          const targetFormData = new FormData();
          targetFormData.append("file", targetFile);

          const targetUploadRes = await fetch("/api/upload", {
            method: "POST",
            body: targetFormData,
          });
          targetUploadData = await targetUploadRes.json();
        }

        const targetMediaType = targetFile.type.startsWith("video/") ? "video" : "image";

        await createJobMutation.mutateAsync({
          sourceImageKey: sourceUploadData.key || `uploaded-${Date.now()}`,
          sourceImageUrl: sourceUploadData.url,
          targetMediaKey: targetUploadData.key || `uploaded-${Date.now()}`,
          targetMediaUrl: targetUploadData.url,
          targetMediaType,
          modelPreference,
        });

      }

      toast.success(`${targetFiles.length} job(s) created successfully!`);
      
      // Keep both source and target for easy viewing/comparison
      // Don't reset form - user can see what they just submitted
      setSelectedTemplates([]);
      
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      
      // Refresh jobs to get new results
      await refetch();
      
      // Auto-switch to the newest result when it completes
      // The useEffect will handle notification and index update
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to create jobs");
      
      // Keep form data for easy retry
      setSelectedTemplates([]);
      
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const getStatusBadge = (status: string, errorMessage?: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-xs p-1"><CheckCircle className="h-3 w-3" /></Badge>;
      case "processing":
        return <Badge className="bg-blue-500 text-xs"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Processing</Badge>;
      case "failed":
        return (
          <Badge 
            className="bg-red-500 text-xs cursor-help" 
            title={errorMessage || "Unknown error"}
          >
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge className="bg-yellow-500 text-xs"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <Card className="max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Main Content */}
      <main className="container mx-auto px-3 py-3">
        <div className="max-w-7xl mx-auto">
          {/* Horizontal T Layout: Mobile = Inverted T (inputs side-by-side, results below), Tablet/Desktop = Horizontal T (inputs stacked left, results right) */}
          <div className="grid grid-cols-1 md:grid-cols-[0.8fr_3fr] gap-3">
            
            {/* Left Column: Inputs (Desktop: stacked, Mobile: side-by-side) */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                {/* Source Face */}
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardContent className="p-1.5">
                    {/* 2-Column Layout: 20% thumbnails / 80% preview */}
                    <div className="flex gap-1.5">
                      {/* Left Column: Saved Faces Thumbnails (20%) */}
                      <div className="w-[20%] flex flex-col gap-1">
                        {/* Render 5 slots */}
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const face = savedFaces?.[idx];
                          return face ? (
                            <div
                              key={face.id}
                              onClick={async () => {
                                try {
                                  const response = await fetch(face.faceImageUrl, { mode: 'no-cors' });
                                  const blob = await response.blob();
                                  if (blob.size === 0) {
                                    const file = new File([new Blob()], `saved-face-${face.id}.jpg`, { type: 'image/jpeg' });
                                    (file as any).__remoteUrl = face.faceImageUrl;
                                    setSourceFile(file);
                                    setSourcePreview(face.faceImageUrl);
                                    toast.success('Saved face loaded');
                                  } else {
                                    const file = new File([blob], `saved-face-${face.id}.jpg`, { type: blob.type || 'image/jpeg' });
                                    setSourceFile(file);
                                    setSourcePreview(face.faceImageUrl);
                                    toast.success('Saved face loaded');
                                  }
                                  if (currentJob) {
                                    setIsRegenerateMode(true);
                                    setRegenerateSourceJobId(currentJob.id);
                                    if (targetFiles.length === 0) {
                                      await loadTargetFromJob(currentJob);
                                    }
                                  }
                                } catch (error) {
                                  const file = new File([new Blob()], `saved-face-${face.id}.jpg`, { type: 'image/jpeg' });
                                  (file as any).__remoteUrl = face.faceImageUrl;
                                  setSourceFile(file);
                                  setSourcePreview(face.faceImageUrl);
                                  toast.success('Saved face loaded');
                                  if (currentJob) {
                                    setIsRegenerateMode(true);
                                    setRegenerateSourceJobId(currentJob.id);
                                    if (targetFiles.length === 0) {
                                      await loadTargetFromJob(currentJob);
                                    }
                                  }
                                }
                              }}
                              className="aspect-square rounded-full border-2 border-white/10 overflow-hidden cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all"
                            >
                              <img
                                src={face.faceImageUrl}
                                alt="Saved face"
                                className="w-full h-full object-cover scale-110"
                              />
                            </div>
                          ) : (
                            <div
                              key={`empty-${idx}`}
                              onClick={() => sourceInputRef.current?.click()}
                              className="aspect-square rounded-full border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-500/10 transition-all"
                            >
                              <UserCircle className="h-5 w-5 text-white/30" />
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column: Large Preview (90%) */}
                      <div className="flex-1">
                        {/* Save Button */}
                        {sourceFile && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSaveCurrentFace}
                            className="text-green-400 hover:text-green-300 hover:bg-white/10 text-[9px] h-4 px-1 mb-0.5 w-full"
                          >
                            Save
                          </Button>
                        )}
                        {/* Hidden file input */}
                        <input
                          ref={sourceInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleSourceFileChange}
                          className="hidden"
                        />
                        {/* Large preview */}
                        <div
                          onClick={() => sourceInputRef.current?.click()}
                          onDrop={handleSourceDrop}
                          onDragOver={handleSourceDragOver}
                          onDragLeave={handleSourceDragLeave}
                          className={`border-2 border-dashed rounded-lg p-2 text-center cursor-pointer transition-all ${
                            isDraggingSource 
                              ? 'border-pink-400 bg-pink-500/20 scale-105' 
                              : 'border-white/30 hover:border-white/50'
                          }`}
                        >
                          {sourcePreview ? (
                            <img src={sourcePreview} alt="Source" className="w-full aspect-[3/4] object-cover rounded" />
                          ) : (
                            <div className="text-white/70 aspect-[3/4] flex items-center justify-center">
                              <UserCircle className="h-16 w-16 text-pink-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>


                {/* Target Media */}
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardContent className="p-1.5 space-y-1.5">
                    {/* Templates Button - Above Icon */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTemplateGallery(!showTemplateGallery);
                      }}
                      className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 text-[10px] h-6"
                    >
                      <Library className="mr-1 h-3 w-3" />
                      {showTemplateGallery ? 'Hide' : 'Templates'}
                    </Button>
                    
                    <input
                      ref={targetInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                      onChange={handleTargetFileChange}
                      className="hidden"
                      multiple
                    />
                    <div
                      onClick={() => targetInputRef.current?.click()}
                      onDrop={handleTargetDrop}
                      onDragOver={handleTargetDragOver}
                      onDragLeave={handleTargetDragLeave}
                      className={`border-2 border-dashed rounded-lg p-2 text-center cursor-pointer transition-all ${
                        isDraggingTarget 
                          ? 'border-purple-400 bg-purple-500/20 scale-105' 
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      {targetPreviews.length > 0 ? (
                        <div className={targetPreviews.length === 1 ? "" : "grid grid-cols-3 gap-1"}>
                          {targetPreviews.map((preview, idx) => (
                            <div key={idx} className="relative group">
                              <img 
                                src={preview} 
                                alt={`Target ${idx + 1}`} 
                                className={targetPreviews.length === 1 ? "w-full aspect-[3/4] object-cover rounded border border-white/20" : "w-full h-12 object-cover rounded border border-white/20"}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                <span className="text-white text-[8px] font-medium">#{idx + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white/70">
                          <Users className="h-12 w-12 mx-auto text-purple-400" />
                        </div>
                      )}
                    </div>
                    {targetFiles.length > 0 && (
                      <p className="text-white/70 text-[9px] mt-1 text-center">{targetFiles.length} / 5 file(s)</p>
                    )}
                    {targetFiles.length === 0 && (
                      <p className="text-white/50 text-[9px] mt-0.5 text-center">Max 5 files</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Template Gallery */}
              {showTemplateGallery && (
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader className="p-2">
                    <CardTitle className="text-white text-xs">Template Gallery</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <TemplateGallery 
                      onSelectTemplate={handleTemplateSelect}
                      selectedTemplates={selectedTemplates}
                    />
                    {selectedTemplates.length > 0 && (
                      <Button
                        onClick={handleUseTemplates}
                        className="w-full mt-3 bg-gradient-to-r from-purple-500 to-blue-500 h-8 text-sm"
                      >
                        Use {selectedTemplates.length} Template{selectedTemplates.length > 1 ? 's' : ''}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Model Selector */}
              <div className="space-y-1">
                <label className="text-white text-xs font-medium">AI Model</label>
                <select
                  value={modelPreference}
                  onChange={(e) => setModelPreference(e.target.value as "high_quality" | "permissive")}
                  className="w-full h-9 px-3 rounded-md bg-white/10 backdrop-blur-lg border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="high_quality" className="bg-gray-900">High Quality (NSFW filter)</option>
                  <option value="permissive" className="bg-gray-900">Permissive (NSFW allowed)</option>
                </select>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!sourceFile || targetFiles.length === 0 || isUploading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 h-9 text-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating {uploadProgress.current}/{uploadProgress.total}...
                  </>
                ) : (
                  <>
                    {isRegenerateMode ? (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start Face Swap
                      </>
                    )}
                  </>
                )}
              </Button>

              {/* Before/After Thumbnails - Desktop Only, Below Submit Button */}
              {/* Show thumbnails if: 1) there are completed jobs OR 2) currently generating with form inputs */}
              {((completedJobs.length > 0 && currentJob) || (sourcePreview && targetPreviews.length > 0)) && (
                <div className="hidden md:flex gap-0.5 mt-1">
                  {/* Source Face Thumbnail */}
                  <div className="group flex-1 bg-white/90 backdrop-blur-sm rounded p-0.5 shadow-sm relative cursor-pointer hover:ring-1 hover:ring-pink-500 transition-all"
                    onClick={() => {
                      // Open lightbox with source image
                      setLightboxType('source');
                      setShowLightbox(true);
                      setLightboxIndex(currentResultIndex);
                    }}
                  >
                    <div className="text-[8px] font-semibold text-gray-700 mb-0.5 text-center">Before</div>
                    <img
                      src={currentJob ? currentJob.sourceImageUrl : sourcePreview!}
                      alt="Source"
                      className="w-full aspect-[4/3] object-cover rounded"
                    />
                    {/* Save to Faces Badge */}
                    <div className="absolute top-1 right-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await saveFaceMutation.mutateAsync({
                              faceImageUrl: currentJob.sourceImageUrl,
                              faceImageKey: currentJob.sourceImageKey,
                              name: `Face ${new Date().toLocaleString()}`
                            });
                            toast.success('Face saved successfully');
                            await utils.savedFaces.getMySavedFaces.invalidate();
                          } catch (error) {
                            toast.error('Failed to save face');
                          }
                        }}
                        className="h-4 w-4 p-0 bg-pink-500/80 hover:bg-pink-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Bookmark className="h-2 w-2" />
                      </Button>
                    </div>
                  </div>
                  {/* Target Media Thumbnail */}
                  <div className="flex-1 bg-white/90 backdrop-blur-sm rounded p-0.5 shadow-sm cursor-pointer hover:ring-1 hover:ring-purple-500 transition-all"
                    onClick={() => {
                      // Open lightbox with target image
                      setLightboxType('target');
                      setShowLightbox(true);
                      setLightboxIndex(currentResultIndex);
                    }}
                  >
                    <div className="text-[8px] font-semibold text-gray-700 mb-0.5 text-center">Original</div>
                    <img
                      src={currentJob ? currentJob.targetMediaUrl : targetPreviews[0]!}
                      alt="Target"
                      className="w-full aspect-[3/4] object-cover rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Results (Desktop: full height, Mobile: below inputs) */}
            <div className="space-y-4">
              {/* Results Section */}
              {/* Loading State - Show when processing */}
              {jobs && jobs.some(j => j.status === "pending" || j.status === "processing") && completedJobs.length === 0 && (
                <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden">
                  {/* Show target preview during generation */}
                  {targetPreviews.length > 0 && (
                    <div className="relative">
                      <img 
                        src={targetPreviews[0]} 
                        alt="Target preview" 
                        className="w-full h-auto object-contain max-h-[600px]"
                      />
                      {/* Loading overlay */}
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-16 w-16 text-pink-400 animate-spin mb-4 mx-auto" />
                          <h3 className="text-white text-xl font-semibold mb-2">Generating Face Swap...</h3>
                          <p className="text-white/70 text-sm mb-4">
                            {jobs.find(j => j.status === "processing")?.targetMediaType === "video" 
                              ? "Video processing may take 1-2 minutes"
                              : "This usually takes 10-30 seconds"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Fallback: no preview available */}
                  {targetPreviews.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 px-8">
                      <Loader2 className="h-16 w-16 text-pink-400 animate-spin mb-4" />
                      <h3 className="text-white text-xl font-semibold mb-2">Generating Face Swap...</h3>
                      <p className="text-white/70 text-sm text-center mb-4">
                        {jobs.find(j => j.status === "processing")?.targetMediaType === "video" 
                          ? "Video processing may take 1-2 minutes"
                          : "This usually takes 10-30 seconds"}
                      </p>
                    </div>
                  )}
                  {/* Job Queue Visualization */}
                  {jobs.filter(j => j.status === "pending" || j.status === "processing").length > 0 && (
                    <div className="px-8 pb-2">
                      <div className="w-full max-w-md mx-auto bg-white/5 rounded-lg p-2 mb-2">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-pink-400" />
                          <span className="text-white/90 text-sm font-medium">
                            Processing {jobs.filter(j => j.status === "processing").length || 1} / {jobs.filter(j => j.status === "pending" || j.status === "processing").length} jobs
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Progress bars */}
                  <div className="px-8 pb-8">
                    {jobs.filter(j => j.status === "pending" || j.status === "processing").map(job => (
                      <div key={job.id} className="w-full max-w-md bg-white/5 rounded-lg p-3 mb-2 mx-auto">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white/90 text-sm">Job #{job.id}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await cancelJobMutation.mutateAsync({ jobId: job.id });
                                  toast.success('Job cancelled successfully');
                                  await refetch();
                                } catch (error) {
                                  console.error('Failed to cancel job:', error);
                                  toast.error('Failed to cancel job');
                                }
                              }}
                              className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                          <span className="text-white/70 text-xs">{job.status === "processing" ? `${job.progress || 0}%` : "Pending..."}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${job.status === "processing" ? (job.progress || 0) : 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {completedJobs.length > 0 && (
                <div data-results-section className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden">
                  {/* Action Buttons - Floating */}
                  <div className="absolute top-3 right-3 z-20 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => window.open(currentJob?.resultMediaUrl!, "_blank")}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 h-8 w-8 p-0 shadow-lg"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!currentJob) return;
                        setRegenerateJob(currentJob);
                        setShowRegenerateDialog(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-8 w-8 p-0 shadow-lg"
                      title="Regenerate with different face"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!currentJob) return;
                        setShowCropDialog(true);
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-8 w-8 p-0 shadow-lg"
                      title="Crop image"
                    >
                      <Crop className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!currentJob) return;
                        try {
                          await deleteJobMutation.mutateAsync({ jobId: currentJob.id });
                          toast.success('Job deleted successfully');
                          await utils.faceSwap.getMyJobs.invalidate();
                          // Navigate to previous result if available
                          if (completedJobs.length === 1) {
                            setCurrentResultIndex(0);
                          } else if (currentResultIndex >= completedJobs.length - 1) {
                            setCurrentResultIndex(Math.max(0, currentResultIndex - 1));
                          }
                        } catch (error) {
                          toast.error('Failed to delete job');
                        }
                      }}
                      className="bg-red-500/80 hover:bg-red-600 text-white text-xs h-8 shadow-lg"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="relative">
                    {/* Navigation Arrows */}
                    {completedJobs.length > 1 && (
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-10 px-3">
                        <Button
                          onClick={() => setCurrentResultIndex(Math.max(0, currentResultIndex - 1))}
                          disabled={currentResultIndex === 0}
                          className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 rounded-full h-12 w-12 p-0 shadow-lg"
                          size="sm"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          onClick={() => setCurrentResultIndex(Math.min(completedJobs.length - 1, currentResultIndex + 1))}
                          disabled={currentResultIndex === completedJobs.length - 1}
                          className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 rounded-full h-12 w-12 p-0 shadow-lg"
                          size="sm"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </div>
                    )}

                    {/* Result Display */}
                    {currentJob?.targetMediaType === "video" ? (
                      <video
                        src={currentJob.resultMediaUrl!}
                        className="w-full h-[calc(100vh-8rem)] object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={currentJob?.resultMediaUrl || ""}
                        alt="Result"
                        className="w-full h-[calc(100vh-8rem)] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setLightboxIndex(currentResultIndex);
                          setShowLightbox(true);
                        }}
                      />
                    )}


                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All Jobs List (Full Width) */}
          {jobs && jobs.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white text-sm font-semibold">All Jobs ({jobs.length})</h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                {visibleJobs.map((job, idx) => (
                      <div
                        key={job.id}
                        onClick={() => {
                          if (job.status === "completed") {
                            const completedIndex = completedJobs.findIndex(cj => cj.id === job.id);
                            if (completedIndex !== -1) {
                              setCurrentResultIndex(completedIndex);
                              document.querySelector('[data-results-section]')?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }
                        }}
                        className={`group relative aspect-square rounded overflow-hidden cursor-pointer transition-all scale-90 ${
                          job.status === "completed" && currentJob?.id === job.id
                            ? "ring-2 ring-pink-500"
                            : "hover:ring-2 hover:ring-white/50"
                        }`}
                      >
                        <img
                          src={job.status === "completed" && job.resultMediaUrl ? job.resultMediaUrl : job.targetMediaUrl}
                          alt={`Job ${job.id}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-1 left-1 scale-75 origin-top-left">
                          {getStatusBadge(job.status, job.errorMessage)}
                        </div>

                        {/* Quick Delete Badge (always visible for completed and failed jobs) */}
                        {(job.status === "completed" || job.status === "failed") && (
                          <div className="absolute top-1 right-1 z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Delete this job?')) {
                                  try {
                                    await deleteJobMutation.mutateAsync({ jobId: job.id });
                                    toast.success('Job deleted successfully');
                                    await utils.faceSwap.getMyJobs.invalidate();
                                  } catch (error) {
                                    toast.error('Failed to delete job');
                                  }
                                }
                              }}
                              className="h-6 w-6 p-0 bg-red-500/80 hover:bg-red-600 text-white rounded-full"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {/* Retry Button for Failed Jobs */}
                        {job.status === "failed" && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 pointer-events-none">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  console.log('[Retry] Starting retry for job:', job.id);
                                  
                                  // Create new job with same source/target from failed job
                  const newJob = await createJobMutation.mutateAsync({
                    sourceImageKey: job.sourceImageKey,
                    sourceImageUrl: job.sourceImageUrl,
                    targetMediaKey: job.targetMediaKey,
                    targetMediaUrl: job.targetMediaUrl,
                    targetMediaType: job.targetMediaType,
                    modelPreference: job.modelPreference || "high_quality",
                  });
                                  console.log('[Retry] New job created:', newJob);
                                  
                                  // Delete the failed job after successful retry
                                  console.log('[Retry] Deleting failed job:', job.id);
                                  await deleteJobMutation.mutateAsync({ jobId: job.id });
                                  console.log('[Retry] Failed job deleted successfully');
                                  
                                  // Refresh job list
                                  await utils.faceSwap.getMyJobs.invalidate();
                                  
                                  toast.success('Job retried and old job deleted');
                                } catch (error) {
                                  console.error('[Retry] Error:', error);
                                  toast.error('Failed to retry job: ' + (error instanceof Error ? error.message : 'Unknown error'));
                                }
                              }}
                              className="bg-yellow-500/90 hover:bg-yellow-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold pointer-events-auto"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          </div>
                        )}

                        {/* Progress Bar for Pending/Processing */}
                        {(job.status === "pending" || job.status === "processing") && (
                          <>
                            {/* Loading Overlay */}
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center pointer-events-none">
                              <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                              <span className="text-white text-xs font-semibold">
                                {job.status === "processing" ? `${job.progress || 0}%` : "Pending..."}
                              </span>
                              {/* Action Buttons */}
                              <div className="flex gap-2 mt-2">
                                {/* Retry Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      // Cancel current job
                                      await cancelJobMutation.mutateAsync({ jobId: job.id });
                                      // Create new job with same parameters
                                      await createJobMutation.mutateAsync({
                                        sourceImageKey: job.sourceImageKey,
                                        sourceImageUrl: job.sourceImageUrl,
                                        targetMediaKey: job.targetMediaKey,
                                        targetMediaUrl: job.targetMediaUrl,
                                        targetMediaType: job.targetMediaType,
                                        modelPreference: job.modelPreference || "high_quality",
                                      });
                                      await utils.faceSwap.getMyJobs.invalidate();
                                      toast.success('Job restarted');
                                    } catch (error) {
                                      toast.error('Failed to restart job');
                                    }
                                  }}
                                  className="bg-yellow-500/80 hover:bg-yellow-600 text-white rounded-lg px-2 py-1.5 text-xs font-semibold pointer-events-auto"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                                {/* Cancel Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm('Cancel this job?')) {
                                      try {
                                        await cancelJobMutation.mutateAsync({ jobId: job.id });
                                        toast.success('Job cancelled');
                                        await utils.faceSwap.getMyJobs.invalidate();
                                      } catch (error) {
                                        toast.error('Failed to cancel job');
                                      }
                                    }
                                  }}
                                  className="bg-red-500/80 hover:bg-red-600 text-white rounded-lg px-2 py-1.5 text-xs font-semibold pointer-events-auto"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                              <div 
                                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${job.status === "processing" ? (job.progress || 0) : 10}%` }}
                              />
                            </div>
                          </>
                        )}


                      </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMoreJobs && (
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => setVisibleJobsCount(prev => prev + 20)}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    Load More ({jobs.length - visibleJobsCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Fullscreen Lightbox */}
      {showLightbox && completedJobs.length > 0 && (
        <FullscreenLightbox
          images={completedJobs
            // Filter out soft-deleted source images when viewing Before gallery
            .filter(job => lightboxType !== 'source' || !job.sourceDeletedAt)
            .map(job => ({
              url: lightboxType === 'source' ? job.sourceImageUrl : lightboxType === 'target' ? job.targetMediaUrl : job.resultMediaUrl!,
              id: job.id
            }))}
          currentIndex={lightboxIndex}
          onClose={() => {
            setShowLightbox(false);
            setLightboxType('result');
          }}
          onNavigate={(index) => {
            setLightboxIndex(index);
            setCurrentResultIndex(index);
          }}
          onDelete={async (jobId) => {
            try {
              // For source type, use soft delete (hides from Before gallery, keeps job visible)
              if (lightboxType === 'source') {
                await softDeleteSourceMutation.mutateAsync({ jobId });
                toast.success('Source image hidden from Before gallery');
              } else {
                // For result/target type, hard delete the entire job
                await deleteJobMutation.mutateAsync({ jobId });
                toast.success('Job deleted successfully');
              }
              
              await utils.faceSwap.getMyJobs.invalidate();
              
              // If we deleted the current job, close lightbox or navigate
              if (completedJobs.length === 1) {
                setShowLightbox(false);
              } else if (lightboxIndex >= completedJobs.length - 1) {
                setLightboxIndex(Math.max(0, lightboxIndex - 1));
                setCurrentResultIndex(Math.max(0, currentResultIndex - 1));
              }
            } catch (error) {
              toast.error('Failed to delete');
            }
          }}
          onSave={lightboxType === 'source' ? handleSaveFaceFromLightbox : undefined}
          showSave={lightboxType === 'source'}
        />
      )}

      {/* Saved Faces Dialog */}
      <SavedFacesDialog
        open={showSavedFaces}
        onOpenChange={setShowSavedFaces}
        onSelectFace={handleLoadSavedFace}
      />

      {/* Regenerate Dialog */}
      <RegenerateDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
        job={regenerateJob}
        onRegenerate={async (newSourceImageKey, newSourceImageUrl) => {
          if (!regenerateJob) return;
          try {
            await createJobMutation.mutateAsync({
              sourceImageKey: newSourceImageKey,
              sourceImageUrl: newSourceImageUrl,
              targetMediaKey: regenerateJob.targetMediaKey,
              targetMediaUrl: regenerateJob.targetMediaUrl,
              targetMediaType: regenerateJob.targetMediaType,
              modelPreference: regenerateJob.modelPreference || "high_quality",
            });
            toast.success('Regeneration started!');
            await utils.faceSwap.getMyJobs.invalidate();
          } catch (error) {
            toast.error('Failed to start regeneration');
            throw error;
          }
        }}
      />

      {/* Crop Dialog */}
      <CropDialog
        open={showCropDialog}
        onOpenChange={setShowCropDialog}
        imageUrl={currentJob?.resultMediaUrl || ''}
        onSave={async (croppedImageUrl) => {
          if (!currentJob) return;
          try {
            // Extract key from URL for storage
            const urlObj = new URL(croppedImageUrl);
            const croppedKey = urlObj.pathname.substring(1); // Remove leading '/'
            
            // Update job with cropped image URL
            await updateJobResultMutation.mutateAsync({
              jobId: currentJob.id,
              resultMediaUrl: croppedImageUrl,
              resultMediaKey: croppedKey,
            });
            
            // Refresh jobs to show updated image
            await utils.faceSwap.getMyJobs.invalidate();
            toast.success('Image cropped successfully!');
          } catch (error) {
            toast.error('Failed to save cropped image');
            throw error;
          }
        }}
      />

      {/* Template Gallery */}
      {showTemplateGallery && (
        <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-lg border-white/20 text-white">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-white">Template Gallery</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0">
              <TemplateGallery
                selectedTemplates={selectedTemplates}
                onSelectTemplate={handleTemplateSelect}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-white/20 flex-shrink-0 bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95">
              <Button variant="outline" onClick={() => setShowTemplateGallery(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  handleUseTemplates();
                  setShowTemplateGallery(false);
                }}
                disabled={selectedTemplates.length === 0}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Use {selectedTemplates.length} Template(s)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
