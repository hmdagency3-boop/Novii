# قاعدة بيانات Novii

هذا المجلد يحتوي على ملف SQL شامل لإعادة بناء قاعدة بيانات Supabase لمنصة Novii.

## الملف الرئيسي

**`NOVII_COMPLETE_DATABASE.sql`** — ملف واحد شامل يحتوي على:
- 25 جدولاً كاملاً مع جميع الأعمدة والقيود
- سياسات Row Level Security (RLS) لجميع الجداول
- Triggers ودوال تلقائية لتحديث العدادات
- Storage Buckets (avatars, posts, reels, stories, covers, messages, community-media)
- فهارس الأداء (Indexes)
- بيانات أساسية للشارات العشر (Seed Data)

## كيفية التطبيق

### من خلال Supabase Dashboard

1. افتح مشروع Supabase
2. اذهب إلى **SQL Editor**
3. اضغط **New Query**
4. انسخ محتوى `NOVII_COMPLETE_DATABASE.sql` بالكامل والصقه
5. اضغط **Run** أو `Ctrl+Enter`

### باستخدام Supabase CLI

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db execute --file database/NOVII_COMPLETE_DATABASE.sql
```

## الجداول (25 جدول)

| الجدول | الوصف |
|--------|-------|
| `profiles` | الملفات الشخصية للمستخدمين |
| `posts` | المنشورات |
| `follows` | علاقات المتابعة |
| `follow_requests` | طلبات المتابعة للحسابات الخاصة |
| `stories` | القصص |
| `story_views` | مشاهدات القصص |
| `comments` | التعليقات مع دعم الردود المتداخلة |
| `likes` | الإعجابات (منشورات، تعليقات، ريلز) |
| `reels` | الفيديوهات القصيرة |
| `saved_posts` | المنشورات المحفوظة |
| `post_views` | مشاهدات المنشورات |
| `post_insights` | إحصائيات المنشورات |
| `messages` | الرسائل الخاصة مع soft delete |
| `message_reactions` | ردود الفعل على الرسائل |
| `notifications` | الإشعارات |
| `user_statistics` | إحصائيات المستخدم |
| `badges` | تعريف الشارات العشر |
| `user_badges` | شارات المستخدمين |
| `communities` | المجتمعات مع كود الدعوة |
| `community_members` | أعضاء المجتمعات |
| `community_messages` | رسائل المجتمعات |
| `moderation_logs` | سجلات الإشراف |
| `typing_indicators` | مؤشرات الكتابة الفورية |
| `user_devices` | تتبع أجهزة المستخدمين |
| `admins` | المشرفون |

## ملاحظات

- الملف يستخدم `IF NOT EXISTS` لتجنب الأخطاء عند التطبيق على قاعدة موجودة
- يُفضل التطبيق على قاعدة بيانات جديدة/فارغة للحصول على أفضل النتائج
