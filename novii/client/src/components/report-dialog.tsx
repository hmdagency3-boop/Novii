import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { Flag, X, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  reportedUserId: string;
}

const REPORT_REASONS = [
  { id: "spam", ar: "محتوى مزعج / سبام", en: "Spam" },
  { id: "nudity", ar: "محتوى إباحي أو عري", en: "Nudity or sexual content" },
  { id: "harassment", ar: "تنمر أو تحرش", en: "Harassment or bullying" },
  { id: "violence", ar: "عنف أو تهديد", en: "Violence or threats" },
  { id: "hate_speech", ar: "خطاب كراهية", en: "Hate speech" },
  { id: "false_info", ar: "معلومات مضللة", en: "False information" },
  { id: "impersonation", ar: "انتحال شخصية", en: "Impersonation" },
  { id: "intellectual_property", ar: "انتهاك حقوق ملكية فكرية", en: "Intellectual property violation" },
  { id: "other", ar: "سبب آخر", en: "Other" },
];

export function ReportDialog({ open, onClose, postId, reportedUserId }: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { direction } = useLanguage();
  const t = direction === "rtl";

  if (!open) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    setError(null);

    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          reported_user_id: reportedUserId,
          reason: selectedReason,
          description: description.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        setError(t ? "لقد أبلغت عن هذا المنشور مسبقاً" : "You have already reported this post");
        setSubmitting(false);
        return;
      }

      if (!res.ok) throw new Error("Failed");

      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(t ? "حدث خطأ، حاول مرة أخرى" : "An error occurred, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription("");
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        dir={direction}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold">{t ? "الإبلاغ عن المنشور" : "Report Post"}</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="text-lg font-semibold">{t ? "شكراً لك!" : "Thank you!"}</p>
            <p className="text-sm text-muted-foreground">
              {t ? "تم إرسال البلاغ وسيتم مراجعته من قبل فريقنا" : "Your report has been submitted and will be reviewed by our team"}
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t ? "اختر سبب الإبلاغ:" : "Select a reason:"}
            </p>

            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-start px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    selectedReason === reason.id
                      ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  {t ? reason.ar : reason.en}
                </button>
              ))}
            </div>

            {selectedReason && (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t ? "تفاصيل إضافية (اختياري)..." : "Additional details (optional)..."}
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
                rows={3}
                maxLength={500}
              />
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedReason || submitting}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t ? "جاري الإرسال..." : "Submitting..."}
                </>
              ) : (
                t ? "إرسال البلاغ" : "Submit Report"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
