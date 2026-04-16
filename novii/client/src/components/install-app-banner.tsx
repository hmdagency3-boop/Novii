import { useState, useEffect, useRef } from "react";
import { Download, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const STORAGE_KEY = "novii_install_banner_dismissed";

export default function InstallAppBanner() {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const [visible, setVisible] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const timer = setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      deferredPromptRef.current = null;
      if (outcome === "accepted") {
        dismiss();
        return;
      }
    }
    dismiss();
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 mb-3 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            {isRTL ? "حمّل تطبيق نوفي" : "Download Novii App"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {isRTL ? "وصول سريع وتجربة أفضل" : "Faster access & better experience"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isRTL ? "تنزيل" : "Install"}
        </button>
        <button
          onClick={dismiss}
          className="p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
