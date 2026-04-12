import { Link } from "wouter";
import { ArrowRight, HelpCircle, ChevronDown, ChevronUp, MessageCircle, Mail, Users, Lock, Image, Bell, AtSign, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    icon: <Users className="w-4 h-4" />,
    category: "الحساب",
    question: "كيف أنشئ حساباً جديداً؟",
    answer: "اضغط على 'إنشاء حساب' في صفحة تسجيل الدخول، ثم أدخل اسمك واسم المستخدم وبريدك الإلكتروني وكلمة المرور. ستتلقى رسالة تأكيد على بريدك الإلكتروني."
  },
  {
    icon: <Lock className="w-4 h-4" />,
    category: "الحساب",
    question: "نسيت كلمة المرور. ماذا أفعل؟",
    answer: "في صفحة تسجيل الدخول، اضغط على 'نسيت كلمة المرور'، أدخل بريدك الإلكتروني، وسترسل لك رسالة لإعادة تعيين كلمة المرور."
  },
  {
    icon: <Image className="w-4 h-4" />,
    category: "المحتوى",
    question: "كيف أنشر صورة أو فيديو؟",
    answer: "اضغط على زر الإنشاء (+) في شريط التنقل، اختر 'منشور'، ثم حدد الصورة أو الفيديو من جهازك وأضف وصفاً واضغط نشر."
  },
  {
    icon: <Image className="w-4 h-4" />,
    category: "المحتوى",
    question: "ما هي صيغ الملفات المدعومة؟",
    answer: "للصور: JPG, PNG, WEBP. للفيديوهات: MP4, MOV. الحجم الأقصى للصور 10 ميغابايت، وللفيديوهات 100 ميغابايت."
  },
  {
    icon: <MessageCircle className="w-4 h-4" />,
    category: "الرسائل",
    question: "كيف أرسل رسالة خاصة؟",
    answer: "اذهب إلى صفحة الرسائل، اضغط على أيقونة التعديل في أعلى الصفحة، ثم ابحث عن المستخدم الذي تريد مراسلته وابدأ المحادثة."
  },
  {
    icon: <Users className="w-4 h-4" />,
    category: "المجتمعات",
    question: "كيف أنشئ مجتمعاً؟",
    answer: "اذهب إلى صفحة الرسائل، اضغط على تبويب 'المجتمعات'، ثم اضغط على أيقونة الإنشاء وأدخل اسم المجتمع والوصف واختر إن كان عاماً أو خاصاً."
  },
  {
    icon: <Bell className="w-4 h-4" />,
    category: "الإشعارات",
    question: "كيف أتحكم في الإشعارات؟",
    answer: "اذهب إلى الإعدادات > الإشعارات، يمكنك هناك تخصيص أنواع الإشعارات التي تريد استلامها مثل الإعجابات والتعليقات والرسائل."
  },
  {
    icon: <Lock className="w-4 h-4" />,
    category: "الخصوصية",
    question: "كيف أجعل حسابي خاصاً؟",
    answer: "اذهب إلى الإعدادات > الخصوصية > خصوصية الحساب، وفعّل خيار 'الحساب الخاص'. بذلك لن يتمكن إلا متابعوك المعتمدون من رؤية منشوراتك."
  },
  {
    icon: <AtSign className="w-4 h-4" />,
    category: "التفاعل",
    question: "كيف أذكر مستخدماً في منشور أو تعليق؟",
    answer: "اكتب الرمز @ متبوعاً باسم المستخدم (مثل @username)، وسيظهر له إشعار بأنك ذكرته."
  },
  {
    icon: <Trash2 className="w-4 h-4" />,
    category: "الحساب",
    question: "كيف أحذف حسابي؟",
    answer: "اذهب إلى الإعدادات > الخصوصية > حذف الحساب. تنبه: حذف الحساب نهائي ولا يمكن استرداد البيانات بعده."
  },
];

const categories = ["الكل", ...Array.from(new Set(faqs.map(f => f.category)))];

export default function Help() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filtered = activeCategory === "الكل" ? faqs : faqs.filter(f => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/auth">
            <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
              <ArrowRight className="w-4 h-4" />
              العودة
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">مركز المساعدة</h1>
            <p className="text-muted-foreground text-sm">كل ما تحتاجه للاستفادة القصوى من نوفيي</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((faq, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-right hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {faq.icon}
                  </span>
                  <span className="font-medium text-sm">{faq.question}</span>
                </div>
                {openIndex === i ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/50 bg-accent/10">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
          <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-1">لم تجد ما تبحث عنه؟</h3>
          <p className="text-sm text-muted-foreground mb-4">فريق الدعم متاح لمساعدتك في أي وقت</p>
          <a
            href="mailto:support@novii.app"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            تواصل معنا
          </a>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2026 Novii · جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}
