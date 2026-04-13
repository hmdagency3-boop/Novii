import { useState, createContext, useContext, useCallback } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";

interface GuestPromptContextType {
  showPrompt: () => void;
}

const GuestPromptContext = createContext<GuestPromptContextType>({ showPrompt: () => {} });

export function useGuestPrompt() {
  return useContext(GuestPromptContext);
}

function NoviiIllustration() {
  return (
    <svg width="150" height="130" viewBox="0 0 150 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Glow behind phone */}
      <ellipse cx="55" cy="110" rx="38" ry="8" fill="url(#glowGrad)" opacity="0.3"/>

      {/* Phone body */}
      <rect x="18" y="8" width="74" height="112" rx="14" fill="url(#phoneGrad)" />
      <rect x="18" y="8" width="74" height="112" rx="14" stroke="url(#borderGrad)" strokeWidth="1.5"/>
      <rect x="26" y="20" width="58" height="88" rx="8" fill="hsl(var(--background))"/>

      {/* Photo grid on screen */}
      <rect x="28" y="22" width="25" height="25" rx="4" fill="url(#p1)"/>
      <rect x="55" y="22" width="27" height="25" rx="4" fill="url(#p2)"/>
      <rect x="28" y="49" width="27" height="25" rx="4" fill="url(#p3)"/>
      <rect x="57" y="49" width="25" height="25" rx="4" fill="url(#p4)"/>
      <rect x="28" y="76" width="54" height="28" rx="4" fill="url(#p5)"/>

      {/* Bottom bar */}
      <rect x="44" y="106" width="22" height="5" rx="2.5" fill="url(#borderGrad)" opacity="0.5"/>

      {/* Floating heart */}
      <circle cx="112" cy="34" r="20" fill="url(#heartBg)" opacity="0.15"/>
      <path d="M112 43C112 43 99 33.5 99 26.5C99 22.1 102.4 18.5 106.5 18.5C109 18.5 111.2 19.8 112 21.7C112.8 19.8 115 18.5 117.5 18.5C121.6 18.5 125 22.1 125 26.5C125 33.5 112 43 112 43Z" fill="url(#heartGrad)"/>

      {/* Sparkle top right */}
      <path d="M131 10L132.8 16L139 17.5L132.8 19L131 25L129.2 19L123 17.5L129.2 16Z" fill="url(#starGrad)"/>

      {/* Small sparkles */}
      <circle cx="14" cy="52" r="3.5" fill="url(#dotGrad1)" opacity="0.8"/>
      <circle cx="8"  cy="80" r="2"   fill="url(#dotGrad2)" opacity="0.6"/>
      <circle cx="140" cy="60" r="2.5" fill="url(#dotGrad3)" opacity="0.7"/>
      <circle cx="136" cy="80" r="1.5" fill="url(#dotGrad1)" opacity="0.5"/>

      {/* Comment bubble */}
      <rect x="96" y="60" width="44" height="30" rx="10" fill="url(#bubbleGrad)" opacity="0.9"/>
      <path d="M108 90L104 98L116 92" fill="url(#bubbleGrad)"/>
      <circle cx="111" cy="75" r="3" fill="white" opacity="0.8"/>
      <circle cx="120" cy="75" r="3" fill="white" opacity="0.8"/>
      <circle cx="129" cy="75" r="3" fill="white" opacity="0.8"/>

      <defs>
        <linearGradient id="phoneGrad" x1="18" y1="8" x2="92" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="100%" stopColor="#ec4899"/>
        </linearGradient>
        <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#f472b6"/>
        </linearGradient>
        <linearGradient id="heartBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ec4899"/>
          <stop offset="100%" stopColor="#f43f5e"/>
        </linearGradient>
        <linearGradient id="heartGrad" x1="99" y1="18" x2="125" y2="43" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f472b6"/>
          <stop offset="100%" stopColor="#e11d48"/>
        </linearGradient>
        <linearGradient id="starGrad" x1="123" y1="10" x2="139" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </linearGradient>
        <linearGradient id="bubbleGrad" x1="96" y1="60" x2="140" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <linearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="100%" stopColor="#ec4899"/>
        </linearGradient>
        <linearGradient id="p1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a855f7"/><stop offset="1" stopColor="#7c3aed"/></linearGradient>
        <linearGradient id="p2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ec4899"/><stop offset="1" stopColor="#be185d"/></linearGradient>
        <linearGradient id="p3" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#06b6d4"/><stop offset="1" stopColor="#0284c7"/></linearGradient>
        <linearGradient id="p4" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#d97706"/></linearGradient>
        <linearGradient id="p5" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#6d28d9"/></linearGradient>
        <radialGradient id="dotGrad1"><stop stopColor="#a855f7"/></radialGradient>
        <radialGradient id="dotGrad2"><stop stopColor="#ec4899"/></radialGradient>
        <radialGradient id="dotGrad3"><stop stopColor="#06b6d4"/></radialGradient>
      </defs>
    </svg>
  );
}

export function GuestPromptProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";

  const showPrompt = useCallback(() => setOpen(true), []);

  return (
    <GuestPromptContext.Provider value={{ showPrompt }}>
      {children}

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Card */}
          <div
            dir={isRTL ? "rtl" : "ltr"}
            className="relative w-full sm:max-w-[400px] bg-background border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Top gradient accent line */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #a855f7, #ec4899, #06b6d4)" }} />

            <div className="flex flex-col items-center px-8 pt-8 pb-10 gap-5">

              {/* Illustration */}
              <NoviiIllustration />

              {/* Text */}
              <div className="text-center">
                <h2 className="text-foreground text-xl font-bold mb-2">
                  {isRTL ? "شايف إيه بتفوتك؟" : "See what you're missing"}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {isRTL
                    ? "استمتع بصور وفيديوهات من أصحابك والمشاهير وأكتر"
                    : "Enjoy photos and videos from your friends, public figures, and more."}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 w-full">
                <Link href="/auth?tab=signup" onClick={() => setOpen(false)}>
                  <button
                    className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 active:opacity-75"
                    style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
                  >
                    {isRTL ? "إنشاء حساب" : "Sign up"}
                  </button>
                </Link>

                <Link href="/auth" onClick={() => setOpen(false)}>
                  <button className="w-full py-2.5 text-sm font-semibold bg-transparent border border-border rounded-xl text-foreground hover:bg-secondary transition-colors">
                    {isRTL ? "تسجيل الدخول" : "Log in"}
                  </button>
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}
    </GuestPromptContext.Provider>
  );
}
