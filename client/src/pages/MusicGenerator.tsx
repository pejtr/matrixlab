import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Music as MusicIcon, ArrowLeft, Download, Play, Pause } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useRef } from "react";

export default function MusicGenerator() {
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [generatedJob, setGeneratedJob] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateMutation = trpc.minimax.generateMusic.useMutation({
    onSuccess: (job) => {
      setGeneratedJob(job);
      toast.success("Music generation started!");
      pollJobStatus(job.id);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start music generation");
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
          toast.success("Music generated successfully!");
        } else {
          toast.error("Music generation failed");
        }
      }
    }, 5000);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a music description");
      return;
    }
    if (!lyrics.trim()) {
      toast.error("Please enter lyrics");
      return;
    }

    generateMutation.mutate({
      prompt: prompt.trim(),
      lyrics: lyrics.trim(),
    });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const currentJob = jobStatus || generatedJob;
  const isProcessing = currentJob && (currentJob.status === "pending" || currentJob.status === "processing");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Login Required</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
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
            <MusicIcon className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">Music Generator</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Compose Music</CardTitle>
              <CardDescription className="text-white/70">
                Create AI-generated music with custom lyrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-white">
                  Music Style Description
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Upbeat pop song with electronic beats, energetic and catchy..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <p className="text-xs text-white/50">
                  Describe the genre, mood, tempo, and instruments (10-300 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lyrics" className="text-white">
                  Lyrics
                </Label>
                <Textarea
                  id="lyrics"
                  placeholder="[Verse 1]&#10;Walking down the street&#10;Feeling the beat&#10;&#10;[Chorus]&#10;This is my song&#10;Singing all day long..."
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={12}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono text-sm"
                />
                <p className="text-xs text-white/50">
                  Use [Verse], [Chorus], [Bridge] tags to structure your song (10-600 characters)
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isProcessing || !prompt.trim() || !lyrics.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MusicIcon className="w-4 h-4 mr-2" />
                    Generate Music
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
                Your generated music will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!currentJob && (
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <MusicIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No music generated yet</p>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-semibold">Composing your music...</p>
                    <p className="text-sm text-white/70 mt-2">
                      This may take 1-2 minutes
                    </p>
                  </div>
                </div>
              )}

              {currentJob?.status === "completed" && currentJob.outputFileUrl && (
                <div className="space-y-6">
                  {/* Waveform Visualization Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-white/30 rounded-full"
                          style={{
                            height: `${Math.random() * 60 + 20}%`,
                            animation: isPlaying ? `pulse ${Math.random() * 0.5 + 0.5}s ease-in-out infinite` : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <Button
                      onClick={togglePlay}
                      size="lg"
                      className="relative z-10 w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-lg"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" />
                      )}
                    </Button>
                  </div>

                  <audio
                    ref={audioRef}
                    src={currentJob.outputFileUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />

                  <Button
                    asChild
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    variant="outline"
                  >
                    <a href={currentJob.outputFileUrl} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download Music
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

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  );
}
