import { Link } from "wouter";
import { ArrowRight, ArrowLeft, HelpCircle, ChevronDown, ChevronUp, MessageCircle, Mail, Users, Lock, Image, Bell, AtSign, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { getInfoTranslation } from "@/lib/info-translations";

const ICONS = [
  <Users className="w-4 h-4" />,
  <Lock className="w-4 h-4" />,
  <Image className="w-4 h-4" />,
  <Image className="w-4 h-4" />,
  <MessageCircle className="w-4 h-4" />,
  <Users className="w-4 h-4" />,
  <Bell className="w-4 h-4" />,
  <Lock className="w-4 h-4" />,
  <AtSign className="w-4 h-4" />,
  <Trash2 className="w-4 h-4" />,
];

export default function Help() {
  const { language, direction } = useLanguage();
  const t = getInfoTranslation(language.code);
  const isRtl = direction === "rtl";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(t.help.allCategory);

  const faqsWithIcons = useMemo(
    () => t.help.faqs.map((f, i) => ({ ...f, icon: ICONS[i] || ICONS[0], catLabel: t.help.cats[f.cat] })),
    [t]
  );

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const labels = [t.help.allCategory];
    faqsWithIcons.forEach(f => { if (!seen.has(f.catLabel)) { seen.add(f.catLabel); labels.push(f.catLabel); } });
    return labels;
  }, [faqsWithIcons, t]);

  const filtered = activeCategory === t.help.allCategory
    ? faqsWithIcons
    : faqsWithIcons.filter(f => f.catLabel === activeCategory);

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

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.help.title}</h1>
            <p className="text-muted-foreground text-sm">{t.help.subtitle}</p>
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
                className={cn(
                  "w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors",
                  isRtl ? "text-right" : "text-left"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {faq.icon}
                  </span>
                  <span className="font-medium text-sm">{faq.q}</span>
                </div>
                {openIndex === i ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/50 bg-accent/10">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
          <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-1">{t.help.contactH}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t.help.contactSub}</p>
          <a
            href="mailto:support@novii.app"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            {t.help.contactBtn}
          </a>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
