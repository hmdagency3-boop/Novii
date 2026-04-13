import { useState, createContext, useContext, useCallback } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, Video, Users, Image, Bookmark } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const logo = "/assets/novii_logo_transparent.png";

interface GuestPromptContextType {
  showPrompt: () => void;
}

const GuestPromptContext = createContext<GuestPromptContextType>({ showPrompt: () => {} });

export function useGuestPrompt() {
  return useContext(GuestPromptContext);
}

const features = [
  { icon: Heart,         labelAr: "إعجاب",     labelEn: "Like"    },
  { icon: MessageCircle, labelAr: "تعليق",     labelEn: "Comment" },
  { icon: Video,         labelAr: "ريلز",      labelEn: "Reels"   },
  { icon: Users,         labelAr: "متابعة",    labelEn: "Follow"  },
  { icon: Image,         labelAr: "صور",       labelEn: "Photos"  },
  { icon: Bookmark,      labelAr: "مشاركة",    labelEn: "Save"    },
];

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
          <div className="absolute inset-0 bg-black/55 backdrop-blur-md" />

          <div
            dir={isRTL ? "rtl" : "ltr"}
            className="relative w-full sm:max-w-sm bg-background border border-border/50 rounded-t-[2rem] sm:rounded-2xl shadow-2xl"
            style={{ animation: "guestSlideUp .3s cubic-bezier(.32,1.1,.5,1) both" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-0 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            <div className="flex flex-col items-center px-7 pt-7 pb-9 gap-6">

              {/* Logo */}
              <div className="relative flex flex-col items-center gap-3">
                {/* Soft glow */}
                <div
                  className="absolute top-1 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
                />
                <img
                  src={logo}
                  alt="Novii"
                  className="relative w-16 h-16 object-contain mix-blend-multiply dark:mix-blend-screen drop-shadow-md"
                />
                <span
                  className="text-2xl font-black tracking-tight"
                  style={{
                    background: "linear-gradient(135deg,#a855f7,#ec4899)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Novii
                </span>
              </div>

              {/* Text */}
              <div className="text-center space-y-2">
                <h2 className="text-[1.25rem] font-bold tracking-tight text-foreground leading-snug">
                  {isRTL
                    ? "لا تفوّت ما يحدث حولك"
                    : "Don't miss what's happening"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[265px] mx-auto">
                  {isRTL
                    ? "انضم إلى Novii للتفاعل مع المحتوى ومتابعة من تهتم بهم"
                    : "Join Novii to like, comment, and follow the people you care about."}
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {features.map(({ icon: Icon, labelAr, labelEn }) => (
                  <div
                    key={labelEn}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                  >
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    {isRTL ? labelAr : labelEn}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2.5 w-full">
                <Link href="/auth?tab=signup" onClick={() => setOpen(false)}>
                  <button
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-opacity hover:opacity-90 active:scale-[.97]"
                    style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
                  >
                    {isRTL ? "إنشاء حساب" : "Create Account"}
                  </button>
                </Link>

                <Link href="/auth" onClick={() => setOpen(false)}>
                  <button className="w-full py-3 rounded-xl text-sm font-semibold border border-border bg-transparent text-foreground hover:bg-secondary transition-colors">
                    {isRTL ? "تسجيل الدخول" : "Log In"}
                  </button>
                </Link>
              </div>

              {/* Fine print */}
              <p className="text-[0.68rem] text-muted-foreground/50 text-center -mt-2 leading-relaxed">
                {isRTL
                  ? "بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بـ Novii"
                  : "By registering, you agree to Novii's Terms of Use and Privacy Policy."}
              </p>

            </div>
          </div>

          <style>{`
            @keyframes guestSlideUp {
              from { opacity: 0; transform: translateY(36px) scale(.98); }
              to   { opacity: 1; transform: translateY(0)    scale(1);   }
            }
          `}</style>
        </div>
      )}
    </GuestPromptContext.Provider>
  );
}
