import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-sm p-6">
        {/* Title */}
        <DialogTitle className="text-center text-base font-bold mb-2">
          {isRTL ? "مشاركة الملف الشخصي" : "Share Profile"}
        </DialogTitle>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-2xl shadow-sm inline-block">
            <QRCodeSVG
              id="profile-qr-code"
              value={profileUrl}
              size={164}
              level="H"
              includeMargin={false}
              imageSettings={
                avatarUrl
                  ? { src: avatarUrl, height: 36, width: 36, excavate: true }
                  : undefined
              }
            />
          </div>
        </div>

        {/* Username — LTR so @ always appears before username */}
        <div className="text-center" dir="ltr">
          <p className="font-bold text-sm">@{username}</p>
          {displayName && (
            <p className="text-xs text-muted-foreground mt-0.5">{displayName}</p>
          )}
        </div>

        {/* Profile URL — LTR */}
        <div className="bg-muted rounded-lg px-3 py-2" dir="ltr">
          <p className="text-xs text-muted-foreground font-mono truncate">{profileUrl}</p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="rounded-xl gap-1.5 text-sm"
            onClick={handleCopy}
          >
            {copied
              ? <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              : <Copy className="w-3.5 h-3.5 shrink-0" />}
            {isRTL ? (copied ? "تم" : "نسخ") : (copied ? "Copied" : "Copy")}
          </Button>

          <Button
            className="rounded-xl gap-1.5 text-sm bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
            onClick={handleShare}
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            {isRTL ? "مشاركة" : "Share"}
          </Button>
        </div>

        {/* Download QR */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5 text-xs h-7"
            onClick={handleDownloadQR}
          >
            <Download className="w-3 h-3 shrink-0" />
            {isRTL ? "تحميل QR Code" : "Download QR Code"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
