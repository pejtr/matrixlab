import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navigation } from "./components/Navigation";
import { BottomNav } from "./components/BottomNav";

const Home = lazy(() => import("./pages/Home"));
const FaceSwap = lazy(() => import("./pages/FaceSwap"));
const JobHistory = lazy(() => import("./pages/JobHistory"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const BatchGallery = lazy(() => import("./pages/BatchGallery"));
const AIDashboard = lazy(() => import("./pages/AIDashboard"));
const ImageGenerator = lazy(() => import("./pages/ImageGenerator"));
const VideoGenerator = lazy(() => import("./pages/VideoGenerator"));
const MusicGenerator = lazy(() => import("./pages/MusicGenerator"));
const WanAnimate = lazy(() => import("./pages/WanAnimate"));
const LiveCam = lazy(() => import("./pages/LiveCam"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090a0a]">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/faceswap" component={FaceSwap} />
        <Route path="/swap" component={FaceSwap} />
        <Route path="/history" component={JobHistory} />
        <Route path="/job/:id" component={JobDetail} />
        <Route path="/gallery" component={BatchGallery} />
        <Route path="/gallery/:userId" component={BatchGallery} />
        <Route path="/ai" component={AIDashboard} />
        <Route path="/ai/dashboard" component={AIDashboard} />
        <Route path="/ai/image-generator" component={ImageGenerator} />
        <Route path="/ai/video-generator" component={VideoGenerator} />
        <Route path="/ai/music-generator" component={MusicGenerator} />
        <Route path="/wan-animate" component={WanAnimate} />
        <Route path="/live-cam" component={LiveCam} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Navigation />
          <div className="pb-16 md:pb-0">
            <Router />
          </div>
          <BottomNav />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
