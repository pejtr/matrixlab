import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, Loader2, UserCircle, Users, Library, ChevronLeft, ChevronRight, Download, CheckCircle, XCircle, Clock, MoreVertical, Trash2, RefreshCw, Share2, Star } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import TemplateGallery, { Template } from "@/components/TemplateGallery";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

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

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's jobs
  const { data: jobs, refetch } = trpc.faceSwap.getMyJobs.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: (query: any) => {
      const hasIncompleteJobs = query.state.data?.some(
        (job: any) => job.status !== "completed" && job.status !== "failed"
      );
      return hasIncompleteJobs ? 3000 : false;
    },
  });

  const completedJobs = jobs?.filter((job: any) => job.status === "completed" && job.resultMediaUrl) || [];
  const currentJob = completedJobs[currentResultIndex];

  // Auto-refresh notification when new result is ready
  useEffect(() => {
    if (completedJobs.length > previousCompletedCount && previousCompletedCount > 0) {
      const newJobsCount = completedJobs.length - previousCompletedCount;
      toast.success(
        `${newJobsCount} new result${newJobsCount > 1 ? 's' : ''} ready!`,
        {
          action: {
            label: 'View',
            onClick: () => {
              setCurrentResultIndex(completedJobs.length - 1);
              // Scroll to results section
              const resultsSection = document.querySelector('[data-results-section]');
              resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            },
          },
          duration: 5000,
        }
      );
    }
    setPreviousCompletedCount(completedJobs.length);
  }, [completedJobs.length, previousCompletedCount]);

  // Keyboard navigation for results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completedJobs.length === 0) return;
      if (e.key === "ArrowLeft" && currentResultIndex > 0) {
        setCurrentResultIndex(currentResultIndex - 1);
      } else if (e.key === "ArrowRight" && currentResultIndex < completedJobs.length - 1) {
        setCurrentResultIndex(currentResultIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentResultIndex, completedJobs.length]);

  const createJobMutation = trpc.faceSwap.createJob.useMutation({
    onSuccess: () => {
      toast.success("Face swap job created!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
      setIsUploading(false);
    },
  });

  const handleTemplateSelect = (template: Template) => {
    const isAlreadySelected = selectedTemplates.some(t => t.id === template.id);
    
    if (isAlreadySelected) {
      setSelectedTemplates(selectedTemplates.filter(t => t.id !== template.id));
    } else {
      setSelectedTemplates([...selectedTemplates, template]);
    }
  };

  const handleUseTemplates = async () => {
    toast.info(`Loading ${selectedTemplates.length} template(s)...`);
    
    try {
      const files: File[] = [];
      const previews: string[] = [];
      
      for (const template of selectedTemplates) {
        const response = await fetch(template.mediaUrl);
        const blob = await response.blob();
        const file = new File([blob], `${template.name}.jpg`, { type: 'image/jpeg' });
        files.push(file);
        previews.push(template.mediaUrl);
      }
      
      setTargetFiles(files);
      setTargetPreviews(previews);
      setShowTemplateGallery(false);
      setSelectedTemplates([]);
      toast.success(`${files.length} template(s) loaded!`);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const uploadFile = async (file: File, endpoint: string): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json();
  };

  const handleSubmit = async () => {
    if (!sourceFile || targetFiles.length === 0) {
      toast.error("Please select source face and at least one target media");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: targetFiles.length });

    try {
      // Upload source
      const sourceUpload = await uploadFile(sourceFile, "/api/faceswap/upload-source");

      // Upload and create jobs for each target
      for (let i = 0; i < targetFiles.length; i++) {
        const targetFile = targetFiles[i];
        setUploadProgress({ current: i + 1, total: targetFiles.length });

        const targetUpload = await uploadFile(targetFile, "/api/faceswap/upload-target");
        const targetMediaType = targetFile.type.startsWith("video/") ? "video" : "image";

        await createJobMutation.mutateAsync({
          sourceImageKey: sourceUpload.key,
          sourceImageUrl: sourceUpload.url,
          targetMediaKey: targetUpload.key,
          targetMediaUrl: targetUpload.url,
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
      setIsUploading(false);
    }
  };

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
      
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === files.length) {
            setTargetPreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Done</Badge>;
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
      <header className="container mx-auto py-3 px-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-white hover:bg-white/10 h-8 px-2"
            size="sm"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-bold text-white">{APP_TITLE}</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <div className="max-w-7xl mx-auto">

          {/* Inverted T Layout - Inputs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-4">
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
          <div className="mb-4">
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
          </div>

          {/* Results Section */}
          {completedJobs.length > 0 && (
            <div data-results-section className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden mb-4">
              {/* Download Button - Floating */}
              <div className="absolute top-3 right-3 z-20">
                <Button
                  size="sm"
                  onClick={() => window.open(currentJob?.resultMediaUrl!, "_blank")}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-xs h-8 shadow-lg"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download
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
                    className="w-full"
                    controls
                  />
                ) : (
                  <img
                    src={currentJob?.resultMediaUrl || ""}
                    alt="Result"
                    className="w-full"
                  />
                )}
              </div>
            </div>
          )}

          {/* All Jobs List (Compact) */}
          {jobs && jobs.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white text-sm font-semibold">All Jobs ({jobs.length})</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/history")}
                  className="text-white/70 hover:text-white text-xs h-6"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {jobs.slice(0, 8).map((job: any, idx: number) => (
                  <div
                    key={job.id}
                    className={`relative rounded overflow-hidden group transition-all ${
                      job.status === "completed" && job.resultMediaUrl
                        ? 'opacity-100 hover:scale-105'
                        : 'opacity-50'
                    }`}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        if (job.status === "completed" && job.resultMediaUrl) {
                          const jobIndex = completedJobs.findIndex((j: any) => j.id === job.id);
                          if (jobIndex !== -1) setCurrentResultIndex(jobIndex);
                        }
                      }}
                    >
                      <img
                        src={job.resultMediaUrl || job.targetMediaUrl}
                        alt={`Job ${job.id}`}
                        className="w-full aspect-square object-cover"
                      />
                    </div>
                    
                    {/* Progress Bar for pending/processing jobs */}
                    {(job.status === "pending" || job.status === "processing") && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                        <div 
                          className={`h-full bg-gradient-to-r from-pink-500 to-purple-500 ${
                            job.status === "processing" ? 'animate-pulse' : 'w-1/4'
                          }`}
                          style={{ width: job.status === "processing" ? '75%' : '25%' }}
                        />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-1 left-1">
                      <div className="scale-75 origin-top-left">
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                    
                    {/* Quick Actions Menu */}
                    {job.status === "completed" && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 bg-black/60 hover:bg-black/80 text-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(job.resultMediaUrl, '_blank');
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info('Re-run feature coming soon!');
                              }}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Re-run
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(window.location.origin + '/job/' + job.id);
                                toast.success('Link copied to clipboard!');
                              }}
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              Share Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info('Set as template feature coming soon!');
                              }}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Set as Template
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this job?')) {
                                  toast.info('Delete feature coming soon!');
                                }
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
