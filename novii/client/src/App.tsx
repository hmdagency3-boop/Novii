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
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        pointerEvents: visible ? "all" : "none",
      }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src="/assets/novii_app_logo.png"
          alt="Novii"
          style={{ width: 96, height: 96, objectFit: "contain" }}
        />
      </div>

      <div style={{ paddingBottom: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <span style={{ fontSize: 11, color: "#4b5563", fontFamily: "sans-serif" }}>from</span>
        <span
          style={{
            fontSize: 14,
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
