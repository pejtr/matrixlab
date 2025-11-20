import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, Loader2, UserCircle, Users, Library, ChevronLeft, ChevronRight, Download, CheckCircle, XCircle, Clock } from "lucide-react";
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
          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Create Face Swap</h2>
            <p className="text-white/70 text-sm">Upload source and target media</p>
          </div>

          {/* Inverted T Layout - Inputs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Source Face */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="p-3">
                <CardTitle className="text-white text-sm">1. Source Face</CardTitle>
              </CardHeader>
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
                      <UserCircle className="h-12 w-12 mx-auto mb-2 text-pink-400" />
                      <p className="text-xs">Click to upload</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Target Media */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="p-3">
                <CardTitle className="text-white text-sm">2. Target Media</CardTitle>
              </CardHeader>
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
                      <Users className="h-12 w-12 mx-auto mb-2 text-purple-400" />
                      <p className="text-xs">Multi-select</p>
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg">Results</CardTitle>
                    <Badge className="bg-white/20 text-white text-xs mt-1">
                      {currentResultIndex + 1} / {completedJobs.length}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {currentJob?.targetMediaType === "image" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowComparison(!showComparison)}
                        className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs h-7"
                      >
                        {showComparison ? 'Result' : 'Compare'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => window.open(currentJob?.resultMediaUrl!, "_blank")}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 text-xs h-7"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 relative">
                {/* Navigation Arrows */}
                {completedJobs.length > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-10 px-2">
                    <Button
                      onClick={() => setCurrentResultIndex(Math.max(0, currentResultIndex - 1))}
                      disabled={currentResultIndex === 0}
                      className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 rounded-full h-10 w-10 p-0"
                      size="sm"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => setCurrentResultIndex(Math.min(completedJobs.length - 1, currentResultIndex + 1))}
                      disabled={currentResultIndex === completedJobs.length - 1}
                      className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 rounded-full h-10 w-10 p-0"
                      size="sm"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* Result Display */}
                {currentJob?.targetMediaType === "video" ? (
                  <video
                    src={currentJob.resultMediaUrl!}
                    className="w-full rounded-lg"
                    controls
                  />
                ) : showComparison ? (
                  <BeforeAfterSlider
                    beforeImage={currentJob?.targetMediaUrl || ""}
                    afterImage={currentJob?.resultMediaUrl || ""}
                    beforeLabel="Original"
                    afterLabel="Swapped"
                  />
                ) : (
                  <img
                    src={currentJob?.resultMediaUrl || ""}
                    alt="Result"
                    className="w-full rounded-lg"
                  />
                )}

                {/* Job Info */}
                <div className="mt-2 flex items-center justify-between text-xs text-white/70">
                  <span>Job #{currentJob?.id}</span>
                  {getStatusBadge(currentJob?.status || "")}
                </div>
              </CardContent>
            </Card>
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
                    className={`relative rounded overflow-hidden cursor-pointer transition-all ${
                      job.status === "completed" && job.resultMediaUrl
                        ? 'opacity-100 hover:scale-105'
                        : 'opacity-50'
                    }`}
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
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 text-center">
                      {getStatusBadge(job.status)}
                    </div>
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
