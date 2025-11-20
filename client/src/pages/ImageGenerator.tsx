import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon, ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function ImageGenerator() {
  const { user, isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [generatedJob, setGeneratedJob] = useState<any>(null);

  const generateMutation = trpc.minimax.generateImage.useMutation({
    onSuccess: (job) => {
      setGeneratedJob(job);
      toast.success("Image generation started!");
      // Start polling for result
      pollJobStatus(job.id);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start image generation");
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
          toast.success("Image generated successfully!");
        } else {
          toast.error("Image generation failed");
        }
      }
    }, 3000);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    generateMutation.mutate({
      prompt: prompt.trim(),
      aspectRatio: aspectRatio as any,
    });
  };

  const currentJob = jobStatus || generatedJob;
  const isProcessing = currentJob && (currentJob.status === "pending" || currentJob.status === "processing");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Login Required</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900">
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
            <ImageIcon className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">Image Generator</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Create Image</CardTitle>
              <CardDescription className="text-white/70">
                Describe the image you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-white">
                  Prompt
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="A serene landscape with mountains at sunset, photorealistic, 4k..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <p className="text-xs text-white/50">
                  Be specific and descriptive for best results
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aspectRatio" className="text-white">
                  Aspect Ratio
                </Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Square (1:1)</SelectItem>
                    <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                    <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                    <SelectItem value="4:3">Standard (4:3)</SelectItem>
                    <SelectItem value="3:2">Photo (3:2)</SelectItem>
                    <SelectItem value="21:9">Ultrawide (21:9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isProcessing || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Result</CardTitle>
              <CardDescription className="text-white/70">
                Your generated image will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!currentJob && (
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No image generated yet</p>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-semibold">Generating your image...</p>
                    <p className="text-sm text-white/70 mt-2">
                      This may take 10-30 seconds
                    </p>
                  </div>
                </div>
              )}

              {currentJob?.status === "completed" && currentJob.outputFileUrl && (
                <div className="space-y-4">
                  <div className="aspect-square bg-white/5 rounded-lg overflow-hidden">
                    <img
                      src={currentJob.outputFileUrl}
                      alt="Generated"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    asChild
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    variant="outline"
                  >
                    <a href={currentJob.outputFileUrl} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download Image
                    </a>
                  </Button>
                </div>
              )}

              {currentJob?.status === "failed" && (
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
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
