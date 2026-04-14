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
  ArrowLeft, ArrowRight, Clock, Info, ChevronRight,
  Smartphone, Lock, CheckCircle2, FileText, Heart, Award, XCircle, BadgeCheck, Building2, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      case "post_restored":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-white" />,
          bg: "bg-green-600",
          bgLight: "bg-green-50 dark:bg-green-950/30",
          border: "border-green-200 dark:border-green-800",
          titleAr: "تم استعادة منشورك",
          titleEn: "Your Post Was Restored",
          subtitleAr: "منشورك أصبح مرئياً مجدداً لجميع المستخدمين",
          subtitleEn: "Your post is now visible again to all users",
          severityAr: "استعادة",
          severityEn: "Restored",
          severityColor: "text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400",
        };
      case "report_resolved":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-white" />,
          bg: "bg-blue-600",
          bgLight: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-200 dark:border-blue-800",
          titleAr: "تم اتخاذ إجراء بخصوص بلاغك",
          titleEn: "Action Taken on Your Report",
          subtitleAr: "شكراً لمساعدتنا في الحفاظ على مجتمع نوفي آمناً",
          subtitleEn: "Thank you for helping keep the Novii community safe",
          severityAr: "بلاغ",
          severityEn: "Report",
          severityColor: "text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400",
        };
      case "verified_granted":
        return {
          icon: <BadgeCheck className="w-8 h-8 text-primary fill-primary/20" />,
          bg: "bg-primary/10",
          bgLight: "bg-primary/5 dark:bg-primary/10",
          border: "border-primary/20 dark:border-primary/30",
          headerCircle: "bg-primary/15",
          headerText: "text-foreground",
          headerSubtext: "text-muted-foreground",
          titleAr: "تم توثيق حسابك",
          titleEn: "Your Account is Verified",
          subtitleAr: "أصبح حسابك يحمل علامة التوثيق الرسمية",
          subtitleEn: "Your account now carries the official verification badge",
          severityAr: "توثيق",
          severityEn: "Verified",
          severityColor: "text-primary bg-primary/10 dark:bg-primary/20",
        };
      case "verified_removed":
        return {
          icon: <BadgeCheck className="w-8 h-8 text-gray-400" />,
          bg: "bg-gray-100 dark:bg-gray-800",
          bgLight: "bg-gray-50 dark:bg-gray-950/30",
          border: "border-gray-200 dark:border-gray-800",
          headerCircle: "bg-gray-200 dark:bg-gray-700",
          headerText: "text-foreground",
          headerSubtext: "text-muted-foreground",
          titleAr: "تم إزالة توثيق حسابك",
          titleEn: "Account Verification Removed",
          subtitleAr: "لم يعد حسابك يحمل علامة التوثيق",
          subtitleEn: "Your account no longer carries the verification badge",
          severityAr: "تحديث",
          severityEn: "Update",
          severityColor: "text-gray-600 bg-gray-100 dark:bg-gray-900/40 dark:text-gray-400",
        };
      case "official_granted":
        return {
          icon: <Building2 className="w-8 h-8 text-white" />,
          bg: "bg-purple-600",
          bgLight: "bg-purple-50 dark:bg-purple-950/30",
          border: "border-purple-200 dark:border-purple-800",
          titleAr: "حسابك أصبح حساباً رسمياً",
          titleEn: "Your Account is Now Official",
          subtitleAr: "تم اعتماد حسابك كحساب رسمي على منصة نوفي",
          subtitleEn: "Your account has been recognized as official on Novii",
          severityAr: "رسمي",
          severityEn: "Official",
          severityColor: "text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400",
        };
      case "official_removed":
        return {
          icon: <Building2 className="w-8 h-8 text-white" />,
          bg: "bg-gray-500",
          bgLight: "bg-gray-50 dark:bg-gray-950/30",
          border: "border-gray-200 dark:border-gray-800",
          titleAr: "تم إزالة صفة الحساب الرسمي",
          titleEn: "Official Status Removed",
          subtitleAr: "لم يعد حسابك معتمداً كحساب رسمي",
          subtitleEn: "Your account is no longer recognized as official",
          severityAr: "تحديث",
          severityEn: "Update",
          severityColor: "text-gray-600 bg-gray-100 dark:bg-gray-900/40 dark:text-gray-400",
        };
      case "badge_awarded":
        return {
          icon: <Award className="w-8 h-8 text-white" />,
          bg: "bg-yellow-500",
          bgLight: "bg-yellow-50 dark:bg-yellow-950/30",
          border: "border-yellow-200 dark:border-yellow-800",
          titleAr: "تم منحك شارة جديدة!",
          titleEn: "You Received a New Badge!",
          subtitleAr: "تهانينا! تم تقدير مساهمتك في مجتمع نوفي",
          subtitleEn: "Congratulations! Your contribution to the Novii community has been recognized",
          severityAr: "شارة",
          severityEn: "Badge",
          severityColor: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400",
        };
      case "badge_removed":
        return {
          icon: <XCircle className="w-8 h-8 text-white" />,
          bg: "bg-gray-500",
          bgLight: "bg-gray-50 dark:bg-gray-950/30",
          border: "border-gray-200 dark:border-gray-800",
          titleAr: "تم إزالة شارة من حسابك",
          titleEn: "A Badge Was Removed",
          subtitleAr: "تم تحديث شارات حسابك من قبل الإدارة",
          subtitleEn: "Your account badges were updated by administration",
          severityAr: "تحديث",
          severityEn: "Update",
          severityColor: "text-gray-600 bg-gray-100 dark:bg-gray-900/40 dark:text-gray-400",
        };
      case "security":
        return {
          icon: <Smartphone className="w-8 h-8 text-white" />,
          bg: "bg-slate-700",
          bgLight: "bg-slate-50 dark:bg-slate-950/30",
          border: "border-slate-200 dark:border-slate-800",
          titleAr: "تنبيه أمان",
          titleEn: "Security Alert",
          subtitleAr: "تم رصد نشاط يتعلق بأمان حسابك",
          subtitleEn: "Activity related to your account security was detected",
          severityAr: "أمان",
          severityEn: "Security",
          severityColor: "text-slate-600 bg-slate-100 dark:bg-slate-900/40 dark:text-slate-400",
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
  const type = notification.type;

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 pb-24 pt-2">
        <Link href="/notifications" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <BackArrow className="w-4 h-4" />
          {isAr ? "الإشعارات" : "Notifications"}
        </Link>

        <div className={cn("rounded-2xl overflow-hidden border", config.border, config.bgLight)}>
          <div className={cn("p-6 flex flex-col items-center text-center gap-3", config.bg)}>
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", config.headerCircle || "bg-white/20")}>
              {config.icon}
            </div>
            <h1 className={cn("text-xl font-bold", config.headerText || "text-white")}>
              {isAr ? config.titleAr : config.titleEn}
            </h1>
            <p className={cn("text-sm", config.headerSubtext || "text-white/80")}>
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
                      {isAr ? "التفاصيل" : "Details"}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {notification.content}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {type === "warning" && <WarningSection isAr={isAr} />}
            {type === "post_removed" && <PostRemovedSection isAr={isAr} />}
            {type === "post_restored" && <PostRestoredSection isAr={isAr} />}
            {type === "ban" && <BanSection isAr={isAr} />}
            {type === "unban" && <UnbanSection isAr={isAr} />}
            {type === "report_resolved" && <ReportResolvedSection isAr={isAr} />}
            {type === "verified_granted" && <VerifiedGrantedSection isAr={isAr} />}
            {type === "verified_removed" && <VerifiedRemovedSection isAr={isAr} />}
            {type === "official_granted" && <OfficialGrantedSection isAr={isAr} />}
            {type === "official_removed" && <OfficialRemovedSection isAr={isAr} />}
            {type === "badge_awarded" && <BadgeAwardedSection isAr={isAr} />}
            {type === "badge_removed" && <BadgeRemovedSection isAr={isAr} />}
            {type === "security" && <SecuritySection isAr={isAr} />}

            <FooterLinks type={type} isAr={isAr} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function WarningSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <FileText className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "ما الذي يعنيه هذا التحذير؟" : "What does this warning mean?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "تم رصد نشاط مخالف لسياسة الاستخدام في حسابك",
                "هذا التحذير يُسجَّل في سجل حسابك",
                "التحذيرات المتكررة قد تؤدي لتقييد الحساب أو حظره",
              ] : [
                "Activity violating our usage policy was detected on your account",
                "This warning is recorded in your account history",
                "Repeated warnings may lead to account restriction or ban",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
              {isAr ? "كيف تتجنب ذلك مستقبلاً؟" : "How to avoid this in the future?"}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
              {isAr
                ? "يرجى مراجعة إرشادات المجتمع والالتزام بها. تجنب نشر محتوى مسيء أو مخالف، واحرص على احترام الآخرين."
                : "Please review and follow our community guidelines. Avoid posting offensive or violating content, and make sure to respect others."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function PostRemovedSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "لماذا تم حذف منشورك؟" : "Why was your post removed?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "المنشور خالف واحدة أو أكثر من سياسات المحتوى",
                "تمت مراجعة المنشور من قبل فريق الإدارة",
                "لا يمكنك استعادة المنشور المحذوف",
              ] : [
                "The post violated one or more content policies",
                "The post was reviewed by our moderation team",
                "You cannot restore the removed post",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
              {isAr ? "تنبيه مهم" : "Important Notice"}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
              {isAr
                ? "تكرار نشر محتوى مخالف قد يؤدي إلى تحذير رسمي أو تقييد حسابك. يرجى الالتزام بسياسة المحتوى."
                : "Repeatedly posting violating content may lead to a formal warning or account restriction. Please follow our content policy."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function PostRestoredSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "ماذا يعني ذلك؟" : "What does this mean?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "تمت مراجعة منشورك من قبل فريق الإدارة",
                "تقرر إعادة المنشور ليكون مرئياً لجميع المستخدمين",
                "يمكن للآخرين رؤية منشورك والتفاعل معه بشكل طبيعي",
              ] : [
                "Your post was reviewed by our moderation team",
                "It was decided to restore your post and make it visible to all users",
                "Others can now see and interact with your post normally",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-2.5">
          <Heart className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
              {isAr ? "شكراً لصبرك" : "Thank you for your patience"}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 leading-relaxed">
              {isAr
                ? "نعتذر عن أي إزعاج. نحرص على مراجعة المحتوى بعناية لضمان تجربة عادلة للجميع."
                : "We apologize for any inconvenience. We carefully review content to ensure a fair experience for everyone."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function BanSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <ShieldBan className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "ما الذي يعنيه تقييد حسابك؟" : "What does account restriction mean?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "لن تتمكن من نشر محتوى جديد أو التفاعل مع المنشورات",
                "لن تتمكن من إرسال رسائل لمستخدمين آخرين",
                "حسابك وبياناتك محفوظة ولن تُحذف",
                "يمكن للإدارة رفع التقييد في أي وقت بعد المراجعة",
              ] : [
                "You won't be able to post new content or interact with posts",
                "You won't be able to send messages to other users",
                "Your account and data are preserved and won't be deleted",
                "Administration can lift the restriction at any time after review",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
              {isAr ? "هل يمكنني الاعتراض؟" : "Can I appeal?"}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 leading-relaxed">
              {isAr
                ? "إذا كنت تعتقد أن هذا القرار غير عادل، يمكنك التواصل مع فريق الدعم من خلال مركز المساعدة لمراجعة حالتك."
                : "If you believe this decision was unfair, you can contact our support team through the Help Center to review your case."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function UnbanSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "ماذا يعني رفع التقييد؟" : "What does lifting the restriction mean?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "يمكنك الآن نشر محتوى جديد والتفاعل بشكل طبيعي",
                "يمكنك إرسال واستقبال الرسائل مجدداً",
                "جميع ميزات حسابك تعمل بالكامل",
              ] : [
                "You can now post new content and interact normally",
                "You can send and receive messages again",
                "All your account features are fully functional",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-2.5">
          <Heart className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
              {isAr ? "مرحباً بعودتك!" : "Welcome back!"}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 leading-relaxed">
              {isAr
                ? "نتمنى لك تجربة ممتعة. يرجى الالتزام بإرشادات المنصة للحفاظ على مجتمع آمن ومحترم للجميع."
                : "We hope you enjoy your experience. Please follow platform guidelines to maintain a safe and respectful community for everyone."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ReportResolvedSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "ماذا حدث؟" : "What happened?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "تم مراجعة بلاغك من قبل فريق الإدارة",
                "تم اتخاذ الإجراء المناسب بناءً على سياسات المنصة",
                "لا يمكننا مشاركة تفاصيل الإجراء المتخذ حماية للخصوصية",
              ] : [
                "Your report was reviewed by our moderation team",
                "Appropriate action was taken based on platform policies",
                "We cannot share details of the action taken for privacy reasons",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
              {isAr ? "شكراً لك" : "Thank You"}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 leading-relaxed">
              {isAr
                ? "بلاغك يساعدنا في الحفاظ على مجتمع نوفي آمناً. نقدّر مساهمتك وإذا لاحظت أي محتوى آخر مخالف لا تتردد في الإبلاغ."
                : "Your report helps us keep the Novii community safe. We appreciate your contribution and if you notice any other violating content, don't hesitate to report it."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function VerifiedGrantedSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-5 border border-primary/20 text-center">
        <BadgeCheck className="w-12 h-12 text-primary fill-primary/20 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground mb-1">
          {isAr ? "حسابك موثّق رسمياً" : "Your Account is Officially Verified"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isAr ? "أصبحت علامة التوثيق تظهر بجانب اسمك في كل مكان على نوفي" : "The verification badge now appears next to your name everywhere on Novii"}
        </p>
      </div>

      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <BadgeCheck className="w-4 h-4 text-primary fill-primary/20 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "ماذا يعني التوثيق؟" : "What does verification mean?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "علامة التوثيق تؤكد أن حسابك حقيقي وموثوق",
                "تظهر العلامة بجانب اسمك في المنشورات والتعليقات والبحث",
                "الحسابات الموثقة تحظى بثقة أعلى من المستخدمين",
                "التوثيق يساعد في حمايتك من انتحال الهوية",
              ] : [
                "The verification badge confirms your account is authentic and trustworthy",
                "The badge appears next to your name in posts, comments, and search",
                "Verified accounts enjoy higher trust from other users",
                "Verification helps protect you from identity impersonation",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20">
        <div className="flex items-start gap-2.5">
          <Star className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-primary mb-1">
              {isAr ? "تهانينا على التوثيق!" : "Congratulations on your verification!"}
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              {isAr
                ? "حافظ على نشاطك الإيجابي واحترم إرشادات المنصة للحفاظ على هذه الصفة."
                : "Maintain your positive activity and respect platform guidelines to keep this status."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function VerifiedRemovedSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-200 dark:border-gray-800 text-center">
        <BadgeCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground mb-1">
          {isAr ? "تم إزالة علامة التوثيق" : "Verification Badge Removed"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isAr ? "لم يعد حسابك يحمل علامة التوثيق على نوفي" : "Your account no longer carries the verification badge on Novii"}
        </p>
      </div>

      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "لماذا تم إزالة التوثيق؟" : "Why was verification removed?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "قد يتم إزالة التوثيق بسبب مخالفة شروط الحصول عليه",
                "تغيير بيانات الحساب الأساسية قد يستوجب إعادة التوثيق",
                "لا يزال بإمكانك استخدام حسابك ومحتواك بشكل طبيعي",
                "يمكنك التواصل مع الدعم لمعرفة التفاصيل",
              ] : [
                "Verification may be removed due to a violation of verification terms",
                "Changing fundamental account information may require re-verification",
                "You can still use your account and content normally",
                "You can contact support for more details",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function OfficialGrantedSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <Building2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "ماذا يعني الحساب الرسمي؟" : "What does an official account mean?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "حسابك معتمد كحساب رسمي يمثل جهة أو شخصية معروفة",
                "تظهر شارة الحساب الرسمي بجانب اسمك في كل مكان",
                "الحسابات الرسمية تحظى بأولوية في الظهور والبحث",
                "أنت مسؤول عن المحتوى الذي يُنشر باسم هذا الحساب",
              ] : [
                "Your account is recognized as officially representing a known entity or personality",
                "The official badge appears next to your name everywhere",
                "Official accounts get priority in visibility and search",
                "You are responsible for content published under this account",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-2.5">
          <Star className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">
              {isAr ? "مرحباً بك كحساب رسمي!" : "Welcome as an official account!"}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-500 leading-relaxed">
              {isAr
                ? "نفخر بانضمامك رسمياً إلى منصة نوفي. احرص على تقديم محتوى يليق بمكانتك ويحترم مجتمعنا."
                : "We're proud to have you officially on Novii. Make sure to provide content worthy of your status and respectful of our community."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function OfficialRemovedSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "لماذا تم إزالة صفة الحساب الرسمي؟" : "Why was official status removed?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "قد تتم إزالة الصفة الرسمية بسبب مخالفة شروط الحسابات الرسمية",
                "قد يكون السبب تغيير في طبيعة الجهة أو الشخصية الممثلة",
                "لا يزال بإمكانك استخدام حسابك بشكل طبيعي",
                "يمكنك التواصل مع الدعم لمعرفة التفاصيل أو إعادة التقديم",
              ] : [
                "Official status may be removed due to a violation of official account terms",
                "The removal may be due to a change in the represented entity or personality",
                "You can still use your account normally",
                "You can contact support for details or to reapply",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function BadgeAwardedSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <Award className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "ماذا تعني الشارة؟" : "What does a badge mean?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "الشارات تعكس مكانتك ومساهمتك في مجتمع نوفي",
                "تظهر الشارة بجانب اسمك في ملفك الشخصي والمنشورات",
                "الشارات تمنح من قبل إدارة نوفي تقديراً لنشاطك",
              ] : [
                "Badges reflect your status and contribution to the Novii community",
                "The badge appears next to your name on your profile and posts",
                "Badges are granted by Novii administration in recognition of your activity",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-2.5">
          <Heart className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
              {isAr ? "تهانينا!" : "Congratulations!"}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 leading-relaxed">
              {isAr
                ? "استمر في مساهمتك الإيجابية في المجتمع. يمكنك رؤية جميع شاراتك في ملفك الشخصي."
                : "Keep up your positive contribution to the community. You can see all your badges on your profile."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function BadgeRemovedSection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <XCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "لماذا تم إزالة الشارة؟" : "Why was the badge removed?"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "قد تتم إزالة الشارات بسبب تحديث معايير المنح",
                "قد يكون السبب مخالفة شروط الحصول على الشارة",
                "لا يؤثر ذلك على حسابك أو محتواك",
              ] : [
                "Badges may be removed due to updated eligibility criteria",
                "The removal may be due to a violation of badge terms",
                "This does not affect your account or content",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {isAr ? "هل لديك استفسار؟" : "Have a question?"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {isAr
                ? "إذا كنت تعتقد أن هذا القرار غير صحيح، يمكنك التواصل مع فريق الدعم من خلال مركز المساعدة."
                : "If you believe this decision was incorrect, you can contact our support team through the Help Center."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function SecuritySection({ isAr }: { isAr: boolean }) {
  return (
    <>
      <div className="bg-background rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">
              {isAr ? "نصائح لحماية حسابك" : "Tips to protect your account"}
            </p>
            <ul className="space-y-2">
              {(isAr ? [
                "استخدم كلمة مرور قوية وفريدة لحسابك",
                "لا تشارك بيانات تسجيل الدخول مع أي شخص",
                "راجع الأجهزة المتصلة بحسابك من الإعدادات",
                "إذا لم تتعرف على هذا النشاط، قم بتغيير كلمة المرور فوراً",
              ] : [
                "Use a strong and unique password for your account",
                "Never share your login credentials with anyone",
                "Review connected devices from your settings",
                "If you don't recognize this activity, change your password immediately",
              ]).map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2.5">
          <Smartphone className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? "إدارة الأجهزة" : "Manage Devices"}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? "يمكنك مراجعة وإزالة الأجهزة المتصلة بحسابك من إعدادات الأمان. إذا رأيت جهازاً لا تعرفه، قم بإزالته وتغيير كلمة المرور."
                : "You can review and remove devices connected to your account from security settings. If you see an unfamiliar device, remove it and change your password."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function FooterLinks({ type, isAr }: { type: string; isAr: boolean }) {
  const isViolation = type === "warning" || type === "post_removed" || type === "ban";
  const isSecurity = type === "security";
  const isBadge = type === "badge_awarded" || type === "badge_removed" || type === "verified_granted" || type === "official_granted";
  const isRemoval = type === "verified_removed" || type === "official_removed" || type === "badge_removed";

  return (
    <div className="pt-2 space-y-2">
      {isViolation && (
        <Link
          href="/terms"
          className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium">{isAr ? "سياسة الاستخدام" : "Terms of Service"}</span>
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground", isAr && "rotate-180")} />
        </Link>
      )}
      {isSecurity && (
        <Link
          href="/settings"
          className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium">{isAr ? "إعدادات الأمان" : "Security Settings"}</span>
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground", isAr && "rotate-180")} />
        </Link>
      )}
      {isBadge && (
        <Link
          href="/profile"
          className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium">{isAr ? "ملفي الشخصي" : "My Profile"}</span>
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground", isAr && "rotate-180")} />
        </Link>
      )}
      {(isViolation || isRemoval) && (
        <Link
          href="/help"
          className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium">{isAr ? "مركز المساعدة" : "Help Center"}</span>
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground", isAr && "rotate-180")} />
        </Link>
      )}
    </div>
  );
}
