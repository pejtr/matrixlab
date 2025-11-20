import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Image, Video, Music, Wand2 } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function AIDashboard() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Login Required</CardTitle>
            <CardDescription className="text-white/70">
              Please login to access AI tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={getLoginUrl()}>Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tools = [
    {
      title: "Face Swap",
      description: "Transform faces in videos and photos with AI",
      icon: Wand2,
      href: "/faceswap",
      gradient: "from-pink-500 to-purple-500",
    },
    {
      title: "Image Generator",
      description: "Create stunning images from text descriptions",
      icon: Image,
      href: "/ai/image-generator",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Video Generator",
      description: "Generate videos from text or animate images",
      icon: Video,
      href: "/ai/video-generator",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Music Generator",
      description: "Compose AI-generated music with lyrics",
      icon: Music,
      href: "/ai/music-generator",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-8 h-8" />
              AI Studio
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/history">
              <a className="text-white/80 hover:text-white transition-colors">
                History
              </a>
            </Link>
            <div className="text-white/80">{user?.name || user?.email}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Creative Studio
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Unleash your creativity with our suite of AI-powered tools.
            Generate images, videos, music, and transform faces with cutting-edge technology.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href}>
                <a className="block group">
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 h-full">
                    <CardHeader>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl text-white">
                        {tool.title}
                      </CardTitle>
                      <CardDescription className="text-white/70 text-base">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Get Started →
                      </Button>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-white mb-2">4</div>
              <div className="text-white/70">AI Tools</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-white mb-2">∞</div>
              <div className="text-white/70">Possibilities</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-white/70">Private</div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-lg mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-white/50 text-sm">
          <p>Powered by FaceFusion & MiniMax AI</p>
          <p className="mt-2">For private use only. Please respect privacy and obtain consent.</p>
        </div>
      </footer>
    </div>
  );
}
