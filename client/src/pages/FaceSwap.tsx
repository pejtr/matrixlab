import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Sparkles, Loader2, UserCircle, Users, Library, ChevronLeft, ChevronRight, Download, CheckCircle, XCircle, Clock, Trash2, Bookmark, RotateCcw, Crop, X, Plus, Film, ArrowLeft, ChevronDown, UserPlus, LayoutGrid, Maximize2, Upload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useColorTheme } from "@/contexts/ColorThemeContext";
import TemplateGallery, { Template } from "@/components/TemplateGallery";

import FullscreenLightbox from "@/components/FullscreenLightbox";
import SavedFacesDialog from "@/components/SavedFacesDialog";
import RegenerateDialog from "@/components/RegenerateDialog";
import CropDialog from "@/components/CropDialog";
import AnimateDialog from "@/components/AnimateDialog";
import EnhanceButton from "@/components/EnhanceButton";
import { useFaceDetection, DetectedFace } from "@/hooks/useFaceDetection";

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
  const { themeConfig } = useColorTheme();
  
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
  // Desktop: Show all jobs initially (horizontal scroll), Mobile: 12 thumbnails
  const [visibleJobsCount, setVisibleJobsCount] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 999 : 12
  );
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerateJob, setRegenerateJob] = useState<typeof completedJobs[0] | null>(null);
  const [isDraggingSource, setIsDraggingSource] = useState(false);
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [isRegenerateMode, setIsRegenerateMode] = useState(false);
  const [regenerateSourceJobId, setRegenerateSourceJobId] = useState<number | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showAnimateDialog, setShowAnimateDialog] = useState(false);
  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [favoriteCategory, setFavoriteCategory] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [modelPreference, setModelPreference] = useState<"high_quality" | "permissive">("high_quality");
  const [preserveBody, setPreserveBody] = useState(false); // Body preservation toggle
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]); // Detected faces for Protect mode
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isExportMode, setIsExportMode] = useState(false);
  const [viewMode, setViewMode] = useState<'detail' | 'grid'>('detail'); // View mode: detail (current) or grid (fullscreen)

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  // Face detection for Protect mode
  const { isReady: isFaceDetectionReady, detectFaces } = useFaceDetection();

  const { data: jobs, refetch } = trpc.faceSwap.getMyJobs.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5000, // Cache for 5 seconds - reduces unnecessary refetches
    refetchInterval: 10000, // Poll every 10s instead of 5s
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const { data: savedFaces } = trpc.savedFaces.getMySavedFaces.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60000, // Cache saved faces for 1 minute
    refetchOnMount: false, // Don't refetch on mount if data is fresh
  });

  const createJobMutation = trpc.faceSwap.createJob.useMutation();
  const deleteJobMutation = trpc.faceSwap.deleteJob.useMutation();
  const cancelJobMutation = trpc.faceSwap.cancelJob.useMutation();
  const updateJobResultMutation = trpc.faceSwap.updateJobResult.useMutation();
  const softDeleteSourceMutation = trpc.faceSwap.softDeleteSourceImage.useMutation();
  const animateResultMutation = trpc.faceSwap.animateResult.useMutation();
  const downloadZipMutation = trpc.faceSwap.downloadJobsAsZip.useMutation();
  const utils = trpc.useUtils();

  // Get favorites for current category (for display)
  const { data: favorites } = trpc.faceSwap.getMyFavorites.useQuery(
    { category: favoriteCategory },
    { enabled: isAuthenticated && activeTab === 'favorites' }
  );
  
  // Get all favorites (for bookmark UI)
  const { data: allFavorites } = trpc.faceSwap.getAllFavorites.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: favoriteCounts } = trpc.faceSwap.getFavoriteCounts.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const addFavoriteMutation = trpc.faceSwap.addFavorite.useMutation();
  const removeFavoriteMutation = trpc.faceSwap.removeFavorite.useMutation();

  // Show all jobs (including pending/processing) so users can see target preview
  const allJobs = jobs || [];
  const completedJobs = jobs?.filter(job => job.status === "completed") || [];
  
  // Filter jobs based on active tab
  const displayJobs = activeTab === 'favorites' && favorites
    ? favorites // favorites already contains full job data from JOIN
    : jobs || [];
  
  // Get current job from displayJobs (consistent with thumbnail clicks)
  const currentJob = displayJobs[currentResultIndex];
  
  const visibleJobs = displayJobs.slice(0, visibleJobsCount);
  const hasMoreJobs = displayJobs.length > visibleJobsCount;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  
  // Detect if there are any pending/processing jobs
  const hasActiveJobs = jobs?.some(job => job.status === "pending" || job.status === "processing") || false;
  const activeJobsCount = jobs?.filter(job => job.status === "pending" || job.status === "processing").length || 0;
  
  // Calculate average progress from active jobs
  const activeJobs = jobs?.filter(job => job.status === "pending" || job.status === "processing") || [];
  const averageProgress = activeJobs.length > 0
    ? Math.round(activeJobs.reduce((sum, job) => sum + (job.progress || 0), 0) / activeJobs.length)
    : 0;

  // Infinite scroll for desktop
  useEffect(() => {
    if (!isDesktop || !hasMoreJobs) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleJobsCount(prev => prev + 12); // Load 12 more (4 rows of 3)
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isDesktop, hasMoreJobs]);

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
      
      // Automatically switch to the newest result (first in list)
      setCurrentResultIndex(0);
      
      // Haptic feedback on mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]); // Pattern: vibrate 200ms, pause 100ms, vibrate 200ms
      }
      
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

  // Sync target preview when currentResultIndex changes (arrow navigation)
  // BUT: Don't override if user has uploaded new target files (targetFiles.length > 0)
  useEffect(() => {
    if (completedJobs.length > 0 && currentJob) {
      // Only update target preview if user hasn't uploaded new files
      if (currentJob.targetMediaUrl && targetFiles.length === 0) {
        setTargetPreviews([currentJob.targetMediaUrl]);
      }
      // Update source preview to match the current job
      if (currentJob.sourceImageUrl) {
        setSourcePreview(currentJob.sourceImageUrl);
      }
    }
  }, [currentResultIndex, currentJob, targetFiles.length]);

  // Re-detect faces when Protect toggle changes
  useEffect(() => {
    const detectFacesOnToggle = async () => {
      if (preserveBody && targetFiles.length === 1 && targetFiles[0].type.startsWith('image/')) {
        if (!isFaceDetectionReady) {
          toast.info('Face detection loading...');
          return;
        }

        try {
          const faces = await detectFaces(targetFiles[0]);
          setDetectedFaces(faces);
          
          if (faces.length === 0) {
            toast.warning('No faces detected. Protect mode will use full image.');
          } else if (faces.length === 1) {
            toast.success('1 face detected');
          } else {
            toast.success(`${faces.length} faces detected (max 2 will be processed)`);
          }
        } catch (error) {
          console.error('Face detection failed:', error);
          toast.error('Face detection failed');
          setDetectedFaces([]);
        }
      } else {
        setDetectedFaces([]); // Clear faces if Protect is off
      }
    };

    detectFacesOnToggle();
  }, [preserveBody, isFaceDetectionReady]); // Re-run when Protect toggle or detection ready changes

  const handleSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSourceFile(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const processSourceFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setSourceFile(file);
    const reader = new FileReader();
    reader.onloadend = async () => {
      setSourcePreview(reader.result as string);
      toast.success('Source face loaded');
      
      // Auto-save removed - user can manually save via Save button if needed
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
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
    if (files.length > 0) {
      processTargetFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const processTargetFiles = async (files: File[]) => {
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

      // Detect faces if Protect mode is enabled and only one image file
      if (preserveBody && files.length === 1 && files[0].type.startsWith('image/')) {
        if (!isFaceDetectionReady) {
          toast.info('Face detection loading...');
          return;
        }

        try {
          const faces = await detectFaces(files[0]);
          setDetectedFaces(faces);
          
          if (faces.length === 0) {
            toast.warning('No faces detected. Protect mode will use full image.');
          } else if (faces.length === 1) {
            toast.success('1 face detected');
          } else {
            toast.success(`${faces.length} faces detected (max 2 will be processed)`);
          }
        } catch (error) {
          console.error('Face detection failed:', error);
          toast.error('Face detection failed');
          setDetectedFaces([]);
        }
      } else {
        setDetectedFaces([]); // Clear faces if Protect is off or multiple files
      }
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
  const deleteFaceMutation = trpc.savedFaces.deleteFace.useMutation();
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

      toast.success(`Face "${faceName}" saved successfully!`);
      await utils.savedFaces.getMySavedFaces.invalidate();
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

    
    if ((!sourceFile && !sourcePreview) || targetFiles.length === 0) {
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
        if (sourceFile && (sourceFile as any).__remoteUrl) {
          // Use existing URL instead of uploading
          sourceUploadData = {
            key: `remote-${Date.now()}`,
            url: (sourceFile as any).__remoteUrl,
          };
        } else if (sourceFile) {
          // Upload source file
          const sourceFormData = new FormData();
          sourceFormData.append("file", sourceFile);

          const sourceUploadRes = await fetch("/api/upload", {
            method: "POST",
            body: sourceFormData,
          });
          sourceUploadData = await sourceUploadRes.json();
        } else if (sourcePreview) {
          // Use sourcePreview URL (from saved face)
          sourceUploadData = {
            key: `preview-${Date.now()}`,
            url: sourcePreview,
          };
        } else {
          throw new Error('No source file or preview available');
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
          preserveBody: preserveBody ? 1 : 0, // Convert boolean to 0/1 for database
          faceBoxes: detectedFaces.length > 0 ? JSON.stringify(detectedFaces) : undefined,
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
        return <Badge className="bg-green-500 text-xs p-1"><RotateCcw className="h-3 w-3" /></Badge>;
      case "processing":
        return <Badge className="bg-blue-500 text-xs">Processing</Badge>;
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-x-hidden">
      {/* View Switcher - Top Right */}
      {completedJobs.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            size="sm"
            onClick={() => setViewMode(viewMode === 'detail' ? 'grid' : 'detail')}
            className="bg-white/10 backdrop-blur-lg border border-white/30 hover:bg-white/20 text-white shadow-lg"
          >
            {viewMode === 'detail' ? (
              <>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid View
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Detail View
              </>
            )}
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-3 py-3">
        <div className="max-w-7xl mx-auto">
          {viewMode === 'detail' ? (
            // DETAIL VIEW (existing layout)
            <>
          {/* Horizontal T Layout: Mobile = Inverted T (inputs side-by-side, results below), Tablet/Desktop = Horizontal T (inputs stacked left, results right) */}
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-3">
            
            {/* Left Column: Inputs (Desktop: stacked, Mobile: hidden) */}
            <div className="hidden md:block space-y-1.5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                {/* Source Face */}
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 [&>*]:p-0">
                  <CardContent className="p-0">
                    {/* Hidden file input */}
                    <input
                      ref={sourceInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleSourceFileChange}
                      className="hidden"
                    />
                    
                    {/* Grid of Saved Faces - reduced size by 40% */}
                    <div className="grid grid-cols-4 gap-0">
                      {/* Show saved faces */}
                      {savedFaces?.map((face) => (
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
                            className="group relative aspect-square cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all"
                          >
                            <img
                              src={face.faceImageUrl}
                              alt="Saved face"
                              className="w-full h-full object-cover"
                            />
                            {/* Active indicator */}
                            {sourcePreview === face.faceImageUrl && (
                              <div className="absolute inset-0 ring-2 ring-pink-500 bg-pink-500/20" />
                            )}
                            {/* Delete badge - always visible */}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await deleteFaceMutation.mutateAsync({ faceId: face.id });
                                  utils.savedFaces.getMySavedFaces.invalidate();
                                  if (sourcePreview === face.faceImageUrl) {
                                    setSourceFile(null);
                                    setSourcePreview(null);
                                  }
                                  toast.success('Saved face deleted');
                                } catch (error) {
                                  toast.error('Failed to delete saved face');
                                }
                              }}
                              className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 rounded-full p-1.5 shadow-lg transition-colors z-20 pointer-events-auto"
                            >
                              <X className="h-2.5 w-2.5 text-white" />
                            </button>
                          </div>
                        ))}
                      
                      {/* Add Face Button - always show when < 5 faces */}
                      {Array.from({ length: Math.max(1, 5 - (savedFaces?.length ?? 0)) }).map((_, index) => (
                        <div
                          key={`empty-${index}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            sourceInputRef.current?.click();
                          }}
                          className="aspect-square border-2 border-dashed border-white/30 cursor-pointer hover:border-pink-500 hover:bg-white/5 transition-all flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4 text-white/50" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Target Media */}
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardContent className="p-0.5 md:p-1.5 space-y-1">
                    <input
                      ref={targetInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                      onChange={handleTargetFileChange}
                      className="hidden"
                      multiple
                    />
                    <div
                      onClick={(e) => {
                        // Only trigger file picker if clicking on empty area or outside image
                        const target = e.target as HTMLElement;
                        const isImageClick = target.tagName === 'IMG' || target.closest('.target-label');
                        if (!isImageClick) {
                          targetInputRef.current?.click();
                        }
                      }}
                      onDrop={handleTargetDrop}
                      onDragOver={handleTargetDragOver}
                      onDragLeave={handleTargetDragLeave}
                      className={`border-2 border-dashed rounded-lg p-1 md:p-2 text-center cursor-pointer transition-all ${
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
                                onClick={(e) => {
                                  // Click on image area (not on label) opens file picker
                                  const target = e.target as HTMLElement;
                                  const labelClicked = target.closest('.target-label');
                                  if (!labelClicked) {
                                    targetInputRef.current?.click();
                                  }
                                }}
                                className={targetPreviews.length === 1 ? "w-full max-h-[12vh] md:max-h-[27vh] object-contain rounded border border-white/20 cursor-pointer hover:opacity-80 transition-opacity" : "w-full h-8 md:h-12 object-cover rounded border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"}
                              />
                              
                              {/* TARGETS label - click to open lightbox with all targets */}
                              {targetPreviews.length === 1 && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-1 pointer-events-none">
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLightboxType('target');
                                      setLightboxIndex(0); // Start from first target
                                      setShowLightbox(true);
                                    }}
                                    className="target-label text-white text-[8px] md:text-[10px] font-semibold hover:text-purple-400 transition-colors pointer-events-auto px-2 py-0.5 rounded bg-black/20 hover:bg-black/40 cursor-pointer"
                                  >
                                    TARGETS
                                  </span>
                                </div>
                              )}
                              
                              {/* Keep Body Proportions Badge - only on single preview */}
                              {targetPreviews.length === 1 && (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreserveBody(!preserveBody);
                                  }}
                                  className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 cursor-pointer hover:bg-black/80 transition-colors flex items-center gap-1.5"
                                >
                                  <input
                                    type="checkbox"
                                    checked={preserveBody}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setPreserveBody(e.target.checked);
                                    }}
                                    className="w-3 h-3 rounded border-white/30 bg-white/10 text-pink-500 focus:ring-0 focus:outline-none cursor-pointer"
                                  />
                                  <span className="text-white/90 text-[9px]">Protect</span>
                                </div>
                              )}

                              {/* Delete button */}
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newFiles = Array.from(targetFiles).filter((_, i) => i !== idx);
                                  const newPreviews = targetPreviews.filter((_, i) => i !== idx);
                                  setTargetFiles(newFiles);
                                  setTargetPreviews(newPreviews);
                                  toast.success('Target media removed');
                                }}
                                className="absolute top-1 right-1 h-5 w-5 p-0 bg-red-500/90 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </Button>
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
                    
                    {/* Templates + AI Model + Generate Row (20:40:40) */}
                    <div className="grid grid-cols-10 gap-2 mt-2">
                      {/* Templates Button - 20% (2/10) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTemplateGallery(!showTemplateGallery);
                        }}
                        className="col-span-2 h-7 md:h-9 bg-transparent border-white/30 text-white hover:bg-white/10 text-[10px] px-1"
                        title="Templates"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      
                      {/* AI Model Select - 40% (4/10) */}
                      <select
                      value={modelPreference}
                      onChange={(e) => setModelPreference(e.target.value as 'high_quality' | 'permissive')}
                      className="h-7 md:h-9 text-[10px] md:text-sm bg-white/10 border border-white/20 rounded-lg px-1 md:px-2 text-white focus:ring-0 focus:outline-none w-1/2"
                      >
                        <option value="high_quality" className="bg-gray-900">HQ (fast, no nude)</option>
                        <option value="permissive" className="bg-gray-900">LQ (slower, better quality, nude allowed)</option>
                      </select>
                      
                      {/* Generate Button - 40% (4/10) */}
                        <Button
                          onClick={handleSubmit}
                          disabled={(!sourceFile && !sourcePreview) || targetFiles.length === 0 || isUploading}
                        className={`col-span-4 bg-gradient-to-r from-${themeConfig.accent} to-${themeConfig.secondary} hover:from-${themeConfig.accentHover} hover:to-${themeConfig.secondaryHover} h-7 md:h-9 text-xs md:text-sm`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                            <span className="hidden lg:inline ml-1">{uploadProgress.current}/{uploadProgress.total}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden lg:inline ml-1">Generate</span>
                          </>
                        )}
                      </Button>
                    </div>
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





            </div>

            {/* Right Column: Results (Desktop: full height, Mobile: below inputs) */}
            <div className="space-y-4">
              {/* Results Section */}
              {/* Loading State - Show when processing */}
              {(jobs && jobs.some(j => j.status === "pending" || j.status === "processing") && completedJobs.length === 0) ? (
                <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden">
                  {/* Show target preview during generation */}
                  {targetPreviews.length > 0 && (
                    <div className="relative">
                      <img 
                        src={targetPreviews[0]} 
                        alt="Target preview" 
                        className="w-full h-[48vh] object-contain"
                      />
                      {/* Loading overlay */}
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className={`h-16 w-16 text-${themeConfig.accent} animate-spin mb-4 mx-auto`} />
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
                      <Loader2 className={`h-16 w-16 text-${themeConfig.accent} animate-spin mb-4`} />
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
                          <Loader2 className={`h-4 w-4 animate-spin text-${themeConfig.accent}`} />
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
                            className={`h-full bg-gradient-to-r from-${themeConfig.accent} to-${themeConfig.secondary} transition-all duration-500`}
                            style={{ width: `${job.status === "processing" ? (job.progress || 0) : 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : allJobs.length > 0 ? (
                <div data-results-section className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden mb-0">
                  {/* Action Buttons - Above Image */}
                  <div className="flex flex-wrap justify-center gap-1 md:gap-2 p-1.5 md:p-3 border-b border-white/10">
                    <Button
                      size="sm"
                      onClick={() => {
                        targetInputRef.current?.click();
                      }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-7 w-7 md:h-8 md:w-8 p-0 shadow-lg"
                      title="Upload target image"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!currentJob?.resultMediaUrl) return;
                        try {
                          toast.info('Downloading...');
                          const response = await fetch(currentJob.resultMediaUrl, {
                            mode: 'cors',
                            credentials: 'omit'
                          });
                          if (!response.ok) throw new Error('Download failed');
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `faceswap-result-${currentJob.id}.${currentJob.targetMediaType === 'video' ? 'mp4' : 'jpg'}`;
                          a.style.display = 'none';
                          document.body.appendChild(a);
                          a.click();
                          setTimeout(() => {
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          }, 100);
                          toast.success('Download started');
                        } catch (error) {
                          console.error('Download failed:', error);
                          toast.error('Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                        }
                      }}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 h-7 w-7 md:h-8 md:w-8 p-0 shadow-lg"
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
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-7 w-7 md:h-8 md:w-8 p-0 shadow-lg"
                      title="Generate with different face"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!currentJob) return;
                        setShowCropDialog(true);
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-7 w-7 md:h-8 md:w-8 p-0 shadow-lg"
                      title="Crop image"
                    >
                      <Crop className="h-4 w-4" />
                    </Button>
                    {currentJob?.targetMediaType === 'image' && (
                      <>
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!currentJob?.resultMediaUrl) return;
                            try {
                              toast.info('Saving face...');
                              // Use result image as new source face
                              const response = await fetch(currentJob.resultMediaUrl);
                              const blob = await response.blob();
                              const file = new File([blob], `saved-face-${Date.now()}.jpg`, { type: 'image/jpeg' });
                              setSourceFile(file);
                              setSourcePreview(currentJob.resultMediaUrl);
                              toast.success('Face saved! Ready to use for generation.');
                            } catch (error) {
                              console.error('Failed to save face:', error);
                              toast.error('Failed to save face');
                            }
                          }}
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 h-7 w-7 md:h-8 md:w-8 p-0 shadow-lg"
                          title="Save as Face (use result as source face)"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <EnhanceButton 
                          imageUrl={currentJob.resultMediaUrl!}
                          jobId={currentJob.id}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!currentJob) return;
                            setShowAnimateDialog(true);
                          }}
                          disabled={animateResultMutation.isPending}
                          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-7 w-7 md:h-8 md:w-8 p-0 shadow-lg"
                          title="Animate with AI (Image to Video)"
                        >
                          {animateResultMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Film className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
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
                            // Clear target files and previews when deleting the last result
                            setTargetFiles([]);
                            setTargetPreviews([]);
                            if (targetInputRef.current) {
                              targetInputRef.current.value = '';
                            }
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
                  
                  <div className="relative h-[60vh] md:h-[72vh] overflow-hidden">
                    {/* Navigation Arrows */}
                    {completedJobs.length > 1 && (
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-10 px-3">
                          <Button
                          onClick={() => {
                            const newIndex = Math.max(0, currentResultIndex - 1);
                            setCurrentResultIndex(newIndex);
                            // Update target preview to match selected job
                            const newJob = displayJobs[newIndex];
                            if (newJob?.targetMediaUrl) {
                              setTargetPreviews([newJob.targetMediaUrl]);
                            }
                            // Update source preview (FACE badge) to match selected job
                            if (newJob?.sourceImageUrl) {
                              setSourcePreview(newJob.sourceImageUrl);
                            }
                          }}
                          disabled={currentResultIndex === 0}
                          className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 rounded-full h-12 w-12 p-0 shadow-lg"
                          size="sm"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                          <Button
                          onClick={() => {
                            const newIndex = Math.min(displayJobs.length - 1, currentResultIndex + 1);
                            setCurrentResultIndex(newIndex);
                            // Update target preview to match selected job
                            const newJob = displayJobs[newIndex];
                            if (newJob?.targetMediaUrl) {
                              setTargetPreviews([newJob.targetMediaUrl]);
                            }
                            // Update source preview (FACE badge) to match selected job
                            if (newJob?.sourceImageUrl) {
                              setSourcePreview(newJob.sourceImageUrl);
                            }
                          }}
                          disabled={currentResultIndex === displayJobs.length - 1}
                          className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 rounded-full h-12 w-12 p-0 shadow-lg"
                          size="sm"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </div>
                    )}

                    {/* Result Display */}
                    <div className="relative h-[60vh] md:h-[70vh]">
                      {currentJob?.targetMediaType === "video" ? (
                        <video
                          src={currentJob.resultMediaUrl!}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <div className="relative w-full h-[60vh] md:h-[70vh]">
                          {/* Show original target image during processing */}
                          {currentJob?.status !== "completed" && currentJob?.targetMediaUrl && (
                            <img
                              src={currentJob.targetMediaUrl}
                              alt="Original"
                              className="absolute inset-0 w-full h-full object-contain"
                            />
                          )}
                          {/* Show result with fade-in animation when completed */}
                          {currentJob?.status === "completed" && currentJob?.resultMediaUrl && (
                            <img
                              key={currentJob.id}
                              src={currentJob.resultMediaUrl}
                              alt="Result"
                              className="absolute inset-0 w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity animate-in fade-in slide-in-from-right-4 duration-700"
                              onClick={() => {
                                setLightboxIndex(currentResultIndex);
                                setShowLightbox(true);
                              }}
                            />
                          )}
                        </div>
                      )}
                      
                      {/* USED FACE Badge - Top Left (Desktop shows current, Mobile shows selector) */}
                      {(currentJob || !currentJob) && (
                        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                          {/* Used Face Badge (source face used) */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Mobile: Open saved faces dialog
                              if (window.innerWidth < 768) {
                                setShowSavedFaces(true);
                                return;
                              }
                              // Desktop: Load current job's face
                              if (!currentJob) return;
                              try {
                                const response = await fetch(currentJob.sourceImageUrl, { mode: 'no-cors' });
                                const blob = await response.blob();
                                const file = new File([blob], 'face.jpg', { type: blob.type || 'image/jpeg' });
                                setSourceFile(file);
                                setSourcePreview(currentJob.sourceImageUrl);
                                toast.success('Face loaded');
                              } catch (error) {
                                toast.error('Failed to load face');
                              }
                            }}
                            className="group relative w-14 h-14 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-white/40 hover:border-pink-500 transition-all shadow-lg hover:scale-105 cursor-pointer bg-white/10 backdrop-blur-sm"
                            title={currentJob ? "Click to use as source face" : "Select face"}
                          >
                            {(sourcePreview || currentJob?.sourceImageUrl) ? (
                              <img
                                src={sourcePreview || currentJob?.sourceImageUrl}
                                alt="Face"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <UserCircle className="h-8 w-8 md:h-12 md:w-12 text-white/70" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-1 pointer-events-none">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (currentJob?.sourceImageUrl) {
                                    setLightboxType('source');
                                    setLightboxIndex(0);
                                    setShowLightbox(true);
                                  }
                                }}
                                className="text-white text-[8px] md:text-[10px] font-semibold hover:text-pink-400 transition-colors pointer-events-auto px-2 py-0.5 rounded bg-black/20 hover:bg-black/40 cursor-pointer"
                              >
                                FACE
                              </span>
                            </div>
                            {/* Upload Progress Overlay */}
                            {isUploading && sourceFile && (
                              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
                                <Loader2 className={`h-6 w-6 text-${themeConfig.accent} animate-spin mb-1`} />
                                <span className="text-white text-[8px] font-semibold">Uploading...</span>
                              </div>
                            )}
                            {/* Generating Progress Overlay */}
                            {!isUploading && hasActiveJobs && (
                              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
                                <Loader2 className={`h-6 w-6 text-${themeConfig.accent} animate-spin mb-1`} />
                                <span className="text-white text-[8px] font-semibold">
                                  {averageProgress > 0 ? `${averageProgress}%` : "Pending..."}
                                </span>
                              </div>
                            )}
                          </button>
                        </div>
                      )}
                      
                      {/* Model Info Badge - Below FACE badge */}
                      {currentJob && (
                        <div className="absolute top-[4.5rem] left-2 md:top-[6.5rem] md:left-4 z-10">
                          <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/30 shadow-lg">
                            <span className="text-white text-[8px] md:text-[10px] font-semibold">
                              {currentJob.modelPreference === 'high_quality' ? '⚡ HQ (Fast)' : '🛡️ LQ (Quality)'}
                            </span>
                          </div>
                        </div>
                      )}

                      
                      {/* TARGET Badge - Bottom Left (All devices) */}
                      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            targetInputRef.current?.click();
                          }}
                          className="group relative w-14 h-14 rounded-lg overflow-hidden border-2 border-white/40 hover:border-purple-500 transition-all shadow-lg hover:scale-105 cursor-pointer bg-white/10 backdrop-blur-sm"
                          title="Upload target media"
                        >
                          {targetPreviews.length > 0 ? (
                            <img
                              src={targetPreviews[0]}
                              alt="Target"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users className="h-8 w-8 text-white/70" />
                            </div>
                          )}
                          {/* Label */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-1 pointer-events-none">
                            <span className="text-white text-[8px] font-semibold">TARGET</span>
                          </div>
                          {/* Upload Progress Overlay */}
                          {isUploading && targetFiles.length > 0 && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
                              <Loader2 className={`h-6 w-6 text-${themeConfig.accent} animate-spin mb-1`} />
                              <span className="text-white text-[8px] font-semibold">Uploading...</span>
                            </div>
                          )}
                        </button>
                      </div>

                      {/* Generate Button - Bottom Right (Mobile only) */}
                      <div className="md:hidden absolute bottom-2 right-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubmit();
                          }}
                          disabled={(!sourceFile && !sourcePreview) || targetFiles.length === 0 || isUploading}
                          className={`relative w-14 h-14 rounded-full bg-gradient-to-r from-${themeConfig.accent} to-${themeConfig.secondary} hover:from-${themeConfig.accentHover} hover:to-${themeConfig.secondaryHover} disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/40 shadow-lg hover:scale-105 transition-all flex items-center justify-center`}
                          title="Generate"
                        >
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          ) : (
                            <Sparkles className="h-6 w-6 text-white" />
                          )}
                          {/* Queue Counter Badge */}
                          {activeJobsCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">{activeJobsCount}</span>
                            </div>
                          )}
                        </button>
                      </div>
                      
                      {/* AI Model Selector + Keep Body - Bottom of Image (Mobile only) */}
                      <div className="md:hidden absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-1 items-center w-1/2">
                        <select
                          value={modelPreference}
                          onChange={(e) => {
                            e.stopPropagation();
                            setModelPreference(e.target.value as "high_quality" | "permissive");
                          }}
                          className="w-full px-2 py-1 rounded-md bg-white/10 backdrop-blur-lg border border-white/40 text-white text-[9px] font-semibold focus:outline-none focus:ring-0 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="high_quality" className="bg-gray-900">HQ (fast, no nude)</option>
                          <option value="permissive" className="bg-gray-900">LQ (slower, better quality, nude allowed)</option>
                        </select>
                        
                        {/* Keep Body Checkbox */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreserveBody(!preserveBody);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-lg border border-white/40 cursor-pointer hover:bg-white/20 transition-colors shadow-lg"
                        >
                          <input
                            type="checkbox"
                            checked={preserveBody}
                            onChange={(e) => {
                              e.stopPropagation();
                              setPreserveBody(e.target.checked);
                            }}
                            className="w-3 h-3 rounded border-white/30 bg-white/10 text-pink-500 focus:ring-0 focus:outline-none cursor-pointer"
                          />
                          <span className="text-white text-[9px] whitespace-nowrap">Protect</span>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              ) : (
                <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden h-[64vh] flex items-center justify-center">
                  <div className="text-center px-8">
                    <UserCircle className="h-16 w-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-white/70 text-lg font-semibold mb-2">No Results Yet</h3>
                    <p className="text-white/50 text-sm">Upload a face and target media to get started</p>
                  </div>
                </div>
              )}

              {/* All Jobs Grid - Desktop only, in right column below main result */}
              {jobs && jobs.length > 0 && (
                <div className="hidden md:block mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-1 items-center flex-wrap">
                      <Button
                        variant={activeTab === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('all')}
                        className={`text-[10px] h-6 px-2 ${
                          activeTab === 'all' 
                            ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                            : 'bg-transparent border-white/30 text-white hover:bg-white/10'
                        }`}
                      >
                        All ({jobs.length})
                      </Button>
                      {/* Favorites Category Buttons - Icon Only */}
                      {[1, 2, 3].map((cat) => (
                        <Button
                          key={cat}
                          variant={activeTab === 'favorites' && favoriteCategory === cat ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setActiveTab('favorites');
                            setFavoriteCategory(cat as 1 | 2 | 3 | 4 | 5);
                          }}
                          className={`h-6 w-6 p-0 relative ${
                            activeTab === 'favorites' && favoriteCategory === cat
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                              : 'bg-transparent border-white/30 text-white hover:bg-white/10'
                          }`}
                          title={`Favorites ${cat}`}
                        >
                          <Bookmark className="h-3 w-3" fill={activeTab === 'favorites' && favoriteCategory === cat ? 'white' : 'none'} />
                          {(favoriteCounts?.[cat] || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center font-bold">
                              {favoriteCounts?.[cat]}
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Scrollable Grid Container - Single Row Horizontal Scroll */}
                  <div className="overflow-x-auto overflow-y-hidden pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) transparent' }}>
                    <div className="flex gap-1.5 max-w-[1200px]">
                      {visibleJobs.map((job, idx) => (
                        <div
                          key={job.id}
                          onClick={() => {
                            // Find index in displayJobs array (consistent with currentJob)
                            const jobIndex = displayJobs.findIndex(j => j.id === job.id);
                            if (jobIndex !== -1) {
                              setCurrentResultIndex(jobIndex);
                              if (job.targetMediaUrl) {
                                setTargetPreviews([job.targetMediaUrl]);
                              }
                            }
                          }}
                          className={`group relative aspect-square rounded overflow-hidden cursor-pointer transition-all flex-shrink-0 w-24 h-24 ${
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
                          
                          {/* Status Badge (only for non-completed) */}
                          {job.status !== "completed" && (
                            <div className="absolute top-0.5 left-0.5 scale-75 origin-top-left">
                              {getStatusBadge(job.status, job.errorMessage)}
                            </div>
                          )}

                          {/* Favorite Badge (top-right, always visible for completed jobs) */}
                          {job.status === "completed" && allFavorites?.find(f => f.jobId === job.id) && (
                            <div className="absolute top-0.5 right-0.5 bg-yellow-500 rounded-full p-0.5 shadow-lg z-10">
                              <Bookmark className="h-2 w-2 text-white fill-white" />
                            </div>
                          )}

                          {/* Download Button (bottom-left, visible on hover) */}
                          {!isExportMode && job.status === "completed" && job.resultMediaUrl && (
                            <div className="absolute bottom-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    toast.info('Downloading...');
                                    const response = await fetch(job.resultMediaUrl!, {
                                      mode: 'cors',
                                      credentials: 'omit',
                                    });
                                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `faceswap-result-${job.id}.${job.targetMediaType === 'video' ? 'mp4' : 'jpg'}`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                    toast.success('Download started');
                                  } catch (error) {
                                    console.error('Download error:', error);
                                    toast.error('Download failed');
                                  }
                                }}
                                className="h-4 w-4 p-0 bg-green-500/80 hover:bg-green-600 text-white rounded-full"
                              >
                                <Download className="h-2 w-2" />
                              </Button>
                            </div>
                          )}

                          {/* Delete Button (bottom-right, visible on hover) */}
                          {!isExportMode && job.status === "completed" && (
                            <div className="absolute bottom-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                                className="h-4 w-4 p-0 bg-red-500/80 hover:bg-red-600 text-white rounded-full"
                              >
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </div>
                          )}

                          {/* Retry Button for Failed Jobs */}
                          {!isExportMode && job.status === "failed" && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1 pointer-events-none">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const newJob = await createJobMutation.mutateAsync({
                                      sourceImageKey: job.sourceImageKey,
                                      sourceImageUrl: job.sourceImageUrl,
                                      targetMediaKey: job.targetMediaKey,
                                      targetMediaUrl: job.targetMediaUrl,
                                      targetMediaType: job.targetMediaType,
                                      modelPreference: job.modelPreference || "high_quality",
                                    });
                                    await deleteJobMutation.mutateAsync({ jobId: job.id });
                                    await utils.faceSwap.getMyJobs.invalidate();
                                    toast.success('Job retried');
                                  } catch (error) {
                                    toast.error('Failed to retry job');
                                  }
                                }}
                                className="bg-yellow-500/90 hover:bg-yellow-600 text-white rounded px-1.5 py-0.5 text-[9px] font-semibold pointer-events-auto"
                              >
                                <RotateCcw className="h-2 w-2 mr-0.5" />
                                Retry
                              </Button>
                            </div>
                          )}

                          {/* Cancel button for Pending/Processing (top-right) */}
                          {(job.status === "pending" || job.status === "processing") && (
                            <div className="absolute top-0.5 right-0.5 z-10">
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
                                className="h-4 w-4 p-0 bg-red-500/80 hover:bg-red-600 text-white rounded-full"
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All Jobs List (Mobile only - Full Width) */}
          {jobs && jobs.length > 0 && (
            <div className="mt-2 md:hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2 items-center">
                  <Button
                    variant={activeTab === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('all')}
                    className={`text-xs ${
                      activeTab === 'all' 
                        ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                        : 'bg-transparent border-white/30 text-white hover:bg-white/10'
                    }`}
                  >
                    All Jobs ({jobs.length})
                  </Button>
                  {/* Favorites Category Buttons - Icon Only */}
                  {[1, 2, 3].map((cat) => (
                    <Button
                      key={cat}
                      variant={activeTab === 'favorites' && favoriteCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActiveTab('favorites');
                        setFavoriteCategory(cat as 1 | 2 | 3 | 4 | 5);
                      }}
                      className={`h-7 w-7 p-0 relative ${
                        activeTab === 'favorites' && favoriteCategory === cat
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'bg-transparent border-white/30 text-white hover:bg-white/10'
                      }`}
                      title={`Favorites ${cat}`}
                    >
                      <Bookmark className="h-3.5 w-3.5" fill={activeTab === 'favorites' && favoriteCategory === cat ? 'white' : 'none'} />
                      {(favoriteCounts?.[cat] || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                          {favoriteCounts?.[cat]}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  {/* Select All Button - Activates Export Mode */}
                  {visibleJobs.filter(j => j.status === 'completed').length > 0 && (
                    <>
                      {!isExportMode ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsExportMode(true);
                            // Auto-select all completed jobs
                            const completedJobIds = visibleJobs.filter(j => j.status === 'completed').map(j => j.id);
                            const newSet = new Set<number>();
                            completedJobIds.forEach(id => newSet.add(id));
                            setSelectedJobs(newSet);
                          }}
                          className="text-xs bg-transparent border-white/30 text-white hover:bg-white/10"
                          variant="outline"
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            readOnly
                            className="w-3 h-3 mr-1.5 rounded border-white/30 bg-white/10 pointer-events-none"
                          />
                          Select All
                        </Button>
                      ) : (
                        <>
                          {/* Cancel Button */}
                          <Button
                            size="sm"
                            onClick={() => {
                              setIsExportMode(false);
                              setSelectedJobs(new Set());
                            }}
                            className="text-xs bg-transparent border-white/30 text-white hover:bg-white/10"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          {/* Select All Checkbox */}
                          <label className="flex items-center gap-2 text-white/70 text-xs cursor-pointer hover:text-white transition-colors">
                            <input
                              type="checkbox"
                              checked={visibleJobs.filter(j => j.status === 'completed').every(j => selectedJobs.has(j.id))}
                              onChange={(e) => {
                                const completedJobIds = visibleJobs.filter(j => j.status === 'completed').map(j => j.id);
                                if (e.target.checked) {
                                  const newSet = new Set(selectedJobs);
                                  completedJobIds.forEach(id => newSet.add(id));
                                  setSelectedJobs(newSet);
                                } else {
                                  const newSet = new Set(selectedJobs);
                                  completedJobIds.forEach(id => newSet.delete(id));
                                  setSelectedJobs(newSet);
                                }
                              }}
                              className="w-4 h-4 rounded border-white/30 bg-white/10 text-pink-500 focus:ring-0 focus:outline-none cursor-pointer"
                            />
                            Select All
                          </label>
                        </>
                      )}
                    </>
                  )}
                  {/* Download Selected Button */}
                  {isExportMode && selectedJobs.size > 0 && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        setIsDownloadingZip(true);
                        try {
                          const jobIds = Array.from(selectedJobs);
                          const result = await downloadZipMutation.mutateAsync({ jobIds });
                          
                          // Convert base64 to blob
                          const binaryString = atob(result.zipData);
                          const bytes = new Uint8Array(binaryString.length);
                          for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                          }
                          const blob = new Blob([bytes], { type: 'application/zip' });
                          
                          // Download
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `faceswap-results-${Date.now()}.zip`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          
                          toast.success(`Downloaded ${selectedJobs.size} results`);
                          setSelectedJobs(new Set());
                        } catch (error) {
                          console.error('Download error:', error);
                          toast.error('Failed to download ZIP');
                        } finally {
                          setIsDownloadingZip(false);
                        }
                      }}
                      disabled={isDownloadingZip}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    >
                      {isDownloadingZip ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Download {selectedJobs.size} as ZIP
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-12 gap-2 max-w-[1400px] mx-auto">
                {visibleJobs.map((job, idx) => (
                      <div
                        key={job.id}
                        onClick={() => {
                          // Find index in displayJobs array (consistent with currentJob)
                          const jobIndex = displayJobs.findIndex(j => j.id === job.id);
                          if (jobIndex !== -1) {
                            setCurrentResultIndex(jobIndex);
                            // Update target preview to match selected job
                            if (job.targetMediaUrl) {
                              setTargetPreviews([job.targetMediaUrl]);
                            }
                          }
                        }}
                        className={`group relative aspect-square rounded overflow-hidden cursor-pointer transition-all scale-108 ${
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
                        
                        {/* Status Badge (only for non-completed) */}
                        {job.status !== "completed" && (
                          <div className="absolute top-1 left-1 scale-75 origin-top-left">
                            {getStatusBadge(job.status, job.errorMessage)}
                          </div>
                        )}

                        {/* Selection Checkbox (top-right) */}
                        {isExportMode && job.status === "completed" && (
                          <div className="absolute top-1 right-1 z-20">
                            <label className="flex items-center justify-center w-6 h-6 bg-black/70 backdrop-blur-sm rounded border-2 border-white/50 cursor-pointer hover:bg-black/90 transition-all">
                              <input
                                type="checkbox"
                                checked={selectedJobs.has(job.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newSet = new Set(selectedJobs);
                                  if (e.target.checked) {
                                    newSet.add(job.id);
                                  } else {
                                    newSet.delete(job.id);
                                  }
                                  setSelectedJobs(newSet);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-white bg-white/20 checked:bg-green-500 checked:border-green-500 focus:ring-0 focus:outline-none cursor-pointer"
                              />
                            </label>
                          </div>
                        )}

                        {/* Download Button (bottom-right, visible on hover) */}
                        {!isExportMode && job.status === "completed" && job.resultMediaUrl && (
                          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  toast.info('Downloading...');
                                  const response = await fetch(job.resultMediaUrl!, {
                                    mode: 'cors',
                                    credentials: 'omit',
                                  });
                                  if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `faceswap-result-${job.id}.${job.targetMediaType === 'video' ? 'mp4' : 'jpg'}`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                  toast.success('Download started');
                                } catch (error) {
                                  console.error('Download error:', error);
                                  toast.error('Download failed');
                                }
                              }}
                              className="h-5 w-5 p-0 bg-green-500/80 hover:bg-green-600 text-white rounded-full"
                            >
                              <Download className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        )}

                        {/* Bookmark Icon (top-left) */}
                        {job.status === "completed" && (
                          <div className="absolute top-1 left-1 z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  // Check if already favorited in any category
                                  const existingFavorite = allFavorites?.find(f => f.jobId === job.id);
                                  
                                  if (existingFavorite) {
                                    // Cycle to next category (1→2→3→4→5→remove)
                                    if (existingFavorite.category === 5) {
                                      // Remove from favorites
                                      await removeFavoriteMutation.mutateAsync({ 
                                        jobId: job.id, 
                                        category: existingFavorite.category 
                                      });
                                      toast.success('Removed from favorites');
                                    } else {
                                      // Remove from current category and add to next
                                      await removeFavoriteMutation.mutateAsync({ 
                                        jobId: job.id, 
                                        category: existingFavorite.category 
                                      });
                                      const nextCategory = (existingFavorite.category + 1) as 1 | 2 | 3;
                                      await addFavoriteMutation.mutateAsync({ 
                                        jobId: job.id, 
                                        category: nextCategory 
                                      });
                                      toast.success(`Moved to Favorites${nextCategory}`);
                                    }
                                  } else {
                                    // Add to Favorites1
                                    await addFavoriteMutation.mutateAsync({ 
                                      jobId: job.id, 
                                      category: 1 
                                    });
                                    toast.success('Added to Favorites1');
                                  }
                                  
                                  await utils.faceSwap.getAllFavorites.invalidate();
                                  await utils.faceSwap.getMyFavorites.invalidate();
                                  await utils.faceSwap.getFavoriteCounts.invalidate();
                                } catch (error) {
                                  toast.error('Failed to update favorites');
                                }
                              }}
                              className="h-5 w-5 p-0 bg-yellow-500/80 hover:bg-yellow-600 text-white rounded-full relative"
                            >
                              <Bookmark className="h-2.5 w-2.5" fill={allFavorites?.find(f => f.jobId === job.id) ? 'white' : 'none'} />
                              {allFavorites?.find(f => f.jobId === job.id) && (
                                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center font-bold">
                                  {allFavorites.find(f => f.jobId === job.id)?.category}
                                </span>
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {/* Delete Icon (top-right) - 40% smaller */}
                        {!isExportMode && (job.status === "completed" || job.status === "pending" || job.status === "processing") && (
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
                              className="h-5 w-5 p-0 bg-red-500/80 hover:bg-red-600 text-white rounded-full"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        )}
                        {!isExportMode && job.status === "failed" && (
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
                              className="h-5 w-5 p-0 bg-red-500/80 hover:bg-red-600 text-white rounded-full"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        )}

                        {/* Retry Button for Failed Jobs */}
                        {!isExportMode && job.status === "failed" && (
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

                        {/* Cancel button for Pending/Processing (top-right) */}
                        {(job.status === "pending" || job.status === "processing") && (
                          <div className="absolute top-1 right-1 z-10">
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
                              className="h-5 w-5 p-0 bg-red-500/80 hover:bg-red-600 text-white rounded-full"
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        )}


                      </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMoreJobs && (
                <div className="flex justify-center mt-4">
                  <button
                    ref={loadMoreRef}
                    onClick={() => setVisibleJobsCount(prev => prev + 12)}
                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-110 shadow-lg"
                    title={`Načíst další (${displayJobs.length - visibleJobsCount})`}
                  >
                    <ChevronDown className="h-5 w-5 text-white group-hover:animate-bounce" />
                  </button>
                </div>
              )}
            </div>
          )}
            </>
          ) : (
            // GRID VIEW (left panel + grid layout)
            <div className="flex gap-4">
              {/* Left Panel - 310px wide */}
              <div className="w-[310px] flex-shrink-0 space-y-3">
                {/* Thumbnails Grid - 4:3 portrait with scrolling */}
                <div className="max-h-[40vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) transparent' }}>
                  <div className="grid grid-cols-2 gap-2">
                  {completedJobs.map((job, idx) => (
                    <div
                      key={job.id}
                      className={`relative group cursor-pointer bg-white/10 backdrop-blur-lg border rounded-lg overflow-hidden hover:border-pink-500 transition-all ${
                        currentJob?.id === job.id
                          ? "ring-2 ring-pink-500 border-pink-500"
                          : "border-white/20"
                      }`}
                      onClick={() => {
                        setCurrentResultIndex(idx);
                      }}
                    >
                      {/* Result Image/Video - 4:3 portrait aspect ratio */}
                      {job.targetMediaType === 'video' ? (
                        <video
                          src={job.resultMediaUrl!}
                          className="w-full aspect-[3/4] object-cover"
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                      ) : (
                        <img
                          src={job.resultMediaUrl!}
                          alt="Result"
                          className="w-full aspect-[3/4] object-cover"
                        />
                      )}

                      {/* Hover Overlay with Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                        {/* Quick Actions */}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!job.resultMediaUrl) return;
                              try {
                                const response = await fetch(job.resultMediaUrl);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `faceswap-${job.id}.${job.targetMediaType === 'video' ? 'mp4' : 'jpg'}`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                toast.success('Downloaded');
                              } catch (error) {
                                toast.error('Download failed');
                              }
                            }}
                            className="bg-pink-500 hover:bg-pink-600 h-6 w-6 p-0"
                            title="Download"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentResultIndex(idx);
                              setLightboxIndex(idx);
                              setShowLightbox(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 h-6 w-6 p-0"
                            title="View Full"
                          >
                            <Maximize2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Model Badge */}
                        <div className="px-1.5 py-0.5 rounded-md bg-black/80 border border-white/30">
                          <span className="text-white text-[8px] font-semibold">
                            {job.modelPreference === 'high_quality' ? '⚡ HQ' : '🎨 LQ'}
                          </span>
                        </div>
                      </div>

                      {/* Face Badge - Top Left */}
                      <div className="absolute top-1 left-1 z-10">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white/40 shadow-lg bg-white/10 backdrop-blur-sm">
                          <img
                            src={job.sourceImageUrl}
                            alt="Face"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>

                {/* Preview Area - Bottom of left panel */}
                {currentJob && (
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-3 space-y-2">
                    <div className="text-white text-sm font-semibold">Preview</div>
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-black/20">
                      {currentJob.targetMediaType === 'video' ? (
                        <video
                          src={currentJob.resultMediaUrl!}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={currentJob.resultMediaUrl!}
                          alt="Preview"
                          className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            setLightboxIndex(currentResultIndex);
                            setShowLightbox(true);
                          }}
                        />
                      )}
                    </div>
                    <Button
                      onClick={() => setViewMode('detail')}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      size="sm"
                    >
                      Open Detail View
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Grid Area - Takes remaining space */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2">
                  {completedJobs.map((job, idx) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        if (job.status === "completed") {
                          const completedIndex = completedJobs.findIndex(cj => cj.id === job.id);
                          if (completedIndex !== -1) {
                            setCurrentResultIndex(completedIndex);
                            if (job.targetMediaUrl) {
                              setTargetPreviews([job.targetMediaUrl]);
                            }
                          }
                        }
                      }}
                      className={`group relative aspect-square rounded overflow-hidden cursor-pointer transition-all ${
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
                      
                      {/* Status Badge (only for non-completed) */}
                      {job.status !== "completed" && (
                        <div className="absolute top-1 left-1 scale-75 origin-top-left">
                          {getStatusBadge(job.status, job.errorMessage)}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Load More Button */}
                  {hasMoreJobs && (
                    <div className="col-span-full flex items-center justify-center py-8">
                      <button
                        onClick={() => setVisibleJobsCount(prev => prev + 12)}
                        className="group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-110 shadow-lg"
                        title={`Načíst další (${displayJobs.length - visibleJobsCount})`}
                      >
                        <ChevronDown className="h-5 w-5 text-white group-hover:animate-bounce" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fullscreen Lightbox */}
      {showLightbox && (lightboxType === 'target' ? completedJobs.length > 0 : completedJobs.length > 0) && (
        <FullscreenLightbox
          images={lightboxType === 'target' 
            ? (() => {
                // Get unique target images (remove duplicates)
                const uniqueTargets = new Map<string, { url: string; id: number }>();
                completedJobs.forEach(job => {
                  if (!uniqueTargets.has(job.targetMediaUrl)) {
                    uniqueTargets.set(job.targetMediaUrl, {
                      url: job.targetMediaUrl,
                      id: job.id
                    });
                  }
                });
                return Array.from(uniqueTargets.values());
              })()
            : lightboxType === 'source'
              ? (() => {
                  // Get unique source images (remove duplicates)
                  const uniqueSources = new Map<string, { url: string; id: number }>();
                  completedJobs
                    .filter(job => !job.sourceDeletedAt)
                    .forEach(job => {
                      if (!uniqueSources.has(job.sourceImageUrl)) {
                        uniqueSources.set(job.sourceImageUrl, {
                          url: job.sourceImageUrl,
                          id: job.id
                        });
                      }
                    });
                  return Array.from(uniqueSources.values());
                })()
              : completedJobs.map(job => ({
                  url: job.resultMediaUrl!,
                  id: job.id
                }))
          }
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
          onUpload={lightboxType === 'target' ? () => targetInputRef.current?.click() : undefined}
          showUpload={lightboxType === 'target'}
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
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-lg border-white/20 text-white">
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
                className={`bg-gradient-to-r from-${themeConfig.accent} to-${themeConfig.secondary} hover:from-${themeConfig.accentHover} hover:to-${themeConfig.secondaryHover}`}
              >
                Use {selectedTemplates.length} Template(s)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Animate Dialog */}
      {currentJob && (
        <AnimateDialog
          open={showAnimateDialog}
          onClose={() => setShowAnimateDialog(false)}
          isAnimating={animateResultMutation.isPending}
          onAnimate={async (prompt: string) => {
            if (!currentJob) return;
            try {
              toast.info('Generating video animation...');
              const result = await animateResultMutation.mutateAsync({
                jobId: currentJob.id,
                prompt,
              });
              
              if (result.success && result.videoUrl) {
                // Open video in new tab
                window.open(result.videoUrl, '_blank');
                toast.success('Animation generated! Opening in new tab...');
                setShowAnimateDialog(false);
              }
            } catch (error: any) {
              console.error('Animation failed:', error);
              toast.error(error.message || 'Failed to generate animation');
            }
          }}
        />
      )}
    </div>
  );
}
