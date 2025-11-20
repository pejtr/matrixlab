import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navigation } from "./components/Navigation";
import { BottomNav } from "./components/BottomNav";
import Home from "./pages/Home";
import FaceSwap from "./pages/FaceSwap";
import JobHistory from "./pages/JobHistory";
import JobDetail from "./pages/JobDetail";
import AIDashboard from "./pages/AIDashboard";
import ImageGenerator from "./pages/ImageGenerator";
import VideoGenerator from "./pages/VideoGenerator";
import MusicGenerator from "./pages/MusicGenerator";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/faceswap"} component={FaceSwap} />
      <Route path={"/swap"} component={FaceSwap} />
      <Route path={"/history"} component={JobHistory} />
      <Route path={"/job/:id"} component={JobDetail} />
      <Route path={"/ai"} component={AIDashboard} />
      <Route path={"/ai/image-generator"} component={ImageGenerator} />
      <Route path={"/ai/video-generator"} component={VideoGenerator} />
      <Route path={"/ai/music-generator"} component={MusicGenerator} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
