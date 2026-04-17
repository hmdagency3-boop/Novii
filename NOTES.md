# Novii — ملاحظات المشروع والتعديلات

## 1. هيكل المشروع

المشروع عبارة عن monorepo بيستخدم pnpm، وفيه أربع أجزاء رئيسية:

```
/
├── novii/                          → المنصة الأساسية (فرونت إند + سيرفر Express)
│   ├── client/                     → React frontend
│   └── server/                     → Express backend (API)
│
├── artifacts/
│   ├── novii-admin/                → لوحة الأدمن (React app منفصل)
│   ├── api-server/                 → سيرفر إضافي (مش مستخدم حالياً)
│   └── mockup-sandbox/             → بيئة معاينة المكونات
│
└── lib/                            → مكتبات مشتركة
    ├── api-client-react/
    └── api-spec/
```

### الـ Workflows اللي شغّالة على Replit
- **Novii Platform** → port 5000 — المنصة الأساسية (frontend + backend)
- **API Server** → port 8080
- **Novii Admin** → port 18877 — لوحة الأدمن

---

## 2. الـ Production Deployments

| الجزء | المكان | الـ URL |
|---|---|---|
| Novii Frontend | Netlify | `https://novii.netlify.app` |
| Novii Admin | Netlify | (subdomain منفصل على Netlify) |
| Novii Backend (Express) | **مش متنشر** ⚠️ | محتاج حل |

### المشكلة الحالية
الفرونت إند على Netlify بس (static site) — مفيش backend شغّال في الـ production. ده معناه:
- البحث في Communities مش شغّال في production
- الـ Feed الذكي مش شغّال
- لوحة الأدمن مش بتقدر تسجل دخول لأنها محتاجة الـ API

---

## 3. التعديلات اللي اتعملت

### 3.1 تنظيف الـ UI
- ✅ شيلت أيقونات Sparkles (شكل AI) من sidebar الاقتراحات
- ✅ شيلت تبويب "mentions" من صفحة الإعدادات
- **الملفات:** `novii/client/src/components/suggestions-sidebar.tsx`, `novii/client/src/pages/settings.tsx`

### 3.2 فلترة الاقتراحات
- ✅ المتابعين الحاليين مش بيظهروا في قائمة الاقتراحات (فلتر على الـ client والسيرفر)
- **الملفات:** `novii/server/routes.ts` (السطر ~917), `novii/client/src/components/suggestions-sidebar.tsx`

### 3.3 PWA Install Banner
- ✅ بانر تثبيت التطبيق مع تعليمات حسب نوع الجهاز (iOS/Android/Desktop)
- **الملفات الجديدة:** `novii/client/src/components/install-app-banner.tsx`
- **مدمج في:** `novii/client/src/pages/home.tsx`, `novii/client/src/pages/auth.tsx`

### 3.4 إعداد لوحة الأدمن للنشر على Netlify
- ✅ ملف `artifacts/novii-admin/netlify.toml` للـ deployment
- ✅ تعديل `artifacts/novii-admin/vite.config.ts`:
  - إضافات Replit بتشتغل في dev فقط (مش بتفسد الـ production build)
  - دعم لمتغيرات بصيغتين: `VITE_SUPABASE_*` و `SUPABASE_*`

### 3.5 إعداد CORS على السيرفر
- ✅ أضفت CORS middleware في `novii/server/index.ts`
- بيسمح بالطلبات من أي domain ينتهي بـ `.netlify.app` أو `.netlify.live` أو localhost
- ✅ ثبّت package `cors` و `@types/cors`

### 3.6 ملف render.yaml (لـ Render — مش هنستخدمه دلوقتي)
- موجود في root المشروع، ممكن نستخدمه لاحقاً لو غيرنا رأينا

---

## 4. المتغيرات (Environment Variables)

### للسيرفر (Backend)
```
NODE_ENV
PORT
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### للفرونت إند الرئيسي على Netlify (`novii.netlify.app`)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL                 (للـ build)
SUPABASE_ANON_KEY            (للـ build)
SUPABASE_SERVICE_ROLE_KEY    (للـ build)
CLOUDINARY_*                 (للـ build)
```

### للوحة الأدمن على Netlify
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_NOVII_API_URL          → URL الـ backend (لازم يتحدد بعد ما ننشره)
```

---

## 5. الخطة الجاية: Netlify Functions

### الفكرة
بدل ما ننشر السيرفر على خدمة منفصلة، نحول الـ Express server لـ Netlify Function.
كده الـ frontend والـ backend يبقوا على نفس Netlify site.

### الخطوات اللي هنعملها
1. **تثبيت `serverless-http`** — مكتبة بتلف الـ Express app كـ Lambda function
2. **إنشاء `novii/netlify/functions/api.ts`** — wrapper بيستدعي الـ Express server
3. **إضافة `novii/netlify.toml`**:
   - بناء الفرونت بـ vite
   - بناء الـ function
   - redirect لكل `/api/*` يروح للـ function
4. **تحديث `VITE_NOVII_API_URL` في الأدمن** = `https://novii.netlify.app`
5. **رفع التعديلات على GitHub** → Netlify بيعمل deploy تلقائي

### ⚠️ القيود
- Netlify Functions الـ free tier = 10 ثواني timeout لكل طلب
- 125,000 طلب شهرياً مجاناً
- لو حاجة بطيئة (زي معالجة فيديو طويل) ممكن متشتغلش — لكن العمليات العادية للأدمن هتشتغل تمام

---

## 6. الـ Rollback (لو حصل خطأ)

كل تعديل اتعمل بيتم تخزينه كـ checkpoint في Replit. للرجوع:
1. افتح **History** من السايدبار
2. اختار checkpoint قبل التعديل اللي عايز تشيله
3. اضغط **Restore**

أهم checkpoints:
- قبل CORS: `74654ac` (إضافة render.yaml)
- قبل CORS: `71ec1e9` (CORS middleware)
- قبل تعديلات vite.config: `eea9f6a`

---

## 7. تطبيق Android (Novii Mobile)

اتضاف artifact جديد منفصل تماماً في `artifacts/novii-mobile/` (Expo + React Native)، بيستخدم نفس Supabase backend.

### المحتوى الحالي
- **Auth**: شاشة دخول/تسجيل بـ Supabase email+password (جلسة محفوظة في AsyncStorage)
- **Tabs**: Home / Search / Profile
- **Home**: feed منشورات حقيقية من جدول `posts` مع likes
- **Search**: بحث في `profiles` بالـ username أو الاسم
- **Profile**: بروفايل المستخدم الحالي + جريد المنشورات + زر تسجيل خروج

### Env vars (Shared)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### النشر
- iOS: عبر زر **Publish** (Expo Launch) في Replit
- Android: Replit مش بتدعم نشر Android مباشرة. لو عايز APK/Play Store هتحتاج EAS build خارج Replit أو نخلي التطبيق ك PWA.
