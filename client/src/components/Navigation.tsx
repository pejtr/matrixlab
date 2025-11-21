import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE, getLoginUrl } from "@/const";
import {
  Home,
  Sparkles,
  History,
  Menu,
  X,
  LogOut,
  User,
  Image,
  Video,
  Music,
  Palette,
} from "lucide-react";
import { useColorTheme, COLOR_THEMES, type ColorTheme } from "@/contexts/ColorThemeContext";

function ThemeSwitcher() {
  const { colorTheme, setColorTheme } = useColorTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: ColorTheme[] = ["purple", "blue", "green", "orange"];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-full px-3 flex items-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
        title="Change theme"
      >
        <Palette className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Theme Picker Dropdown */}
          <div className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg p-2 z-50 min-w-[200px]">
            <div className="text-white/70 text-xs font-semibold mb-2 px-2">Choose Theme</div>
            <div className="space-y-1">
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => {
                    setColorTheme(theme);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    colorTheme === theme
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {/* Color Preview Circle */}
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${COLOR_THEMES[theme].gradient}`} />
                  <span className="text-sm">{COLOR_THEMES[theme].name}</span>
                  {colorTheme === theme && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { themeConfig } = useColorTheme();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/swap", label: "Face Swap", icon: Sparkles, auth: true },
    { path: "/ai/dashboard", label: "AI Studio", icon: Image, auth: true },
    { path: "/history", label: "History", icon: History, auth: true },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation("/");
    setIsOpen(false);
  };

  const handleNavClick = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r ${themeConfig.gradient} bg-opacity-80 backdrop-blur-lg border-b border-white/10`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between md:justify-center h-6 relative">
            {/* Logo - Absolute Left on Desktop */}
            <button
              onClick={() => handleNavClick("/")}
              className="flex items-center gap-2 text-white font-bold hover:opacity-80 transition-opacity md:absolute md:left-4"
            >
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-sm md:text-lg">AI FaceSwap</span>
            </button>

            {/* Desktop Navigation - Icon Only */}
            <nav className="hidden md:flex items-center gap-2 h-full">
              {navItems.map((item) => {
                if (item.auth && !isAuthenticated) return null;
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    title={item.label}
                    className={`h-full px-3 flex items-center transition-all ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}

              {/* Theme Switcher - Desktop Only */}
              <div className="hidden md:flex items-center gap-1 pl-2 ml-2 border-l border-white/20">
                <ThemeSwitcher />
              </div>

              {/* User Menu - Compact - Absolute Right on Desktop */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2 pl-2 ml-2 border-l border-white/20 md:absolute md:right-4">
                  <div className="text-white/70 text-xs hidden lg:block">
                    {user?.name || user?.email}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    title="Logout"
                    className="text-white hover:bg-white/10 h-8 w-8 p-0"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 h-8 text-xs"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Hamburger Menu */}
        {isOpen && (
          <div className="md:hidden bg-purple-900/95 backdrop-blur-lg border-t border-white/10">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                if (item.auth && !isAuthenticated) return null;
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}

              {/* User Section */}
              <div className="pt-4 border-t border-white/10">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 text-white/70 text-sm">
                      {user?.name || user?.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      window.location.href = getLoginUrl();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all"
                  >
                    <User className="h-5 w-5" />
                    Sign In
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-8" />
    </>
  );
}
