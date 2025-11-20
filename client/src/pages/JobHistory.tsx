import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Image as ImageIcon, Video, CheckCircle, XCircle, Clock, Grid3x3 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function JobHistory() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: jobs, isLoading } = trpc.faceSwap.getMyJobs.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds
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
            <CardDescription>Please sign in to view your job history</CardDescription>
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-500"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      default:
        return <Badge className="bg-yellow-500"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">Job History</h2>
              <p className="text-white/70">View all your face swap jobs</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/gallery")}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <Grid3x3 className="mr-2 h-4 w-4" />
                Gallery View
              </Button>
              <Button
                onClick={() => setLocation("/swap")}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                New Face Swap
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
              <p className="text-white/70 mt-4">Loading jobs...</p>
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/job/${job.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Preview Images */}
                      <div className="flex gap-3">
                        <div className="relative">
                          <img
                            src={job.sourceImageUrl}
                            alt="Source"
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="absolute -bottom-2 -right-2 bg-purple-500 rounded-full p-1">
                            <ImageIcon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-white/50 text-2xl">→</div>
                        </div>
                        <div className="relative">
                          {job.targetMediaType === "video" ? (
                            <video
                              src={job.targetMediaUrl}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <img
                              src={job.targetMediaUrl}
                              alt="Target"
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          )}
                          <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1">
                            {job.targetMediaType === "video" ? (
                              <Video className="h-4 w-4 text-white" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">Job #{job.id}</h3>
                          {getStatusBadge(job.status)}
                        </div>
                        <p className="text-white/60 text-sm">
                          Created: {new Date(job.createdAt).toLocaleString()}
                        </p>
                        {job.completedAt && (
                          <p className="text-white/60 text-sm">
                            Completed: {new Date(job.completedAt).toLocaleString()}
                          </p>
                        )}
                        {job.errorMessage && (
                          <p className="text-red-400 text-sm mt-1">Error: {job.errorMessage}</p>
                        )}
                      </div>

                      {/* View Button */}
                      <div>
                        <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="py-12 text-center">
                <p className="text-white/70 text-lg mb-4">No jobs yet</p>
                <Button
                  onClick={() => setLocation("/swap")}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  Create Your First Face Swap
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
