import { Link } from "wouter";
import { ArrowRight, ArrowLeft, FileText } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getLegalTranslation } from "@/lib/legal-translations";

export default function TermsOfService() {
  const { language, direction } = useLanguage();
  const t = getLegalTranslation(language.code);
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

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.termsTitle}</h1>
            <p className="text-muted-foreground text-sm">{t.lastUpdated}</p>
          </div>
        </div>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.terms.acceptance.h}</h2>
            <p className="text-muted-foreground">{t.terms.acceptance.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.terms.account.h}</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {t.terms.account.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.terms.content.h}</h2>
            <p className="text-muted-foreground mb-2">{t.terms.content.intro}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {t.terms.content.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.terms.ip.h}</h2>
            <p className="text-muted-foreground">{t.terms.ip.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.terms.prohibited.h}</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {t.terms.prohibited.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.terms.suspension.h}</h2>
            <p className="text-muted-foreground">{t.terms.suspension.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.terms.disclaimer.h}</h2>
            <p className="text-muted-foreground">{t.terms.disclaimer.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.terms.changes.h}</h2>
            <p className="text-muted-foreground">{t.terms.changes.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.terms.law.h}</h2>
            <p className="text-muted-foreground">{t.terms.law.p}</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
