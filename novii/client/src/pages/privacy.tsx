import { Link } from "wouter";
import { ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getLegalTranslation } from "@/lib/legal-translations";

export default function PrivacyPolicy() {
  const { language, direction } = useLanguage();
  const t = getLegalTranslation(language.code);
  const isRtl = direction === "rtl";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={direction}>
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
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.privacyTitle}</h1>
            <p className="text-muted-foreground text-sm">{t.lastUpdated}</p>
          </div>
        </div>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.intro.h}</h2>
            <p className="text-muted-foreground">{t.privacy.intro.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.dataCollected.h}</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><span className="text-foreground font-medium">{t.privacy.dataCollected.account}</span> {t.privacy.dataCollected.accountP}</li>
              <li><span className="text-foreground font-medium">{t.privacy.dataCollected.content}</span> {t.privacy.dataCollected.contentP}</li>
              <li><span className="text-foreground font-medium">{t.privacy.dataCollected.usage}</span> {t.privacy.dataCollected.usageP}</li>
              <li><span className="text-foreground font-medium">{t.privacy.dataCollected.device}</span> {t.privacy.dataCollected.deviceP}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.dataUsage.h}</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {t.privacy.dataUsage.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.dataSharing.h}</h2>
            <p className="text-muted-foreground">{t.privacy.dataSharing.p}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
              {t.privacy.dataSharing.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.security.h}</h2>
            <p className="text-muted-foreground">{t.privacy.security.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.rights.h}</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {t.privacy.rights.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.cookies.h}</h2>
            <p className="text-muted-foreground">{t.privacy.cookies.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.children.h}</h2>
            <p className="text-muted-foreground">{t.privacy.children.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.changes.h}</h2>
            <p className="text-muted-foreground">{t.privacy.changes.p}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">{t.privacy.contact.h}</h2>
            <p className="text-muted-foreground">{t.privacy.contact.p}</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
