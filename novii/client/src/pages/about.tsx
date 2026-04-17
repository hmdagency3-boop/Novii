import { Link } from "wouter";
import { ArrowRight, ArrowLeft, Zap, Globe, Users, Shield, Heart, Star, MessageCircle, Image, Video, Compass } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getInfoTranslation } from "@/lib/info-translations";

const logo = "/assets/novii_logo_new.png";

const FEATURE_ICONS = [
  <Image className="w-5 h-5" />,
  <Video className="w-5 h-5" />,
  <MessageCircle className="w-5 h-5" />,
  <Users className="w-5 h-5" />,
  <Compass className="w-5 h-5" />,
  <Globe className="w-5 h-5" />,
];

const VALUE_ICONS = [
  <Heart className="w-5 h-5 text-red-500" />,
  <Shield className="w-5 h-5 text-blue-500" />,
  <Zap className="w-5 h-5 text-yellow-500" />,
  <Star className="w-5 h-5 text-purple-500" />,
];

export default function About() {
  const { language, direction } = useLanguage();
  const t = getInfoTranslation(language.code);
  const isRtl = direction === "rtl";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground" dir={direction}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/auth">
            <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
              <BackIcon className="w-4 h-4" />
              {t.back}
            </button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <img src={logo} alt="Novii" className="w-20 h-20 mx-auto mb-4 rounded-3xl shadow-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 className="text-3xl font-bold mb-2">{t.about.title}</h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">{t.about.subtitle}</p>
        </div>

        <section className="mb-12">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-3">{t.about.storyH}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{t.about.storyP1}</p>
            <p className="text-muted-foreground leading-relaxed">{t.about.storyP2}</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">{t.about.featuresH}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {t.about.features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/20 transition-all">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {FEATURE_ICONS[i] || FEATURE_ICONS[0]}
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
          <h2 className="text-xl font-bold mb-6">{t.about.valuesH}</h2>
          <div className="space-y-4">
            {t.about.values.map((v, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center flex-shrink-0">
                  {VALUE_ICONS[i] || VALUE_ICONS[0]}
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
          <h2 className="text-xl font-bold mb-6">{t.about.infoH}</h2>
          <div className="space-y-3">
            {t.about.info.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground text-sm">{item.label}</span>
                <span className="font-medium text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="grid grid-cols-3 gap-4 text-center">
            {t.about.stats.map((stat, i) => (
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
              {t.about.links.privacy}
            </button>
          </Link>
          <Link href="/terms">
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-border text-sm hover:bg-accent transition-colors">
              {t.about.links.terms}
            </button>
          </Link>
          <Link href="/help">
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-border text-sm hover:bg-accent transition-colors">
              {t.about.links.help}
            </button>
          </Link>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">{t.about.madeWith}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
