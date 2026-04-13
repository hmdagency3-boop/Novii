import { useState, createContext, useContext, useCallback } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";

const logo = "/assets/novii_logo_transparent.png";

interface GuestPromptContextType {
  showPrompt: () => void;
}

const GuestPromptContext = createContext<GuestPromptContextType>({ showPrompt: () => {} });

export function useGuestPrompt() {
  return useContext(GuestPromptContext);
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div
            className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-2xl p-6 pb-10 sm:pb-6 shadow-2xl border border-border flex flex-col items-center gap-5"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={logo}
              alt="Novii"
              className="w-16 h-16 mix-blend-multiply dark:mix-blend-screen"
            />

            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">
                {isRTL ? "سجّل دخولك" : "Log in to Novii"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? "سجّل دخولك عشان تعجبك وتعلّق وتتابع"
                  : "Log in to like, comment and follow"}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Link href="/auth">
                <Button className="w-full rounded-xl font-semibold" size="lg">
                  {isRTL ? "تسجيل الدخول" : "Log In"}
                </Button>
              </Link>
              <Link href="/auth?tab=signup">
                <Button variant="outline" className="w-full rounded-xl font-semibold" size="lg">
                  {isRTL ? "إنشاء حساب" : "Sign Up"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </GuestPromptContext.Provider>
  );
}
