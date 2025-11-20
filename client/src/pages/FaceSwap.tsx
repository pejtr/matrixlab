import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, Loader2, UserCircle, Users, Library, ChevronLeft, ChevronRight, Download, CheckCircle, XCircle, Clock, Trash2, Bookmark, RotateCcw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import TemplateGallery, { Template } from "@/components/TemplateGallery";

import FullscreenLightbox from "@/components/FullscreenLightbox";
import SavedFacesDialog from "@/components/SavedFacesDialog";

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
  const [showSavedFaces, setShowSavedFaces] = useState(false);
  const [visibleJobsCount, setVisibleJobsCount] = useState(20);

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const { data: jobs, refetch } = trpc.faceSwap.getMyJobs.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // Poll every 5s for real-time updates
  });

  const createJobMutation = trpc.faceSwap.createJob.useMutation();
  const deleteJobMutation = trpc.faceSwap.deleteJob.useMutation();
  const utils = trpc.useUtils();

  const completedJobs = jobs?.filter(job => job.status === "completed") || [];
  const currentJob = completedJobs[currentResultIndex];
  const visibleJobs = jobs?.slice(0, visibleJobsCount) || [];
  const hasMoreJobs = jobs && jobs.length > visibleJobsCount;

  // Auto-refresh notification when new results are ready
  useEffect(() => {
    if (completedJobs.length > previousCompletedCount && previousCompletedCount > 0) {
      const newCount = completedJobs.length - previousCompletedCount;
      toast.success(`${newCount} new result(s) ready!`, {
        duration: 5000,
        action: {
          label: "View",
          onClick: () => {
            setCurrentResultIndex(completedJobs.length - 1);
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
      setSourceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourcePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTargetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setTargetFiles(files);
      const previews: string[] = [];
      let loadedCount = 0;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          loadedCount++;
          if (loadedCount === files.length) {
            setTargetPreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
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
    
    try {
      const responses = await Promise.all(
        templateUrls.map(url => fetch(url))
      );
      const blobs = await Promise.all(
        responses.map(r => r.blob())
      );
      const files = blobs.map((blob, idx) => 
        new File([blob], `template-${idx + 1}.jpg`, { type: blob.type })
      );

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

  const saveFaceMutation = trpc.savedFaces.saveFace.useMutation({
    onSuccess: () => {
      toast.success("Face saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save face");
    },
  });

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

  const handleSubmit = async () => {
    if (!sourceFile || targetFiles.length === 0) {
      toast.error("Please upload both source face and target media");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: targetFiles.length });

    try {
      for (let i = 0; i < targetFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: targetFiles.length });

        const sourceFormData = new FormData();
        sourceFormData.append("file", sourceFile);
        const sourceUploadRes = await fetch("/api/upload", {
          method: "POST",
          body: sourceFormData,
        });
        const sourceUploadData = await sourceUploadRes.json();

        const targetFormData = new FormData();
        targetFormData.append("file", targetFiles[i]!);
        const targetUploadRes = await fetch("/api/upload", {
          method: "POST",
          body: targetFormData,
        });
        const targetUploadData = await targetUploadRes.json();

        const targetMediaType = targetFiles[i]!.type.startsWith("video/") ? "video" : "image";

        await createJobMutation.mutateAsync({
          sourceImageKey: sourceUploadData.key || `uploaded-${Date.now()}`,
          sourceImageUrl: sourceUploadData.url,
          targetMediaKey: targetUploadData.key || `uploaded-${Date.now()}`,
          targetMediaUrl: targetUploadData.url,
          targetMediaType,
        });
      }

      toast.success(`${targetFiles.length} job(s) created successfully!`);
      
      // Reset form after successful submission
      setSourceFile(null);
      setSourcePreview(null);
      setTargetFiles([]);
      setTargetPreviews([]);
      setSelectedTemplates([]);
      if (sourceInputRef.current) sourceInputRef.current.value = '';
      if (targetInputRef.current) targetInputRef.current.value = '';
      
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to create jobs");
      
      // Reset form even after error to allow retry
      setSourceFile(null);
      setSourcePreview(null);
      setTargetFiles([]);
      setTargetPreviews([]);
      setSelectedTemplates([]);
      if (sourceInputRef.current) sourceInputRef.current.value = '';
      if (targetInputRef.current) targetInputRef.current.value = '';
      
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-xs p-1"><CheckCircle className="h-3 w-3" /></Badge>;
      case "processing":
        return <Badge className="bg-blue-500 text-xs"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-500 text-xs"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
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
      {/* Compact Header */}
      <header className="container mx-auto py-2 px-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-white hover:bg-white/10 h-8 px-2"
          size="sm"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Horizontal T Layout: Mobile = Inverted T (inputs side-by-side, results below), Desktop = Horizontal T (inputs stacked left, results right) */}
          <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-4">
            
            {/* Left Column: Inputs (Desktop: stacked, Mobile: side-by-side) */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                {/* Source Face */}
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardContent className="p-3">
                    <input
                      ref={sourceInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleSourceFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => sourceInputRef.current?.click()}
                      className="border-2 border-dashed border-white/30 rounded-lg p-4 text-center cursor-pointer hover:border-white/50 transition-colors"
                    >
                      {sourcePreview ? (
                        <img src={sourcePreview} alt="Source" className="w-full h-32 object-cover rounded" />
                      ) : (
                        <div className="text-white/70">
                          <UserCircle className="h-16 w-16 mx-auto text-pink-400" />
                        </div>
                      )}
                    </div>
                    {/* Saved Faces & Save Button */}
                    <div className="mt-2 flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSavedFaces(true)}
                        className="text-white/70 hover:text-white hover:bg-white/10 text-xs h-7"
                      >
                        <Bookmark className="mr-1 h-3 w-3" />
                        Saved Faces
                      </Button>
                      {sourceFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveCurrentFace}
                          className="text-green-400 hover:text-green-300 hover:bg-white/10 text-xs h-7"
                        >
                          Save This Face
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Target Media */}
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardContent className="p-3">
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
                      className="border-2 border-dashed border-white/30 rounded-lg p-4 text-center cursor-pointer hover:border-white/50 transition-colors"
                    >
                      {targetPreviews.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1">
                          {targetPreviews.slice(0, 2).map((preview, idx) => (
                            <img key={idx} src={preview} alt={`Target ${idx + 1}`} className="w-full h-14 object-cover rounded" />
                          ))}
                          {targetPreviews.length > 2 && (
                            <div className="col-span-2 text-white/70 text-xs mt-1">+{targetPreviews.length - 2} more</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-white/70">
                          <Users className="h-16 w-16 mx-auto text-purple-400" />
                        </div>
                      )}
                    </div>
                    {targetFiles.length > 0 && (
                      <p className="text-white/70 text-xs mt-2 text-center">{targetFiles.length} file(s)</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTemplateGallery(!showTemplateGallery);
                      }}
                      className="w-full mt-2 bg-transparent border-white/30 text-white hover:bg-white/10 text-xs h-7"
                    >
                      <Library className="mr-1 h-3 w-3" />
                      {showTemplateGallery ? 'Hide' : 'Templates'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Template Gallery */}
              {showTemplateGallery && (
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader className="p-3">
                    <CardTitle className="text-white text-sm">Template Gallery</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
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

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!sourceFile || targetFiles.length === 0 || isUploading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 h-10"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating {uploadProgress.current}/{uploadProgress.total}...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Face Swap
                  </>
                )}
              </Button>

              {/* Before/After Thumbnails - Desktop Only, Below Submit Button */}
              {completedJobs.length > 0 && currentJob && (
                <div className="hidden md:flex gap-1.5 mt-2">
                  {/* Source Face Thumbnail */}
                  <div className="group flex-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg relative cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all"
                    onClick={() => {
                      // Open lightbox with source image
                      setShowLightbox(true);
                      setLightboxIndex(currentResultIndex);
                    }}
                  >
                    <div className="text-[9px] font-semibold text-gray-700 mb-0.5 text-center">Before</div>
                    <img
                      src={currentJob.sourceImageUrl}
                      alt="Source"
                      className="w-full aspect-square object-cover rounded"
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
                        className="h-5 w-5 p-0 bg-pink-500/80 hover:bg-pink-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Bookmark className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                  {/* Target Media Thumbnail */}
                  <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                    onClick={() => {
                      // Open lightbox with target image
                      setShowLightbox(true);
                      setLightboxIndex(currentResultIndex);
                    }}
                  >
                    <div className="text-[9px] font-semibold text-gray-700 mb-0.5 text-center">Original</div>
                    <img
                      src={currentJob.targetMediaUrl}
                      alt="Target"
                      className="w-full aspect-square object-cover rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Results (Desktop: full height, Mobile: below inputs) */}
            <div className="space-y-4">
              {/* Results Section */}
              {completedJobs.length > 0 && (
                <div data-results-section className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden">
                  {/* Action Buttons - Floating */}
                  <div className="absolute top-3 right-3 z-20 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => window.open(currentJob?.resultMediaUrl!, "_blank")}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 h-8 w-8 p-0 shadow-lg"
                    >
                      <Download className="h-4 w-4" />
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
                        className="w-full max-h-[calc(100vh-12rem)] object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={currentJob?.resultMediaUrl || ""}
                        alt="Result"
                        className="w-full max-h-[calc(100vh-12rem)] object-contain cursor-pointer hover:opacity-90 transition-opacity"
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
                          {getStatusBadge(job.status)}
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
                                  // Create new job with same source/target from failed job
                                  await createJobMutation.mutateAsync({
                                    sourceImageKey: job.sourceImageKey,
                                    sourceImageUrl: job.sourceImageUrl,
                                    targetMediaKey: job.targetMediaKey,
                                    targetMediaUrl: job.targetMediaUrl,
                                    targetMediaType: job.targetMediaType,
                                  });
                                  toast.success('Job retried successfully');
                                  await utils.faceSwap.getMyJobs.invalidate();
                                } catch (error) {
                                  toast.error('Failed to retry job');
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
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div 
                              className={`h-full bg-gradient-to-r from-pink-500 to-purple-500 ${
                                job.status === "processing" ? "w-3/4 animate-pulse" : "w-1/4"
                              }`}
                            />
                          </div>
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
          images={completedJobs.map(job => ({ url: job.resultMediaUrl!, id: job.id }))}
          currentIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
          onNavigate={(index) => {
            setLightboxIndex(index);
            setCurrentResultIndex(index);
          }}
          onDelete={async (jobId) => {
            try {
              await deleteJobMutation.mutateAsync({ jobId });
              toast.success('Job deleted successfully');
              await utils.faceSwap.getMyJobs.invalidate();
              // If we deleted the current job, close lightbox or navigate
              if (completedJobs.length === 1) {
                setShowLightbox(false);
              } else if (lightboxIndex >= completedJobs.length - 1) {
                setLightboxIndex(Math.max(0, lightboxIndex - 1));
                setCurrentResultIndex(Math.max(0, currentResultIndex - 1));
              }
            } catch (error) {
              toast.error('Failed to delete job');
            }
          }}
        />
      )}

      {/* Saved Faces Dialog */}
      <SavedFacesDialog
        open={showSavedFaces}
        onOpenChange={setShowSavedFaces}
        onSelectFace={handleLoadSavedFace}
      />

      {/* Template Gallery */}
      {showTemplateGallery && (
        <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
          <DialogContent className="max-w-4xl bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-lg border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Template Gallery</DialogTitle>
            </DialogHeader>
            <TemplateGallery
              selectedTemplates={selectedTemplates}
              onSelectTemplate={handleTemplateSelect}
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-white/20">
              <Button variant="outline" onClick={() => setShowTemplateGallery(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  handleUseTemplates();
                  setShowTemplateGallery(false);
                }}
                disabled={selectedTemplates.length === 0}
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
