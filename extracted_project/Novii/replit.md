# Novii - منصة التواصل الاجتماعي

## نظرة عامة
Novii منصة تواصل اجتماعي مستوحاة من Instagram، تدعم اللغتين العربية والإنجليزية مع تبديل RTL/LTR تلقائي. مبنية بـ React، TypeScript، Express، وSupabase PostgreSQL.

## تفضيلات المستخدم
- تفضيل اللغة محفوظ في localStorage
- تفضيل الثيم محفوظ في localStorage عبر next-themes
- تبديل تلقائي لتخطيط RTL للمستخدمين العرب

## قاعدة مهمة للداتابيز
عند أي تعديل يستلزم تغييرات في قاعدة البيانات:
1. أنشئ كود SQL فوراً
2. احفظه في مجلد `database/` باسم واضح
3. قدم الكود بدون تأخير

## هيكل المشروع

### التقنيات المستخدمة
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Express.js + TypeScript + Supabase JS Client
- **Database:** Supabase PostgreSQL
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI
- **Routing:** Wouter
- **State Management:** TanStack Query
- **Authentication:** Supabase Auth (email/password, Google OAuth)
- **ORM:** Drizzle ORM

### المميزات الرئيسية
- **المحتوى الاجتماعي:** Feed، القصص، Reels، صفحة الاستكشاف
- **الرسائل:** رسائل خاصة مع soft delete وردود فعل
- **المجتمعات:** مجموعات مع invite codes وإشراف متكامل
- **الإشعارات:** نظام إشعارات فوري
- **نظام الشارات:** 10 شارات (ذهبي، فضي، برونزي، Beta، إلخ)
- **لوحة الأدمن:** إدارة المستخدمين والإحصائيات
- **التوثيق والرسمية:** شارات Verified وOfficial
- **Bug Hunter Community:** تأثير بصري متحرك خاص

### بنية الملفات
```
client/src/
  pages/          - صفحات التطبيق
  components/     - المكونات المشتركة
  components/ui/  - مكونات Radix UI
  lib/            - الأدوات والسياق والـ API
  hooks/          - Custom React hooks

server/
  index.ts        - نقطة دخول Express
  routes.ts       - جميع مسارات API
  storage.ts      - طبقة التخزين
  vite.ts         - إعداد Vite للتطوير
  utils/          - أدوات مساعدة

shared/
  schema.ts       - مخطط قاعدة البيانات (Drizzle ORM)

database/
  NOVII_COMPLETE_DATABASE.sql  - السكريبت الشامل لإعادة بناء DB
  README.md                    - توثيق قاعدة البيانات
```

### مسارات API
جميع المسارات تبدأ بـ `/api` وتشمل:
- `/api/auth/*` - المصادقة
- `/api/profiles/*` - الملفات الشخصية
- `/api/posts/*` - المنشورات
- `/api/stories/*` - القصص
- `/api/reels/*` - الريلز
- `/api/comments/*` - التعليقات
- `/api/messages/*` - الرسائل
- `/api/communities/*` - المجتمعات
- `/api/notifications/*` - الإشعارات
- `/api/admin/*` - لوحة الأدمن
- `/api/devices/*` - تتبع الأجهزة

### الاعتماديات الخارجية
- **Supabase:** قاعدة البيانات، المصادقة، الـ realtime
- **Vite:** build tool وdev server
- **Tailwind CSS:** CSS framework
- **Radix UI:** مكونات UI بدون style
- **Wouter:** React router خفيف
- **TanStack Query:** إدارة البيانات
- **Drizzle ORM:** TypeScript ORM
