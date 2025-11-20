import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Sparkles, Video, Image as ImageIcon, History } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-16 w-16 text-yellow-400" />
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            AI-Powered Face Swap
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Transform faces in videos and photos with cutting-edge AI technology.
            Powered by FaceFusion for professional-quality results.
          </p>

          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation("/faceswap")}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg px-8 py-6 h-auto"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Face Swap
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/ai")}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-6 h-auto"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                AI Studio
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg px-8 py-6 h-auto"
            >
              Sign In to Get Started
            </Button>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-8 mt-20">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <Video className="h-12 w-12 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Video Face Swap</h3>
              <p className="text-white/70">
                Swap faces in videos with high-quality results. Supports MP4, MOV, and WEBM formats.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <ImageIcon className="h-12 w-12 text-green-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Photo Face Swap</h3>
              <p className="text-white/70">
                Transform faces in static images instantly. Works with JPG, PNG, and WEBP files.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20">
        <div className="text-center text-white/60 text-sm">
          <p>Powered by FaceFusion - Open Source Face Swap Technology</p>
          <p className="mt-2">For private use only. Please respect privacy and obtain consent.</p>
        </div>
      </footer>
    </div>
  );
}
