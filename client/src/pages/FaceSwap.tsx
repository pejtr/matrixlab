import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, Sparkles, Loader2, UserCircle, Users, Library } from "lucide-react";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import TemplateGallery, { Template } from "@/components/TemplateGallery";

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

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const createJobMutation = trpc.faceSwap.createJob.useMutation({
    onSuccess: (job) => {
      toast.success("Face swap job created successfully!");
      setLocation(`/job/${job.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create job: ${error.message}`);
      setIsUploading(false);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to use face swap</CardDescription>
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
      
      // Generate previews for all files
      const previews: string[] = [];
      let loadedCount = 0;
      
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews[index] = reader.result as string;
          loadedCount++;
          if (loadedCount === files.length) {
            setTargetPreviews([...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleTemplateSelect = (template: Template) => {
    const isAlreadySelected = selectedTemplates.some(t => t.id === template.id);
    
    if (isAlreadySelected) {
      setSelectedTemplates(selectedTemplates.filter(t => t.id !== template.id));
    } else {
      setSelectedTemplates([...selectedTemplates, template]);
    }
  };

  const handleUseTemplates = async () => {
    // Convert template URLs to File objects
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
      toast.success(`${files.length} template(s) loaded successfully!`);
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
    setUploadProgress({current: 0, total: targetFiles.length});

    try {
      // Upload source image
      toast.info("Uploading source image...");
      const sourceResult = await uploadFile(
        sourceFile,
        `/api/faceswap/upload/user-${user!.id}-source-${Date.now()}-${sourceFile.name}`
      );

      // Process each target file
      const createdJobs = [];
      for (let i = 0; i < targetFiles.length; i++) {
        const targetFile = targetFiles[i];
        setUploadProgress({current: i + 1, total: targetFiles.length});
        
        toast.info(`Processing ${i + 1}/${targetFiles.length}...`);
        
        // Upload target media
        const targetResult = await uploadFile(
          targetFile,
          `/api/faceswap/upload/user-${user!.id}-target-${Date.now()}-${targetFile.name}`
        );

        // Determine media type
        const isVideo = targetFile.type.startsWith("video/");
        const targetMediaType = isVideo ? "video" : "image";

        // Create job
        const job = await createJobMutation.mutateAsync({
          sourceImageKey: sourceResult.key,
          sourceImageUrl: sourceResult.url,
          targetMediaKey: targetResult.key,
          targetMediaUrl: targetResult.url,
          targetMediaType: targetMediaType as "image" | "video",
        });
        
        createdJobs.push(job);
      }
      
      toast.success(`Successfully created ${createdJobs.length} face swap job(s)!`);
      
      // Navigate to history if multiple jobs, or to the single job if only one
      if (createdJobs.length === 1) {
        setLocation(`/job/${createdJobs[0].id}`);
      } else {
        setLocation("/history");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Header */}
      <header className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">{APP_TITLE}</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-3">Create Face Swap</h2>
            <p className="text-white/70">Upload a source face and target media to begin</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Source Image Upload */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-white text-sm md:text-lg">1. Source Face</CardTitle>
                <CardDescription className="text-white/70 text-xs md:text-sm hidden md:block">
                  Upload an image with the face you want to use
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <input
                  ref={sourceInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSourceFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => sourceInputRef.current?.click()}
                  className="border-2 border-dashed border-white/30 rounded-lg p-4 md:p-8 text-center cursor-pointer hover:border-white/50 transition-colors"
                >
                  {sourcePreview ? (
                    <img src={sourcePreview} alt="Source" className="max-h-48 mx-auto rounded" />
                  ) : (
                    <div className="text-white/70">
                      <UserCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 md:mb-3 text-pink-400" />
                      <p className="text-xs md:text-base">Click to upload</p>
                      <p className="text-xs mt-1 md:mt-2 hidden md:block">JPG, PNG, or WEBP</p>
                    </div>
                  )}
                </div>
                {sourceFile && (
                  <p className="text-white/70 text-sm mt-2 text-center">{sourceFile.name}</p>
                )}
              </CardContent>
            </Card>

            {/* Target Media Upload */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-white text-sm md:text-lg">2. Target Media</CardTitle>
                <CardDescription className="text-white/70 text-xs md:text-sm hidden md:block">
                  Upload a video or image to apply the face swap
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
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
                  className="border-2 border-dashed border-white/30 rounded-lg p-4 md:p-8 text-center cursor-pointer hover:border-white/50 transition-colors"
                >
                  {targetPreviews.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {targetPreviews.slice(0, 4).map((preview, idx) => (
                        <div key={idx} className="relative">
                          {targetFiles[idx]?.type.startsWith("video/") ? (
                            <video src={preview} className="w-full h-24 object-cover rounded" />
                          ) : (
                            <img src={preview} alt={`Target ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                          )}
                        </div>
                      ))}
                      {targetPreviews.length > 4 && (
                        <div className="flex items-center justify-center bg-white/10 rounded h-24">
                          <p className="text-white/70 text-sm">+{targetPreviews.length - 4} more</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-white/70">
                      <Users className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 md:mb-3 text-purple-400" />
                      <p className="text-xs md:text-base">Click to upload (multi-select)</p>
                      <p className="text-xs mt-1 md:mt-2 hidden md:block">Video: MP4, MOV, WEBM</p>
                      <p className="text-xs hidden md:block">Image: JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>
                {targetFiles.length > 0 && (
                  <p className="text-white/70 text-sm mt-2 text-center">
                    {targetFiles.length} file{targetFiles.length > 1 ? 's' : ''} selected
                  </p>
                )}
                
                {/* Template Gallery Button */}
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTemplateGallery(!showTemplateGallery);
                    }}
                    className="w-full bg-transparent border-white/30 text-white hover:bg-white/10"
                  >
                    <Library className="mr-2 h-4 w-4" />
                    {showTemplateGallery ? 'Hide' : 'Browse'} Template Gallery
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Template Gallery */}
          {showTemplateGallery && (
            <div className="mb-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-white text-lg md:text-xl">Template Gallery</CardTitle>
                  <CardDescription className="text-white/70 text-sm">
                    Select pre-made templates for quick testing
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <TemplateGallery 
                    onSelectTemplate={handleTemplateSelect}
                    selectedTemplates={selectedTemplates}
                  />
                  {selectedTemplates.length > 0 && (
                    <div className="mt-4">
                      <Button
                        onClick={handleUseTemplates}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      >
                        Use {selectedTemplates.length} Selected Template{selectedTemplates.length > 1 ? 's' : ''}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submit Button */}
          <div className="w-full md:text-center">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!sourceFile || targetFiles.length === 0 || isUploading}
              className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-base md:text-lg px-8 md:px-12 py-4 md:py-6 h-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing {uploadProgress.current}/{uploadProgress.total}...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Face Swap {targetFiles.length > 1 ? `(${targetFiles.length} files)` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
