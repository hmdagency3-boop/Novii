import { useEffect } from "react";
import { Link } from "wouter";

const logo = "/assets/novii_logo_new.png";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "ما هو Novii؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Novii هو تطبيق تواصل اجتماعي عربي حديث يتيح لك مشاركة الصور والفيديوهات والقصص اليومية والريلز مع أصدقائك، مع دعم كامل للغة العربية والإنجليزية."
      }
    },
    {
      "@type": "Question",
      "name": "هل Novii مجاني؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "نعم، Novii مجاني تماماً. يمكنك إنشاء حساب والاستمتاع بجميع المميزات بدون أي رسوم أو اشتراكات."
      }
    },
    {
      "@type": "Question",
      "name": "ما هي مميزات Novii؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "يوفر Novii: مشاركة الصور والفيديوهات، القصص اليومية (Stories)، الريلز القصيرة (Reels)، الرسائل المباشرة، اكتشاف المحتوى، ودعم كامل للغة العربية مع واجهة RTL."
      }
    },
    {
      "@type": "Question",
      "name": "هل يدعم Novii اللغة العربية؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "نعم، Novii مصمم أصلاً للمستخدم العربي مع دعم كامل لاتجاه الكتابة من اليمين لليسار (RTL) ويمكن التبديل بين العربية والإنجليزية في أي وقت."
      }
    },
    {
      "@type": "Question",
      "name": "كيف أنضم إلى Novii؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "يمكنك إنشاء حساب مجاني على Novii بزيارة novii.netlify.app والضغط على 'إنشاء حساب'، ثم إدخال بريدك الإلكتروني وكلمة المرور."
      }
    }
  ]
};

export default function FeaturesPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(faqSchema);
    script.id = "faq-schema";
    if (!document.getElementById("faq-schema")) {
      document.head.appendChild(script);
    }
    document.title = "مميزات Novii — منصة التواصل الاجتماعي العربية";
    return () => {
      const el = document.getElementById("faq-schema");
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl" lang="ar">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/auth">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={logo} alt="Novii" className="w-9 h-9 rounded-xl object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Novii
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/features">
              <span className="text-sm text-purple-300 font-medium cursor-pointer">المميزات</span>
            </Link>
            <Link href="/auth">
              <span className="text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full cursor-pointer hover:opacity-90 transition">
                ابدأ الآن
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm px-4 py-1.5 rounded-full mb-6">
          منصة التواصل الاجتماعي العربية
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
          شارك لحظاتك مع{" "}
          <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            أصدقائك على Novii
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Novii هو تطبيق تواصل اجتماعي حديث يتيح لك مشاركة الصور والفيديوهات واللحظات اليومية
          مع أصدقائك، مع تجربة استخدام سريعة وتصميم عصري يدعم اللغة العربية والإنجليزية بالكامل.
        </p>
        <Link href="/auth">
          <span className="inline-block bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-semibold px-8 py-3.5 rounded-full cursor-pointer hover:opacity-90 transition text-lg shadow-lg shadow-purple-500/25">
            انضم إلى Novii مجاناً
          </span>
        </Link>
      </section>

      {/* About Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl font-bold mb-4">منصة تواصل اجتماعي حديثة</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Novii هو تطبيق تواصل اجتماعي يتيح لك مشاركة الصور والفيديوهات واللحظات اليومية
            مع أصدقائك، مع تجربة استخدام سريعة وتصميم عصري يدعم اللغة العربية والإنجليزية.
            صُمِّم Novii ليكون المنصة المثالية للمجتمع العربي على الإنترنت، حيث يمكنك التعبير
            عن نفسك ومشاركة إبداعك بحرية تامة.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">مميزات Novii</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          كل ما تحتاجه في منصة تواصل اجتماعي واحدة — مصممة خصيصاً لتناسب المستخدم العربي
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "📸",
              title: "مشاركة الصور والفيديوهات",
              desc: "ارفع صورك وفيديوهاتك بجودة عالية وشاركها مع متابعيك وأصدقائك بضغطة واحدة.",
            },
            {
              icon: "🎭",
              title: "القصص اليومية — Stories",
              desc: "أنشئ قصصاً تختفي بعد 24 ساعة لمشاركة لحظاتك اليومية بشكل عفوي وسريع.",
            },
            {
              icon: "🎬",
              title: "الريلز القصيرة — Reels",
              desc: "صوِّر وشارك مقاطع فيديو قصيرة ومسلية واكتشف محتوى جديد من منشئين مبدعين.",
            },
            {
              icon: "💬",
              title: "الرسائل المباشرة",
              desc: "تواصل مع أصدقائك وعائلتك عبر الرسائل الخاصة في أي وقت وبشكل آمن تماماً.",
            },
            {
              icon: "🔍",
              title: "اكتشاف المحتوى",
              desc: "استكشف منشورات وحسابات جديدة تناسب اهتماماتك عبر خوارزمية ذكية ومخصصة.",
            },
            {
              icon: "🌐",
              title: "دعم العربية والإنجليزية",
              desc: "واجهة كاملة بالعربية مع دعم RTL، وإمكانية التبديل للإنجليزية في أي لحظة.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/40 transition"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Novii */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">لماذا Novii؟</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { title: "مجاني تماماً", desc: "انضم وابدأ الاستخدام الفوري بدون أي رسوم أو اشتراكات مخفية." },
            { title: "تصميم عصري", desc: "واجهة أنيقة وسريعة مع وضع مظلم وألوان مخصصة تريح العين." },
            { title: "آمن وخاص", desc: "بياناتك آمنة ومحمية — أنت تتحكم في من يرى محتواك بالكامل." },
            { title: "مجتمع عربي", desc: "تواصل مع مجتمع عربي نابض يشاركك اهتماماتك وثقافتك." },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-2 h-2 rounded-full bg-gradient-to-b from-pink-500 to-purple-500 mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 border border-purple-500/30 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">جاهز تبدأ؟</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            انضم إلى آلاف المستخدمين الذين يشاركون لحظاتهم كل يوم على Novii
          </p>
          <Link href="/auth">
            <span className="inline-block bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-semibold px-8 py-3.5 rounded-full cursor-pointer hover:opacity-90 transition text-lg shadow-lg shadow-purple-500/25">
              إنشاء حساب مجاني
            </span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={logo} alt="Novii" className="w-6 h-6 rounded-lg" />
          <span className="font-semibold text-gray-300">Novii</span>
        </div>
        <p>منصة التواصل الاجتماعي العربية — Arabic Social Media Platform</p>
        <p className="mt-2">© {new Date().getFullYear()} Novii. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
