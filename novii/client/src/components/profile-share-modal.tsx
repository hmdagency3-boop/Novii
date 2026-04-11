import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

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
          title: isRTL ? `بروفايل ${username} على نوفي` : `${username}'s profile on Novii`,
          text: isRTL
            ? `تابع ${fullName || username} على منصة Novii`
            : `Follow ${fullName || username} on Novii`,
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
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden" dir={direction}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className={cn("text-center text-lg font-bold", isRTL && "text-right")}>
            {isRTL ? "مشاركة الملف الشخصي" : "Share Profile"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 px-6 pb-6">
          <div className="relative bg-white p-4 rounded-2xl shadow-md">
            <QRCodeSVG
              id="profile-qr-code"
              value={profileUrl}
              size={180}
              level="H"
              includeMargin={false}
              imageSettings={
                avatarUrl
                  ? {
                      src: avatarUrl,
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }
                  : undefined
              }
              style={{ borderRadius: "8px" }}
            />
          </div>

          <div className="text-center">
            <p className="font-bold text-base">@{username}</p>
            {fullName && (
              <p className="text-sm text-muted-foreground">{fullName}</p>
            )}
          </div>

          <div className="w-full bg-muted rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
              {profileUrl}
            </span>
          </div>

          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {isRTL ? (copied ? "تم النسخ" : "نسخ") : (copied ? "Copied!" : "Copy")}
            </Button>

            <Button
              className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              {isRTL ? "مشاركة" : "Share"}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-2 text-xs"
            onClick={handleDownloadQR}
          >
            <Download className="w-3.5 h-3.5" />
            {isRTL ? "تحميل QR Code" : "Download QR Code"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
