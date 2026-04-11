import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/language-context";

interface ProfileShareModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
  userId: string;
  avatarUrl?: string;
  fullName?: string;
}

export function ProfileShareModal({
  open,
  onClose,
  username,
  userId,
  avatarUrl,
  fullName,
}: ProfileShareModalProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const profileUrl = `https://novii.netlify.app/user?id=${userId}`;
  const displayName = fullName && fullName !== username ? fullName : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success(isRTL ? "تم نسخ الرابط!" : "Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRTL ? "فشل النسخ" : "Copy failed");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s profile on Novii`,
          text: `Follow ${displayName || username} on Novii`,
          url: profileUrl,
        });
      } catch {
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("profile-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const link = document.createElement("a");
      link.download = `novii-${username}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const ModalBody = ({ qrSize }: { qrSize: number }) => (
    <div className="flex flex-col items-center gap-4 px-5 pb-5 pt-1">

      {/* QR Code */}
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <QRCodeSVG
          id="profile-qr-code"
          value={profileUrl}
          size={qrSize}
          level="H"
          includeMargin={false}
          imageSettings={
            avatarUrl
              ? { src: avatarUrl, height: 42, width: 42, excavate: true }
              : undefined
          }
        />
      </div>

      {/* Username */}
      <div className="text-center" dir="ltr">
        <p className="font-bold text-base">@{username}</p>
        {displayName && (
          <p className="text-sm text-muted-foreground mt-0.5">{displayName}</p>
        )}
      </div>

      {/* Profile URL */}
      <div className="w-full bg-muted rounded-xl px-4 py-2.5" dir="ltr">
        <p className="text-xs text-muted-foreground font-mono truncate">{profileUrl}</p>
      </div>

      {/* Copy Button - full width */}
      <Button
        variant="outline"
        className="w-full rounded-xl h-11 gap-2 text-sm font-medium"
        onClick={handleCopy}
      >
        {copied
          ? <Check className="w-4 h-4 text-green-500 shrink-0" />
          : <Copy className="w-4 h-4 shrink-0" />}
        {isRTL ? (copied ? "تم نسخ الرابط" : "نسخ الرابط") : (copied ? "Link Copied!" : "Copy Link")}
      </Button>

      {/* Share Button - full width */}
      <Button
        className="w-full rounded-xl h-11 gap-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
        onClick={handleShare}
      >
        <Share2 className="w-4 h-4 shrink-0" />
        {isRTL ? "مشاركة الملف الشخصي" : "Share Profile"}
      </Button>

      {/* Download QR */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground gap-2 text-xs h-7"
        onClick={handleDownloadQR}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        {isRTL ? "تحميل QR Code" : "Download QR Code"}
      </Button>
    </div>
  );

  /* ── Mobile: bottom sheet ── */
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 px-0 pt-0">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <SheetTitle className="text-center text-base font-bold py-3">
            {isRTL ? "مشاركة الملف الشخصي" : "Share Profile"}
          </SheetTitle>
          <ModalBody qrSize={190} />
        </SheetContent>
      </Sheet>
    );
  }

  /* ── Desktop: centered dialog ── */
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl" style={{ direction: "ltr" }}>
        <DialogTitle className="text-center text-base font-bold px-5 pt-5 pb-0" style={{ direction: direction }}>
          {isRTL ? "مشاركة الملف الشخصي" : "Share Profile"}
        </DialogTitle>
        <ModalBody qrSize={200} />
      </DialogContent>
    </Dialog>
  );
}
