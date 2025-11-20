import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Video as VideoIcon, ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function VideoGenerator() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("MiniMax-Hailuo-02");
  const [duration, setDuration] = useState<"6" | "10">("6");
  const [resolution, setResolution] = useState("768P");
  const [generatedJob, setGeneratedJob] = useState<any>(null);

  const generateMutation = trpc.minimax.generateVideoFromText.useMutation({
    onSuccess: (job) => {
      setGeneratedJob(job);
      toast.success("Video generation started!");
      pollJobStatus(job.id);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start video generation");
    },
  });

  const { data: jobStatus, refetch } = trpc.minimax.getJob.useQuery(
    { jobId: generatedJob?.id || 0 },
    {
      enabled: false,
      refetchInterval: false,
    }
  );

  const pollJobStatus = async (jobId: number) => {
    const interval = setInterval(async () => {
      const result = await refetch();
      if (result.data?.status === "completed" || result.data?.status === "failed") {
        clearInterval(interval);
        if (result.data.status === "completed") {
          toast.success("Video generated successfully!");
        } else {
          toast.error("Video generation failed");
        }
      }
    }, 5000); // Poll every 5 seconds (video takes longer)
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    generateMutation.mutate({
      prompt: prompt.trim(),
      model: model as any,
      duration: parseInt(duration) as any,
      resolution: resolution as any,
    });
  };

  const currentJob = jobStatus || generatedJob;
  const isProcessing = currentJob && (currentJob.status === "pending" || currentJob.status === "processing");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Login Required</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/ai">
            <a>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </a>
          </Link>
          <div className="flex items-center gap-2">
            <VideoIcon className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">Video Generator</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Create Video</CardTitle>
              <CardDescription className="text-white/70">
                Generate videos from text descriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger value="text" className="data-[state=active]:bg-white/20">
                    Text to Video
                  </TabsTrigger>
                  <TabsTrigger value="image" disabled className="data-[state=active]:bg-white/20">
                    Image to Video (Coming Soon)
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-white">
                      Prompt
                    </Label>
                    <Textarea
                      id="prompt"
                      placeholder="A cat walking on a beach at sunset, cinematic, 4k..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/50">
                      You can use camera commands like [Pan left], [Zoom in], [Tracking shot]
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-white">
                        Duration
                      </Label>
                      <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resolution" className="text-white">
                        Resolution
                      </Label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="768P">768P</SelectItem>
                          <SelectItem value="1080P">1080P</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-white">
                      Model
                    </Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MiniMax-Hailuo-02">MiniMax Hailuo 02 (Recommended)</SelectItem>
                        <SelectItem value="MiniMax-Hailuo-2.3">MiniMax Hailuo 2.3</SelectItem>
                        <SelectItem value="T2V-01-Director">T2V-01 Director (Camera Control)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isProcessing || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <VideoIcon className="w-4 h-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Result</CardTitle>
              <CardDescription className="text-white/70">
                Your generated video will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!currentJob && (
                <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <VideoIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No video generated yet</p>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-semibold">Generating your video...</p>
                    <p className="text-sm text-white/70 mt-2">
                      This may take 1-3 minutes
                    </p>
                  </div>
                </div>
              )}

              {currentJob?.status === "completed" && currentJob.outputFileUrl && (
                <div className="space-y-4">
                  <div className="aspect-video bg-white/5 rounded-lg overflow-hidden">
                    <video
                      src={currentJob.outputFileUrl}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                  <Button
                    asChild
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    variant="outline"
                  >
                    <a href={currentJob.outputFileUrl} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download Video
                    </a>
                  </Button>
                </div>
              )}

              {currentJob?.status === "failed" && (
                <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center text-red-400">
                    <p className="text-lg font-semibold">Generation Failed</p>
                    <p className="text-sm mt-2">{currentJob.errorMessage || "Unknown error"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
