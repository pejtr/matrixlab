import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Sparkles, Users, Bookmark, Play } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";

/**
 * Wan Animate Page - Hailuo AI-style interface
 * Dark theme with left panel (input) and right panel (grid gallery)
 */
export default function WanAnimate() {
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"animation" | "replacement">("animation");
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [referenceVideo, setReferenceVideo] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { data: jobs = [], refetch: refetchJobs } = trpc.wanAnimate.getJobs.useQuery(
    undefined,
    { enabled: !!user, refetchInterval: 3000 }
  );

  const confirmUploadMutation = trpc.faceSwap.confirmUpload.useMutation();

  const createJobMutation = trpc.wanAnimate.createJob.useMutation({
    onSuccess: () => {
      toast.success("Job created! Processing...");
      refetchJobs();
      // Reset form
      setCharacterImage(null);
      setReferenceVideo(null);
      setCharacterPreview("");
      setVideoPreview("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create job");
    },
  });

  const handleCharacterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCharacterImage(file);
      const reader = new FileReader();
      reader.onload = () => setCharacterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReferenceVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceVideo(file);
      const reader = new FileReader();
      reader.onload = () => setVideoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!characterImage || !referenceVideo) {
      toast.error("Please upload both character image and reference video");
      return;
    }

    setUploading(true);

    try {
      // Upload character image
      const charReader = new FileReader();
      charReader.readAsDataURL(characterImage);
      await new Promise((resolve) => { charReader.onload = resolve; });
      const charBase64 = (charReader.result as string).split(",")[1];

      const charUploadResult = await confirmUploadMutation.mutateAsync({
        fileKey: `wan-animate/character-${Date.now()}-${characterImage.name}`,
        fileData: charBase64,
        contentType: characterImage.type,
      });

      // Upload reference video
      const vidReader = new FileReader();
      vidReader.readAsDataURL(referenceVideo);
      await new Promise((resolve) => { vidReader.onload = resolve; });
      const vidBase64 = (vidReader.result as string).split(",")[1];

      const vidUploadResult = await confirmUploadMutation.mutateAsync({
        fileKey: `wan-animate/reference-${Date.now()}-${referenceVideo.name}`,
        fileData: vidBase64,
        contentType: referenceVideo.type,
      });

      // Create job
      await createJobMutation.mutateAsync({
        characterImageKey: charUploadResult.key,
        characterImageUrl: charUploadResult.url,
        referenceVideoKey: vidUploadResult.key,
        referenceVideoUrl: vidUploadResult.url,
        mode,
      });
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <Card className="p-8 max-w-md bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-white">Sign in required</h2>
          <p className="text-gray-300 mb-6">Please sign in to use Wan Animate</p>
          <Button asChild className="w-full">
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Wan Animate</h1>
          </div>
          <div className="text-sm text-gray-400">
            {user.name || user.email}
          </div>
        </div>
      </header>

      {/* Main Content - Hailuo-style Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left Panel - Input Controls */}
          <div className="space-y-4">
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Create Animation</h2>

              {/* Mode Selection */}
              <Tabs value={mode} onValueChange={(v) => setMode(v as "animation" | "replacement")} className="mb-6">
                <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                  <TabsTrigger value="animation" className="data-[state=active]:bg-purple-600">
                    <Play className="w-4 h-4 mr-2" />
                    Animation
                  </TabsTrigger>
                  <TabsTrigger value="replacement" className="data-[state=active]:bg-purple-600">
                    <Users className="w-4 h-4 mr-2" />
                    Replacement
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="animation" className="text-sm text-gray-300 mt-3">
                  Animate your character image using motion from reference video
                </TabsContent>
                <TabsContent value="replacement" className="text-sm text-gray-300 mt-3">
                  Replace character in video with your character image (full body swap)
                </TabsContent>
              </Tabs>

              {/* Character Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Character Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCharacterImageChange}
                    className="hidden"
                    id="character-upload"
                  />
                  <label
                    htmlFor="character-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors bg-gray-700/30"
                  >
                    {characterPreview ? (
                      <img src={characterPreview} alt="Character" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">Click to upload image</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Reference Video Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reference Video
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleReferenceVideoChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors bg-gray-700/30"
                  >
                    {videoPreview ? (
                      <video src={videoPreview} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">Click to upload video</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!characterImage || !referenceVideo || uploading || createJobMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {uploading || createJobMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </Card>
          </div>

          {/* Right Panel - Grid Gallery */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Videos</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{jobs.length} videos</span>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <Card key={job.id} className="group relative overflow-hidden bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-all">
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-900">
                    {job.status === "completed" && job.resultVideoUrl ? (
                      <video
                        src={job.resultVideoUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {job.status === "processing" ? (
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                            <div className="text-xs text-gray-400">{job.progress}%</div>
                          </div>
                        ) : job.status === "failed" ? (
                          <div className="text-center text-red-400 text-sm px-4">
                            Failed: {job.errorMessage}
                          </div>
                        ) : (
                          <div className="text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500 mx-auto mb-2" />
                            <div className="text-xs text-gray-500">Pending...</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Duration Overlay (only for completed) */}
                    {job.status === "completed" && (
                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                        00:10
                      </div>
                    )}

                    {/* Bookmark Icon */}
                    <button className="absolute top-2 right-2 p-1.5 bg-black/50 rounded hover:bg-black/70 transition-colors">
                      <Bookmark className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Job Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="capitalize">{job.mode}</span>
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Empty State */}
              {jobs.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No videos yet. Create your first animation!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
