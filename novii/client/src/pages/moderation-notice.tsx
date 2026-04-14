import Layout from "@/components/layout";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  AlertTriangle, Trash2, ShieldBan, ShieldCheck, Shield,
  ArrowLeft, ArrowRight, FileText, Clock, Info, ChevronRight, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

const GUIDELINES = [
  { ar: "لا تنشر محتوى مسيء أو مخالف", en: "Do not post offensive or violating content" },
  { ar: "احترم خصوصية الآخرين", en: "Respect others' privacy" },
  { ar: "لا تنشر محتوى عنيف أو تحريضي", en: "Do not post violent or inciting content" },
  { ar: "لا تستخدم المنصة للتحرش أو التنمر", en: "Do not use the platform for harassment or bullying" },
  { ar: "لا ترسل رسائل مزعجة أو سبام", en: "Do not send spam or unwanted messages" },
];

export default function ModerationNotice() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language.code === "ar";

  const { data: notification, isLoading } = useQuery({
    queryKey: ["moderation-notice", id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (error) throw error;

      if (data && !data.is_read) {
        await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      }

      return data;
    },
    enabled: !!user && !!id,
  });

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "warning":
        return {
          icon: <AlertTriangle className="w-8 h-8 text-white" />,
          bg: "bg-amber-500",
          bgLight: "bg-amber-50 dark:bg-amber-950/30",
          border: "border-amber-200 dark:border-amber-800",
          titleAr: "تحذير من إدارة نوفي",
          titleEn: "Warning from Novii",
          subtitleAr: "تم إرسال تحذير لك بسبب مخالفة سياسة الاستخدام",
          subtitleEn: "You received a warning for violating community guidelines",
          severityAr: "تحذير",
          severityEn: "Warning",
          severityColor: "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400",
        };
      case "post_removed":
        return {
          icon: <Trash2 className="w-8 h-8 text-white" />,
          bg: "bg-red-600",
          bgLight: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-200 dark:border-red-800",
          titleAr: "تم إزالة منشورك",
          titleEn: "Your Post Was Removed",
          subtitleAr: "تمت إزالة منشورك لمخالفته سياسة الاستخدام",
          subtitleEn: "Your post was removed for violating community guidelines",
          severityAr: "إزالة محتوى",
          severityEn: "Content Removal",
          severityColor: "text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400",
        };
      case "ban":
        return {
          icon: <ShieldBan className="w-8 h-8 text-white" />,
          bg: "bg-red-700",
          bgLight: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-200 dark:border-red-800",
          titleAr: "تم تقييد حسابك",
          titleEn: "Your Account Was Restricted",
          subtitleAr: "تم تقييد حسابك بسبب مخالفات متكررة",
          subtitleEn: "Your account was restricted due to repeated violations",
          severityAr: "تقييد حساب",
          severityEn: "Account Restriction",
          severityColor: "text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-400",
        };
      case "unban":
        return {
          icon: <ShieldCheck className="w-8 h-8 text-white" />,
          bg: "bg-green-600",
          bgLight: "bg-green-50 dark:bg-green-950/30",
          border: "border-green-200 dark:border-green-800",
          titleAr: "تم رفع التقييد عن حسابك",
          titleEn: "Your Account Restriction Was Lifted",
          subtitleAr: "يمكنك الآن استخدام المنصة بشكل طبيعي",
          subtitleEn: "You can now use the platform normally",
          severityAr: "رفع تقييد",
          severityEn: "Restriction Lifted",
          severityColor: "text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400",
        };
      case "report_resolved":
        return {
          icon: <Shield className="w-8 h-8 text-white" />,
          bg: "bg-blue-600",
          bgLight: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-200 dark:border-blue-800",
          titleAr: "تم اتخاذ إجراء بخصوص بلاغك",
          titleEn: "Action Taken on Your Report",
          subtitleAr: "شكراً لمساعدتنا في الحفاظ على مجتمع نوفي آمناً",
          subtitleEn: "Thank you for helping keep the Novii community safe",
          severityAr: "إجراء إداري",
          severityEn: "Administrative Action",
          severityColor: "text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400",
        };
      default:
        return {
          icon: <Shield className="w-8 h-8 text-white" />,
          bg: "bg-slate-600",
          bgLight: "bg-slate-50 dark:bg-slate-950/30",
          border: "border-slate-200 dark:border-slate-800",
          titleAr: "إشعار إداري",
          titleEn: "Administrative Notice",
          subtitleAr: "إشعار من إدارة نوفي",
          subtitleEn: "Notice from Novii Administration",
          severityAr: "إشعار",
          severityEn: "Notice",
          severityColor: "text-slate-600 bg-slate-100 dark:bg-slate-900/40 dark:text-slate-400",
        };
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!notification) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">{isAr ? "لم يتم العثور على الإشعار" : "Notification not found"}</p>
          <Link href="/notifications" className="text-primary text-sm font-medium hover:underline">
            {isAr ? "العودة للإشعارات" : "Back to notifications"}
          </Link>
        </div>
      </Layout>
    );
  }

  const config = getTypeConfig(notification.type);
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 pb-24 pt-2">
        <Link href="/notifications" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <BackArrow className="w-4 h-4" />
          {isAr ? "الإشعارات" : "Notifications"}
        </Link>

        <div className={cn("rounded-2xl overflow-hidden border", config.border, config.bgLight)}>
          <div className={cn("p-6 flex flex-col items-center text-center gap-3", config.bg)}>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              {config.icon}
            </div>
            <h1 className="text-xl font-bold text-white">
              {isAr ? config.titleAr : config.titleEn}
            </h1>
            <p className="text-sm text-white/80">
              {isAr ? config.subtitleAr : config.subtitleEn}
            </p>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(notification.created_at), isAr ? "d MMMM yyyy • HH:mm" : "MMM d, yyyy • HH:mm", { locale: isAr ? ar : undefined })}
                </span>
              </div>
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", config.severityColor)}>
                {isAr ? config.severityAr : config.severityEn}
              </span>
            </div>

            {notification.content && (
              <div className="bg-background rounded-xl p-4 border border-border">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      {isAr ? "تفاصيل الإجراء" : "Action Details"}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {notification.content}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {notification.type !== "report_resolved" && notification.type !== "unban" && (
              <div className="bg-background rounded-xl p-4 border border-border">
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground mb-2.5">
                      {isAr ? "إرشادات المجتمع" : "Community Guidelines"}
                    </p>
                    <ul className="space-y-2">
                      {GUIDELINES.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-1.5 flex-shrink-0" />
                          {isAr ? g.ar : g.en}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {notification.type === "report_resolved" && (
              <div className="bg-background rounded-xl p-4 border border-border">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      {isAr ? "شكراً لك" : "Thank You"}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {isAr
                        ? "بلاغك يساعدنا في الحفاظ على مجتمع نوفي آمناً ومناسباً للجميع. نقدّر وقتك ومساهمتك في جعل المنصة مكاناً أفضل."
                        : "Your report helps us keep the Novii community safe and appropriate for everyone. We appreciate your time and contribution to making the platform a better place."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(notification.type === "warning" || notification.type === "post_removed") && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                      {isAr ? "ماذا يحدث بعد ذلك؟" : "What happens next?"}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
                      {isAr
                        ? "يرجى الالتزام بإرشادات المجتمع لتجنب إجراءات أشد مثل تقييد الحساب أو حظره. المخالفات المتكررة قد تؤدي إلى إجراءات أكثر صرامة."
                        : "Please follow community guidelines to avoid stricter actions such as account restriction or ban. Repeated violations may lead to more severe measures."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <Link
                href="/terms"
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">{isAr ? "سياسة الاستخدام" : "Terms of Service"}</span>
                <ChevronRight className={cn("w-4 h-4 text-muted-foreground", isAr && "rotate-180")} />
              </Link>
              <Link
                href="/help"
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">{isAr ? "مركز المساعدة" : "Help Center"}</span>
                <ChevronRight className={cn("w-4 h-4 text-muted-foreground", isAr && "rotate-180")} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
