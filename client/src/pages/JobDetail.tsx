import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, Download, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function JobDetail() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const jobId = parseInt(params.id || "0");

  const { data: job, isLoading, refetch } = trpc.faceSwap.getJob.useQuery(
    { jobId },
    {
      enabled: isAuthenticated && jobId > 0,
      refetchInterval: (query) => {
        // Stop polling if job is completed or failed
        if (query.state.data?.status === "completed" || query.state.data?.status === "failed") {
          return false;
        }
        return 3000; // Poll every 3 seconds for pending/processing jobs
      },
    }
  );

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
            <CardDescription>Please sign in to view job details</CardDescription>
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
        return <Badge className="bg-green-500 text-lg px-4 py-2"><CheckCircle className="mr-2 h-5 w-5" />Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500 text-lg px-4 py-2"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-500 text-lg px-4 py-2"><XCircle className="mr-2 h-5 w-5" />Failed</Badge>;
      default:
        return <Badge className="bg-yellow-500 text-lg px-4 py-2"><Clock className="mr-2 h-5 w-5" />Pending</Badge>;
    }
  };

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
          <div className="w-32" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
              <p className="text-white/70 mt-4">Loading job details...</p>
            </div>
          ) : job ? (
            <>
              {/* Status Header */}
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">Job #{job.id}</h2>
                <div className="flex justify-center gap-4 items-center">
                  {getStatusBadge(job.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Source and Target */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Source Face</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={job.sourceImageUrl}
                      alt="Source"
                      className="w-full rounded-lg"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Target Media</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {job.targetMediaType === "video" ? (
                      <video
                        src={job.targetMediaUrl}
                        className="w-full rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={job.targetMediaUrl}
                        alt="Target"
                        className="w-full rounded-lg"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Result */}
              {job.status === "completed" && job.resultMediaUrl && (
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-2xl">Result</CardTitle>
                      <Button
                        onClick={() => window.open(job.resultMediaUrl!, "_blank")}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {job.targetMediaType === "video" ? (
                      <video
                        src={job.resultMediaUrl}
                        className="w-full rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={job.resultMediaUrl}
                        alt="Result"
                        className="w-full rounded-lg"
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Processing Message */}
              {(job.status === "pending" || job.status === "processing") && (
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
                  <CardContent className="py-12 text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-white mx-auto mb-4" />
                    <p className="text-white text-xl mb-2">
                      {job.status === "pending" ? "Job is queued..." : "Processing your face swap..."}
                    </p>
                    
                    {/* Progress Bar */}
                    {job.status === "processing" && (
                      <div className="max-w-md mx-auto mt-6">
                        <div className="flex justify-between text-white/70 text-sm mb-2">
                          <span>Progress</span>
                          <span>{job.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-500 ease-out"
                            style={{ width: `${job.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <p className="text-white/70 mt-4">
                      This may take a few minutes depending on the media size.
                    </p>
                    {job.retryCount > 0 && (
                      <p className="text-yellow-400 text-sm mt-2">
                        Retry attempt {job.retryCount}/3
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Error Message */}
              {job.status === "failed" && (
                <Card className="bg-red-500/20 backdrop-blur-lg border-red-500/30 mb-8">
                  <CardContent className="py-8">
                    <div className="flex items-start gap-4">
                      <XCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
                      <div>
                        <h3 className="text-white text-lg font-semibold mb-2">Processing Failed</h3>
                        <p className="text-white/80">{job.errorMessage || "An unknown error occurred"}</p>
                        <Button
                          onClick={() => setLocation("/swap")}
                          className="mt-4 bg-white/20 hover:bg-white/30"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Info */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Job Information</CardTitle>
                </CardHeader>
                <CardContent className="text-white/70 space-y-2">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(job.createdAt).toLocaleString()}</span>
                  </div>
                  {job.completedAt && (
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span>{new Date(job.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Media Type:</span>
                    <span className="capitalize">{job.targetMediaType}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="py-12 text-center">
                <p className="text-white/70 text-lg">Job not found</p>
                <Button
                  onClick={() => setLocation("/history")}
                  className="mt-4"
                >
                  Back to History
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
