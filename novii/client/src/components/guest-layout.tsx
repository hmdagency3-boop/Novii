import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";

const logo = "/assets/novii_logo_transparent.png";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/auth">
            <div className="flex items-center gap-2 cursor-pointer">
              <img
                src={logo}
                alt="Novii"
                className="w-8 h-8 mix-blend-multiply dark:mix-blend-screen"
              />
              <span className="font-display font-bold text-xl bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Novii
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="font-semibold">
                {isRTL ? "تسجيل الدخول" : "Log In"}
              </Button>
            </Link>
            <Link href="/auth?tab=signup">
              <Button size="sm" className="font-semibold rounded-xl px-5">
                {isRTL ? "إنشاء حساب" : "Sign Up"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
