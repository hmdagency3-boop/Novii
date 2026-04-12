import { Link } from "wouter";
import { ArrowRight, FileText } from "lucide-react";

export default function TermsOfService() {
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
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الشروط والأحكام</h1>
            <p className="text-muted-foreground text-sm">آخر تحديث: أبريل 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">١. القبول والموافقة</h2>
            <p className="text-muted-foreground">
              باستخدامك لتطبيق نوفيي (Novii)، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يُرجى عدم استخدام التطبيق.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٢. شروط الحساب</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>يجب أن يكون عمرك ١٣ عاماً على الأقل لإنشاء حساب.</li>
              <li>يجب تقديم معلومات دقيقة وصحيحة عند التسجيل.</li>
              <li>أنت مسؤول عن الحفاظ على سرية كلمة مرورك.</li>
              <li>يُحظر إنشاء أكثر من حساب شخصي لشخص واحد.</li>
              <li>يُحظر استخدام حساب شخص آخر دون إذنه.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٣. قواعد المحتوى</h2>
            <p className="text-muted-foreground mb-2">يُحظر نشر أي محتوى يتضمن:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>محتوى جنسي صريح أو غير لائق.</li>
              <li>خطاب الكراهية أو التمييز على أساس العرق أو الدين أو الجنس.</li>
              <li>التحرش أو التنمر الإلكتروني.</li>
              <li>المحتوى المضلل أو الأخبار الكاذبة.</li>
              <li>المحتوى الذي ينتهك حقوق الملكية الفكرية.</li>
              <li>أي محتوى يروج للعنف أو النشاط غير القانوني.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٤. حقوق الملكية الفكرية</h2>
            <p className="text-muted-foreground">
              أنت تمتلك المحتوى الذي تنشره. بنشره على نوفيي، فإنك تمنحنا ترخيصاً غير حصري لاستخدامه وعرضه داخل التطبيق. نحن لن نبيع محتواك أو نستخدمه لأغراض تجارية خارج التطبيق.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٥. السلوك المحظور</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>محاولة اختراق التطبيق أو سرقة بيانات المستخدمين.</li>
              <li>استخدام روبوتات أو برامج آلية للتفاعل مع التطبيق.</li>
              <li>الإعلان أو الترويج التجاري دون موافقة مسبقة.</li>
              <li>جمع بيانات المستخدمين الآخرين.</li>
              <li>إنشاء حسابات وهمية أو انتحال شخصية الآخرين.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٦. تعليق الحسابات وإنهاؤها</h2>
            <p className="text-muted-foreground">
              نحتفظ بالحق في تعليق أو إنهاء أي حساب يخالف هذه الشروط، دون إشعار مسبق في حالات الانتهاكات الجسيمة. يمكنك حذف حسابك في أي وقت من إعدادات التطبيق.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٧. إخلاء المسؤولية</h2>
            <p className="text-muted-foreground">
              نوفيي غير مسؤول عن المحتوى الذي ينشره المستخدمون. التطبيق مقدم "كما هو" دون ضمانات من أي نوع. لن نكون مسؤولين عن أي خسائر مباشرة أو غير مباشرة ناتجة عن استخدام التطبيق.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٨. التغييرات على الشروط</h2>
            <p className="text-muted-foreground">
              قد نعدّل هذه الشروط في أي وقت. استمرارك في استخدام التطبيق بعد التعديلات يعني موافقتك على الشروط الجديدة.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٩. القانون المنظم</h2>
            <p className="text-muted-foreground">
              تخضع هذه الشروط للقوانين المعمول بها. أي نزاع يتعلق بهذه الشروط سيتم حله عبر التفاوض الودي أولاً، ثم عبر الجهات القانونية المختصة.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2026 Novii · جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}
