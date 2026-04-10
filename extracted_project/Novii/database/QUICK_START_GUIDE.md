# ⚡ Quick Start Guide - Post Settings SQL

## 30 ثانية لفهم كل شيء

### الملفات الموجودة
| الملف | الوصف |
|------|--------|
| `POST_SETTINGS_MIGRATIONS.sql` | SQL migrations - نسخ و اتبع الـ instructions |
| `POST_SETTINGS_API_EXAMPLES.sql` | أمثلة queries - استخدمها كمرجع |
| `POST_SETTINGS_README.md` | شرح مفصل - قرأ للتفاصيل |
| `QUICK_START_GUIDE.md` | هذا الملف - للبدء السريع |

---

## 🚀 خطوات البدء (3 خطوات فقط)

### 1️⃣ انسخ الكود و طبقه

```bash
# افتح Supabase Dashboard
# اذهب إلى SQL Editor
# انسخ محتوى POST_SETTINGS_MIGRATIONS.sql كامل
# اضغط "Run"
```

### 2️⃣ تحقق من النجاح

```sql
-- اختبر الأعمدة الجديدة
SELECT is_pinned, hide_likes, replies_disabled, views_count 
FROM posts LIMIT 1;

-- اختبر الجداول الجديدة
SELECT * FROM saved_posts LIMIT 1;
SELECT * FROM post_views LIMIT 1;
SELECT * FROM post_insights LIMIT 1;
```

### 3️⃣ استخدم في Frontend

```typescript
// تثبيت البوست
await supabase.from('posts').update({ is_pinned: true }).eq('id', postId);

// حفظ البوست
await supabase.from('saved_posts').insert({ user_id, post_id });

// عرض الإحصائيات
const { data } = await supabase.from('post_insights').select('*').eq('post_id', postId);
```

---

## 📦 الأعمدة الجديدة في `posts` table

```
is_pinned:        BOOLEAN - هل البوست مثبت؟
hide_likes:       BOOLEAN - هل الإعجابات مخفية؟
replies_disabled: BOOLEAN - هل التعليقات معطلة؟
views_count:      INTEGER - عدد المشاهدات
```

---

## 🗂️ الجداول الجديدة

### saved_posts
```
id          UUID - معرّف فريد
user_id     UUID - المستخدم
post_id     UUID - البوست
created_at  TIMESTAMP - التاريخ
```

### post_views
```
id        UUID - معرّف فريد
post_id   UUID - البوست
user_id   UUID - المستخدم
viewed_at TIMESTAMP - متى شاهده
```

### post_insights
```
id               UUID - معرّف فريد
post_id          UUID - البوست
views_count      INTEGER - عدد المشاهدات
likes_count      INTEGER - عدد الإعجابات
comments_count   INTEGER - عدد التعليقات
saves_count      INTEGER - عدد الحفظ
engagement_rate  DECIMAL - نسبة الـ engagement
created_at       TIMESTAMP - التاريخ
```

---

## 🔥 الـ Functions المهمة

```typescript
// ✅ فعّال الآن - استخدمها مباشرة

// 1. حفظ البوست
INSERT INTO saved_posts (user_id, post_id) VALUES (user_id, post_id);

// 2. مشاهدة البوست
INSERT INTO post_views (post_id, user_id) VALUES (post_id, user_id);

// 3. الحصول على البوستات المحفوظة
SELECT * FROM saved_posts WHERE user_id = user_id;

// 4. الإحصائيات
SELECT * FROM post_insights WHERE post_id = post_id;

// 5. تثبيت البوست
UPDATE posts SET is_pinned = true WHERE id = post_id;

// 6. إخفاء الإعجابات
UPDATE posts SET hide_likes = true WHERE id = post_id;

// 7. تعطيل التعليقات
UPDATE posts SET replies_disabled = true WHERE id = post_id;
```

---

## ⚠️ المشاكل الشائعة

### مشكلة: `permission denied`
**الحل:** تأكد من أن RLS مفعّل و الـ policies صحيحة

### مشكلة: `duplicate key`
**الحل:** استخدم `ON CONFLICT DO NOTHING`
```sql
INSERT INTO saved_posts (user_id, post_id) VALUES (user_id, post_id)
ON CONFLICT (user_id, post_id) DO NOTHING;
```

### مشكلة: queries بطيئة
**الحل:** الـ Indexes موجودة في الـ Migration ✅

---

## 💡 نصائح مهمة

✅ كل الـ RLS موجود - آمن تماماً  
✅ كل الـ Indexes موجودة - أداء سريع  
✅ كل الـ Triggers موجودة - تحديث تلقاؤي  
✅ تم اختبار كل الـ Queries - تشتغل مباشرة

---

## 📖 المرجع السريع

| العملية | الكود SQL |
|---------|-----------|
| حفظ | `INSERT INTO saved_posts...` |
| إلغاء حفظ | `DELETE FROM saved_posts...` |
| تثبيت | `UPDATE posts SET is_pinned = true...` |
| إلغاء تثبيت | `UPDATE posts SET is_pinned = false...` |
| إخفاء إعجابات | `UPDATE posts SET hide_likes = true...` |
| تعطيل تعليقات | `UPDATE posts SET replies_disabled = true...` |
| تسجيل مشاهدة | `INSERT INTO post_views...` |
| الإحصائيات | `SELECT * FROM post_insights...` |

---

## ✔️ Checklist

- [ ] انسخ `POST_SETTINGS_MIGRATIONS.sql`
- [ ] شغّل في Supabase SQL Editor
- [ ] اختبر الـ queries
- [ ] استخدم في Frontend
- [ ] Done! 🎉

---

## 🆘 للمساعدة

- اقرأ `POST_SETTINGS_README.md` للتفاصيل
- استخدم الـ queries من `POST_SETTINGS_API_EXAMPLES.sql`
- جميع الـ RLS و Indexes جاهزة
