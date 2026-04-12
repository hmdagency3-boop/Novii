import { Link } from "wouter";
import { ArrowRight, Shield } from "lucide-react";

export default function PrivacyPolicy() {
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
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سياسة الخصوصية</h1>
            <p className="text-muted-foreground text-sm">آخر تحديث: أبريل 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">١. المقدمة</h2>
            <p className="text-muted-foreground">
              مرحباً بك في نوفيي (Novii). نحن نولي خصوصيتك أهمية قصوى ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمعنا لمعلوماتك واستخدامها والحفاظ عليها عند استخدامك لتطبيقنا.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٢. البيانات التي نجمعها</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><span className="text-foreground font-medium">معلومات الحساب:</span> الاسم، البريد الإلكتروني، اسم المستخدم، وصورة الملف الشخصي.</li>
              <li><span className="text-foreground font-medium">المحتوى:</span> الصور والفيديوهات والتعليقات والرسائل التي تنشرها.</li>
              <li><span className="text-foreground font-medium">بيانات الاستخدام:</span> كيفية تفاعلك مع التطبيق، الصفحات التي تزورها، والميزات التي تستخدمها.</li>
              <li><span className="text-foreground font-medium">معلومات الجهاز:</span> نوع الجهاز، نظام التشغيل، وعنوان IP.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٣. كيف نستخدم بياناتك</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>توفير خدماتنا وتشغيلها وتحسينها.</li>
              <li>إرسال الإشعارات والتنبيهات المتعلقة بنشاطك.</li>
              <li>تخصيص تجربتك وتقديم محتوى مناسب لك.</li>
              <li>ضمان أمان التطبيق ومكافحة الاحتيال والإساءة.</li>
              <li>الامتثال للمتطلبات القانونية.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٤. مشاركة البيانات</h2>
            <p className="text-muted-foreground">
              لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط في الحالات التالية:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
              <li>عند حصولنا على موافقتك الصريحة.</li>
              <li>مع مزودي الخدمات الذين يساعدوننا في تشغيل التطبيق (مثل خدمات التخزين السحابي).</li>
              <li>عند الضرورة القانونية بناءً على طلب السلطات المختصة.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٥. الأمان</h2>
            <p className="text-muted-foreground">
              نستخدم تقنيات تشفير متقدمة لحماية بياناتك. يتم تخزين كلمات المرور بشكل مشفر ولا يمكن لأحد الاطلاع عليها. رغم ذلك، لا يمكن ضمان أمان مطلق لأي نظام عبر الإنترنت.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٦. حقوقك</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>الوصول إلى بياناتك الشخصية وتعديلها.</li>
              <li>حذف حسابك وجميع بياناتك.</li>
              <li>تنزيل نسخة من بياناتك.</li>
              <li>الاعتراض على معالجة بياناتك لأغراض تسويقية.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٧. ملفات تعريف الارتباط (Cookies)</h2>
            <p className="text-muted-foreground">
              نستخدم ملفات تعريف الارتباط لتحسين تجربتك، مثل تذكر تسجيل دخولك وتفضيلاتك. يمكنك التحكم في هذه الملفات من خلال إعدادات متصفحك.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٨. الأطفال</h2>
            <p className="text-muted-foreground">
              تطبيقنا غير موجه للأطفال دون سن ١٣ عاماً. إذا علمنا بأن طفلاً يستخدم حساباً، سنحذف هذا الحساب فوراً.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">٩. التغييرات على هذه السياسة</h2>
            <p className="text-muted-foreground">
              قد نحدّث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر الإشعارات داخل التطبيق أو البريد الإلكتروني.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">١٠. تواصل معنا</h2>
            <p className="text-muted-foreground">
              إذا كان لديك أي سؤال حول سياسة الخصوصية، يمكنك التواصل معنا عبر صفحة المساعدة داخل التطبيق.
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
