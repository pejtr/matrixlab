import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, Sparkles, Loader2, UserCircle, Users } from "lucide-react";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function FaceSwap() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    const file = e.target.files?.[0];
    if (file) {
      setTargetFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTargetPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    if (!sourceFile || !targetFile) {
      toast.error("Please select both source and target files");
      return;
    }

    setIsUploading(true);

    try {
      // Upload source image
      toast.info("Uploading source image...");
      const sourceResult = await uploadFile(
        sourceFile,
        `/api/faceswap/upload/user-${user!.id}-source-${Date.now()}-${sourceFile.name}`
      );

      // Upload target media
      toast.info("Uploading target media...");
      const targetResult = await uploadFile(
        targetFile,
        `/api/faceswap/upload/user-${user!.id}-target-${Date.now()}-${targetFile.name}`
      );

      // Determine media type
      const isVideo = targetFile.type.startsWith("video/");
      const targetMediaType = isVideo ? "video" : "image";

      // Create job
      toast.info("Creating face swap job...");
      await createJobMutation.mutateAsync({
        sourceImageKey: sourceResult.key,
        sourceImageUrl: sourceResult.url,
        targetMediaKey: targetResult.key,
        targetMediaUrl: targetResult.url,
        targetMediaType: targetMediaType as "image" | "video",
      });
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

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Source Image Upload */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">1. Source Face</CardTitle>
                <CardDescription className="text-white/70">
                  Upload an image with the face you want to use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={sourceInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSourceFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => sourceInputRef.current?.click()}
                  className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center cursor-pointer hover:border-white/50 transition-colors"
                >
                  {sourcePreview ? (
                    <img src={sourcePreview} alt="Source" className="max-h-48 mx-auto rounded" />
                  ) : (
                    <div className="text-white/70">
                      <UserCircle className="h-16 w-16 mx-auto mb-3 text-pink-400" />
                      <p>Click to upload source image</p>
                      <p className="text-sm mt-2">JPG, PNG, or WEBP</p>
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
              <CardHeader>
                <CardTitle className="text-white">2. Target Media</CardTitle>
                <CardDescription className="text-white/70">
                  Upload a video or image to apply the face swap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={targetInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  onChange={handleTargetFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => targetInputRef.current?.click()}
                  className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center cursor-pointer hover:border-white/50 transition-colors"
                >
                  {targetPreview ? (
                    targetFile?.type.startsWith("video/") ? (
                      <video src={targetPreview} className="max-h-48 mx-auto rounded" controls />
                    ) : (
                      <img src={targetPreview} alt="Target" className="max-h-48 mx-auto rounded" />
                    )
                  ) : (
                    <div className="text-white/70">
                      <Users className="h-16 w-16 mx-auto mb-3 text-purple-400" />
                      <p>Click to upload target media</p>
                      <p className="text-sm mt-2">Video: MP4, MOV, WEBM</p>
                      <p className="text-sm">Image: JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>
                {targetFile && (
                  <p className="text-white/70 text-sm mt-2 text-center">{targetFile.name}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!sourceFile || !targetFile || isUploading}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg px-12 py-6 h-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Face Swap
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
