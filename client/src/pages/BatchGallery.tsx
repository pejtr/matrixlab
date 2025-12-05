import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Grid3x3, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

export default function BatchGallery() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ userId?: string }>();
  const userId = params.userId ? parseInt(params.userId) : user?.id;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComparison, setShowComparison] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);

  // Fetch all completed jobs for the user
  const { data: jobsData, isLoading } = trpc.faceSwap.getMyJobs.useInfiniteQuery(
    { limit: 100 },
    {
      enabled: isAuthenticated,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: 3000,
    }
  );
  
  // Flatten all pages
  const jobs = jobsData?.pages.flatMap(page => page.items) || [];

  // Filter only completed jobs with results
  const completedJobs = jobs?.filter(
    (job: any) => job.status === "completed" && job.resultMediaUrl
  ) || [];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < completedJobs.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, completedJobs.length]);

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

  const currentJob = completedJobs[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Header */}
      <header className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/history")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Button>
          <h1 className="text-2xl font-bold text-white">{APP_TITLE}</h1>
          <Button
            variant="ghost"
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="text-white hover:bg-white/10"
          >
            <Grid3x3 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
              <p className="text-white/70 mt-4">Loading gallery...</p>
            </div>
          ) : completedJobs.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="py-12 text-center">
                <p className="text-white text-xl">No completed jobs found</p>
                <Button
                  onClick={() => setLocation("/faceswap")}
                  className="mt-4 bg-gradient-to-r from-pink-500 to-purple-500"
                >
                  Create Face Swap
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Gallery Counter */}
              <div className="text-center mb-6">
                <Badge className="bg-white/20 text-white text-lg px-6 py-2">
                  {currentIndex + 1} / {completedJobs.length}
                </Badge>
              </div>

              {/* Main Image Display */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-white text-2xl">Job #{currentJob?.id}</CardTitle>
                      <p className="text-white/70 text-sm mt-1">
                        Created: {new Date(currentJob?.createdAt || "").toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {currentJob?.targetMediaType === "image" && (
                        <Button
                          variant="outline"
                          onClick={() => setShowComparison(!showComparison)}
                          className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                        >
                          {showComparison ? 'Result Only' : 'Show Comparison'}
                        </Button>
                      )}
                      <Button
                        onClick={() => window.open(currentJob?.resultMediaUrl!, "_blank")}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {/* Navigation Arrows */}
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-10 px-4">
                    <Button
                      onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                      disabled={currentIndex === 0}
                      className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 rounded-full h-12 w-12 p-0"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      onClick={() => setCurrentIndex(Math.min(completedJobs.length - 1, currentIndex + 1))}
                      disabled={currentIndex === completedJobs.length - 1}
                      className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 rounded-full h-12 w-12 p-0"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Image/Video Display */}
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
                      afterLabel="Face Swapped"
                    />
                  ) : (
                    <img
                      src={currentJob?.resultMediaUrl || ""}
                      alt="Result"
                      className="w-full rounded-lg"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Thumbnail Grid */}
              {showThumbnails && (
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">All Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {completedJobs.map((job: any, idx: number) => (
                        <div
                          key={job.id}
                          onClick={() => setCurrentIndex(idx)}
                          className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                            idx === currentIndex
                              ? 'ring-4 ring-pink-500 scale-105'
                              : 'hover:scale-105 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={job.resultMediaUrl || ""}
                            alt={`Result ${idx + 1}`}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                            #{job.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
