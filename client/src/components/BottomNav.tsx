import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Home, Sparkles, History, Image } from "lucide-react";

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/swap", label: "Face Swap", icon: Sparkles },
    { path: "/ai/dashboard", label: "AI Studio", icon: Image },
    { path: "/history", label: "History", icon: History },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-purple-900/95 backdrop-blur-lg border-t border-white/10 safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? "text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className={`text-xs ${isActive ? "font-semibold" : "font-normal"}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
