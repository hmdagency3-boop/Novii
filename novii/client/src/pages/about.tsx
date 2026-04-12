import { Link } from "wouter";
import { ArrowRight, Zap, Globe, Users, Shield, Heart, Star, MessageCircle, Image, Video, Compass } from "lucide-react";

const logo = "/assets/novii_logo_new.png";

const features = [
  { icon: <Image className="w-5 h-5" />, title: "منشورات غنية", desc: "شارك صورك ومقاطعك مع من تهتم بهم" },
  { icon: <Video className="w-5 h-5" />, title: "ريلز", desc: "مقاطع فيديو قصيرة وإبداعية تصل للجمهور" },
  { icon: <MessageCircle className="w-5 h-5" />, title: "رسائل خاصة", desc: "تواصل مباشر وآمن مع أصدقائك" },
  { icon: <Users className="w-5 h-5" />, title: "مجتمعات", desc: "أنشئ أو انضم لمجتمعات تشاركك اهتماماتك" },
  { icon: <Compass className="w-5 h-5" />, title: "استكشاف", desc: "اكتشف محتوى وأشخاصاً جدداً كل يوم" },
  { icon: <Globe className="w-5 h-5" />, title: "عربي أصيل", desc: "مصمم من الألف للياء للمستخدم العربي مع دعم RTL" },
];

const values = [
  { icon: <Heart className="w-5 h-5 text-red-500" />, title: "المجتمع أولاً", desc: "نبني لمجتمعنا العربي بكل فخر واعتزاز" },
  { icon: <Shield className="w-5 h-5 text-blue-500" />, title: "الأمان والخصوصية", desc: "بياناتك ملكك ونحافظ عليها بأعلى المعايير" },
  { icon: <Zap className="w-5 h-5 text-yellow-500" />, title: "الابتكار المستمر", desc: "نطور ونحسن التطبيق باستمرار بناءً على آرائكم" },
  { icon: <Star className="w-5 h-5 text-purple-500" />, title: "تجربة استثنائية", desc: "نصمم كل تفصيلة لتكون تجربتك رائعة" },
];

export default function About() {
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

        <div className="text-center mb-12">
          <img src={logo} alt="Novii" className="w-20 h-20 mx-auto mb-4 rounded-3xl shadow-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 className="text-3xl font-bold mb-2">حول نوفيي</h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
            منصة تواصل اجتماعي عربية حديثة تجمع بين الإبداع والتكنولوجيا لتوحيد العالم العربي
          </p>
        </div>

        <section className="mb-12">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-3">قصتنا</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              وُلدت فكرة نوفيي من رؤية بسيطة: العالم العربي يستحق منصة تواصل اجتماعي تفهمه وتخدمه بالشكل الذي يستحقه — منصة مصممة خصيصاً للمستخدم العربي، بلغته، وبطريقة تفكيره.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              أطلقنا نوفيي لنكون الخيار الأول للعرب الراغبين في التعبير عن أنفسهم، مشاركة لحظاتهم، والتواصل مع من يشاركونهم الاهتمامات — كل ذلك في بيئة آمنة وعربية الهوية.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">ما يميزنا</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/20 transition-all">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">{f.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">قيمنا</h2>
          <div className="space-y-4">
            {values.map((v, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center flex-shrink-0">
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{v.title}</h3>
                  <p className="text-muted-foreground text-sm">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">معلومات التطبيق</h2>
          <div className="space-y-3">
            {[
              { label: "اسم التطبيق", value: "Novii · نوفيي" },
              { label: "الإصدار", value: "1.0.0" },
              { label: "الفئة", value: "تواصل اجتماعي" },
              { label: "اللغات المدعومة", value: "العربية · الإنجليزية" },
              { label: "سنة الإطلاق", value: "2026" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground text-sm">{item.label}</span>
                <span className="font-medium text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { number: "١٠٠٪", label: "مجاني للأبد" },
              { number: "RTL", label: "دعم عربي كامل" },
              { number: "🔒", label: "خصوصية آمنة" },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <div className="text-2xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link href="/privacy">
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-border text-sm hover:bg-accent transition-colors">
              سياسة الخصوصية
            </button>
          </Link>
          <Link href="/terms">
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-border text-sm hover:bg-accent transition-colors">
              الشروط والأحكام
            </button>
          </Link>
          <Link href="/help">
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-border text-sm hover:bg-accent transition-colors">
              مركز المساعدة
            </button>
          </Link>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">صُنع بـ ❤️ للعالم العربي</p>
          <p className="text-sm text-muted-foreground mt-1">© 2026 Novii · جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}
