import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import { GlobalMessageListener } from "@/components/global-message-listener";
import { TimeTracker } from "@/components/time-tracker";
import { VisitorDetector } from "@/components/visitor-detector";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Create from "@/pages/create";
import Profile from "@/pages/profile";
import UserProfile from "@/pages/user-profile";
import Explore from "@/pages/explore";
import Search from "@/pages/search";
import Reels from "@/pages/reels";
import Settings from "@/pages/settings";
import Messages from "@/pages/messages";
import Notifications from "@/pages/notifications";
import Mentions from "@/pages/mentions";
import AuthPage from "@/pages/auth";
import PostPage from "@/pages/post";
import Admin from "@/pages/admin";
import FollowersDetail from "@/pages/followers-detail";
import ResetPassword from "@/pages/reset-password";
import ProtectedLayout from "@/components/protected-layout";

function SplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), 2200);
    const unmountTimer = setTimeout(() => setMounted(false), 2700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "hsl(240,10%,3.9%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        pointerEvents: visible ? "all" : "none",
        overflow: "hidden",
      }}
    >
      {/* Background blobs — same style as auth page */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-10rem", right: "-10rem",
          width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.35) 0%, transparent 70%)",
          filter: "blur(40px)", animation: "splashBlob 7s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "-10rem", left: "-10rem",
          width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.28) 0%, transparent 70%)",
          filter: "blur(40px)", animation: "splashBlob 7s ease-in-out infinite 2s",
        }} />
        <div style={{
          position: "absolute", top: "35%", left: "35%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(147,51,234,0.22) 0%, transparent 70%)",
          filter: "blur(40px)", animation: "splashBlob 7s ease-in-out infinite 4s",
        }} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <img
          src="/assets/novii_logo_new.png"
          alt="Novii"
          style={{ width: 100, height: 100, objectFit: "contain" }}
        />
      </div>

      <div style={{ paddingBottom: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
        <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "sans-serif" }}>from</span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.5,
            fontFamily: "sans-serif",
            background: "linear-gradient(135deg, #a855f7, #ec4899, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Novii
        </span>
      </div>

      <style>{`
        @keyframes splashBlob {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(20px,-30px) scale(1.1); }
          66%      { transform: translate(-15px,15px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage}/>
      <Route path="/reset-password" component={ResetPassword}/>

      <Route path="/">
        <ProtectedLayout>
          <Home />
        </ProtectedLayout>
      </Route>
      <Route path="/profile">
        <ProtectedLayout>
          <Profile />
        </ProtectedLayout>
      </Route>
      <Route path="/user">
        <ProtectedLayout>
          <UserProfile />
        </ProtectedLayout>
      </Route>
      <Route path="/explore">
        <ProtectedLayout>
          <Explore />
        </ProtectedLayout>
      </Route>
      <Route path="/search">
        <ProtectedLayout>
          <Search />
        </ProtectedLayout>
      </Route>
      <Route path="/reels">
        <ProtectedLayout>
          <Reels />
        </ProtectedLayout>
      </Route>
      <Route path="/settings">
        <ProtectedLayout>
          <Settings />
        </ProtectedLayout>
      </Route>
      <Route path="/messages">
        <ProtectedLayout>
          <Messages />
        </ProtectedLayout>
      </Route>
      <Route path="/notifications">
        <ProtectedLayout>
          <Notifications />
        </ProtectedLayout>
      </Route>
      <Route path="/mentions">
        <ProtectedLayout>
          <Mentions />
        </ProtectedLayout>
      </Route>
      <Route path="/create">
        <ProtectedLayout>
          <Create />
        </ProtectedLayout>
      </Route>
      <Route path="/post/:id">
        <ProtectedLayout>
          <PostPage />
        </ProtectedLayout>
      </Route>
      <Route path="/admin">
        <ProtectedLayout>
          <Admin />
        </ProtectedLayout>
      </Route>
      <Route path="/followers-detail">
        <ProtectedLayout>
          <FollowersDetail />
        </ProtectedLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash] = useState(true);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <ShadcnToaster />
              <Toaster richColors position="top-right" />
              <GlobalMessageListener />
              <TimeTracker />
              <VisitorDetector />
              {showSplash && <SplashOverlay />}
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
