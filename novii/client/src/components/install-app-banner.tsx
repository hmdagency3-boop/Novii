import { useState, useEffect, useRef } from "react";
import { Download, X, Share, MoreVertical, Plus } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const STORAGE_KEY = "novii_install_banner_dismissed";

function getDevicePlatform(): "ios" | "android" | "desktop" {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function InstallInstructionsModal({ onClose, isRTL }: { onClose: () => void; isRTL: boolean }) {
  const platform = getDevicePlatform();

  const steps = {
    ios: isRTL
      ? [
          { icon: <Share className="w-5 h-5 text-blue-500" />, text: 'اضغط على زر المشاركة في أسفل المتصفح' },
          { icon: <Plus className="w-5 h-5 text-blue-500" />, text: 'اختر "إضافة إلى الشاشة الرئيسية"' },
          { icon: <Download className="w-5 h-5 text-blue-500" />, text: 'اضغط "إضافة" وستجد التطبيق على شاشتك' },
        ]
      : [
          { icon: <Share className="w-5 h-5 text-blue-500" />, text: 'Tap the Share button at the bottom of Safari' },
          { icon: <Plus className="w-5 h-5 text-blue-500" />, text: 'Select "Add to Home Screen"' },
          { icon: <Download className="w-5 h-5 text-blue-500" />, text: 'Tap "Add" and find the app on your home screen' },
        ],
    android: isRTL
      ? [
          { icon: <MoreVertical className="w-5 h-5 text-green-500" />, text: 'اضغط على قائمة المتصفح (النقاط الثلاث)' },
          { icon: <Plus className="w-5 h-5 text-green-500" />, text: 'اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"' },
          { icon: <Download className="w-5 h-5 text-green-500" />, text: 'اضغط "إضافة" وسيظهر التطبيق على شاشتك' },
        ]
      : [
          { icon: <MoreVertical className="w-5 h-5 text-green-500" />, text: 'Tap the browser menu (three dots)' },
          { icon: <Plus className="w-5 h-5 text-green-500" />, text: 'Select "Add to Home screen" or "Install App"' },
          { icon: <Download className="w-5 h-5 text-green-500" />, text: 'Tap "Add" and find the app on your home screen' },
        ],
    desktop: isRTL
      ? [
          { icon: <Download className="w-5 h-5 text-primary" />, text: 'انظر لشريط العنوان في المتصفح' },
          { icon: <Plus className="w-5 h-5 text-primary" />, text: 'ابحث عن أيقونة التثبيت (+) أو قائمة المتصفح' },
          { icon: <Download className="w-5 h-5 text-primary" />, text: 'اختر "تثبيت" أو "Install App"' },
        ]
      : [
          { icon: <Download className="w-5 h-5 text-primary" />, text: 'Look at the browser address bar' },
          { icon: <Plus className="w-5 h-5 text-primary" />, text: 'Find the install icon (+) or browser menu' },
          { icon: <Download className="w-5 h-5 text-primary" />, text: 'Select "Install" or "Install App"' },
        ],
  };

  const platformLabel = {
    ios: "iPhone / iPad",
    android: "Android",
    desktop: isRTL ? "الكمبيوتر" : "Desktop",
  }[platform];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        dir={isRTL ? "rtl" : "ltr"}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg">{isRTL ? "تثبيت التطبيق" : "Install App"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{platformLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          {steps[platform].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.icon}
              </div>
              <div className="flex-1">
                <span className="text-xs text-muted-foreground font-medium">
                  {isRTL ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                </span>
                <p className="text-sm font-medium leading-snug">{step.text}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          {isRTL ? "حسناً، فهمت" : "Got it"}
        </button>
      </div>
    </div>
  );
}

export default function InstallAppBanner() {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
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
    setShowInstructions(true);
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 mb-3 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300"
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

      {showInstructions && (
        <InstallInstructionsModal
          isRTL={isRTL}
          onClose={() => {
            setShowInstructions(false);
            dismiss();
          }}
        />
      )}
    </>
  );
}
