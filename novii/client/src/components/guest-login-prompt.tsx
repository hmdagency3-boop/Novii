import { useState, createContext, useContext, useCallback } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, Image, Video, Users, Bookmark } from "lucide-react";
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
  { icon: Heart,         labelAr: "أعجبني",   labelEn: "Like"     },
  { icon: MessageCircle, labelAr: "تعليق",    labelEn: "Comment"  },
  { icon: Video,         labelAr: "ريلز",     labelEn: "Reels"    },
  { icon: Users,         labelAr: "متابعة",   labelEn: "Follow"   },
  { icon: Image,         labelAr: "صور",      labelEn: "Photos"   },
  { icon: Bookmark,      labelAr: "حفظ",      labelEn: "Save"     },
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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Sheet */}
          <div
            dir={isRTL ? "rtl" : "ltr"}
            className="relative w-full sm:max-w-sm bg-background border border-border/60 rounded-t-[2rem] sm:rounded-2xl shadow-2xl"
            style={{ animation: "slideUp .28s cubic-bezier(.32,1.2,.5,1) both" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex flex-col items-center px-7 pt-6 pb-9 gap-6">

              {/* Logo + glow */}
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute w-28 h-28 rounded-full blur-2xl opacity-30"
                  style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
                />
                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg,#a855f7 0%,#ec4899 100%)" }}
                >
                  <img
                    src={logo}
                    alt="Novii"
                    className="w-12 h-12 object-contain brightness-0 invert"
                  />
                </div>
              </div>

              {/* Text */}
              <div className="text-center space-y-2">
                <h2 className="text-[1.35rem] font-bold tracking-tight text-foreground">
                  {isRTL ? "في أكتر مما تشوف" : "There's more to see"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
                  {isRTL
                    ? "سجّل دخولك وانضم لمجتمع Novii — شارك، تابع، واستكشف"
                    : "Sign in to like, comment, share reels and follow the people you love."}
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {features.map(({ icon: Icon, labelAr, labelEn }) => (
                  <div
                    key={labelEn}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
                    {isRTL ? labelAr : labelEn}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 w-full">
                <Link href="/auth?tab=signup" onClick={() => setOpen(false)}>
                  <button
                    className="w-full py-3.5 rounded-xl font-bold text-white text-[0.95rem] tracking-wide transition-transform active:scale-[.97] hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#a855f7 0%,#ec4899 100%)" }}
                  >
                    {isRTL ? "إنشاء حساب مجاني" : "Create Free Account"}
                  </button>
                </Link>

                <Link href="/auth" onClick={() => setOpen(false)}>
                  <button className="w-full py-3 rounded-xl text-[0.9rem] font-semibold border border-border bg-transparent text-foreground hover:bg-secondary transition-colors">
                    {isRTL ? "تسجيل الدخول" : "Log In"}
                  </button>
                </Link>
              </div>

              {/* Fine print */}
              <p className="text-[0.7rem] text-muted-foreground/60 text-center -mt-2">
                {isRTL ? "بالتسجيل توافق على شروط الاستخدام وسياسة الخصوصية" : "By signing up you agree to our Terms & Privacy Policy"}
              </p>
            </div>
          </div>

          <style>{`
            @keyframes slideUp {
              from { opacity:0; transform:translateY(40px) scale(.97); }
              to   { opacity:1; transform:translateY(0)    scale(1);   }
            }
          `}</style>
        </div>
      )}
    </GuestPromptContext.Provider>
  );
}
