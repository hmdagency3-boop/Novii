# 📱 Post Settings & Features - SQL Documentation

## نظرة عامة

هذا المجلد يحتوي على جميع الـ SQL migrations و queries اللازمة لإضافة الميزات الجديدة لـ Post Card:

1. **📌 Pin to Profile** - تثبيت البوستات في الملف الشخصي
2. **👁️ Hide Likes** - إخفاء عداد الإعجابات
3. **💬 Reply Settings** - تعطيل التعليقات
4. **💾 Save/Bookmark** - حفظ البوستات
5. **📊 Post Insights** - إحصائيات و تحليلات البوستات
6. **👀 Post Views** - تتبع مشاهدات البوستات

---

## 📋 الملفات المضمنة

### 1. `POST_SETTINGS_MIGRATIONS.sql`
جميع الـ migrations اللازمة لإضافة الأعمدة والجداول الجديدة:

**Columns المضافة للـ `posts` table:**
```sql
is_pinned BOOLEAN DEFAULT FALSE        -- هل البوست مثبت؟
hide_likes BOOLEAN DEFAULT FALSE       -- هل الإعجابات مخفية؟
replies_disabled BOOLEAN DEFAULT FALSE -- هل التعليقات معطلة؟
views_count INTEGER DEFAULT 0          -- عدد المشاهدات
```

**الجداول الجديدة:**
- `saved_posts` - البوستات المحفوظة
- `post_views` - مشاهدات البوستات
- `post_insights` - إحصائيات البوستات

### 2. `POST_SETTINGS_API_EXAMPLES.sql`
أمثلة عملية على الـ queries للعمليات الأساسية:

---

## 🚀 كيفية التطبيق

### الخطوة 1: تطبيق الـ Migrations
```bash
# انسخ محتوى POST_SETTINGS_MIGRATIONS.sql
# ثم اتبع أحد الخيارات التالية:

# الخيار 1: عبر Supabase Dashboard
# 1. اذهب إلى Supabase Dashboard
# 2. انقر على "SQL Editor"
# 3. اضغط "New Query"
# 4. انسخ محتوى Migration file
# 5. اضغط "Run"

# الخيار 2: عبر Supabase CLI
supabase db push

# الخيار 3: عبر pgAdmin أو أي SQL client
psql -U username -d database_name -f POST_SETTINGS_MIGRATIONS.sql
```

### الخطوة 2: التحقق من التطبيق
```sql
-- التحقق من أن الأعمدة الجديدة موجودة في posts table
\d posts

-- التحقق من أن الجداول الجديدة موجودة
\d saved_posts
\d post_views
\d post_insights

-- التحقق من الـ functions
SELECT * FROM pg_proc WHERE proname LIKE '%post%';
```

---

## 📝 شرح الميزات

### 1. Pin to Profile (تثبيت البوست)

**الكود:**
```typescript
// Frontend - React Hook
const [isPinned, setIsPinned] = useState(false);

const handlePin = async () => {
  await supabase
    .from('posts')
    .update({ is_pinned: !isPinned })
    .eq('id', postId)
    .eq('user_id', userId);
  setIsPinned(!isPinned);
};
```

**SQL Query:**
```sql
-- تثبيت البوست
UPDATE posts SET is_pinned = TRUE WHERE id = 'post-uuid' AND user_id = 'user-uuid';

-- الحصول على البوستات المثبتة
SELECT * FROM posts WHERE user_id = 'user-uuid' AND is_pinned = TRUE ORDER BY created_at DESC;
```

---

### 2. Hide Likes (إخفاء الإعجابات)

**الكود:**
```typescript
// Frontend - React Hook
const [hideLikes, setHideLikes] = useState(false);

const handleHideLikes = async () => {
  await supabase
    .from('posts')
    .update({ hide_likes: !hideLikes })
    .eq('id', postId)
    .eq('user_id', userId);
  setHideLikes(!hideLikes);
};
```

**SQL Query:**
```sql
-- إخفاء الإعجابات
UPDATE posts SET hide_likes = TRUE WHERE id = 'post-uuid';

-- عند عرض البوست - إذا كانت hide_likes = TRUE، اعرض 0
SELECT CASE WHEN hide_likes THEN 0 ELSE likes_count END as likes_count FROM posts WHERE id = 'post-uuid';
```

---

### 3. Reply Settings (تعطيل التعليقات)

**الكود:**
```typescript
// Frontend - React Hook
const [repliesDisabled, setRepliesDisabled] = useState(false);

const handleReplySettings = async () => {
  await supabase
    .from('posts')
    .update({ replies_disabled: !repliesDisabled })
    .eq('id', postId)
    .eq('user_id', userId);
  setRepliesDisabled(!repliesDisabled);
};
```

**SQL Query:**
```sql
-- تعطيل التعليقات
UPDATE posts SET replies_disabled = TRUE WHERE id = 'post-uuid';

-- التحقق قبل إضافة تعليق
SELECT replies_disabled FROM posts WHERE id = 'post-uuid';
```

---

### 4. Save Post (حفظ البوست)

**الكود:**
```typescript
// Frontend - React Hook
const handleSave = async () => {
  if (isSaved) {
    // حذف
    await supabase
      .from('saved_posts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
  } else {
    // إضافة
    await supabase
      .from('saved_posts')
      .insert({ post_id: postId, user_id: userId });
  }
  setIsSaved(!isSaved);
};
```

**SQL Queries:**
```sql
-- حفظ البوست
INSERT INTO saved_posts (user_id, post_id) VALUES ('user-uuid', 'post-uuid');

-- إلغاء حفظ
DELETE FROM saved_posts WHERE user_id = 'user-uuid' AND post_id = 'post-uuid';

-- الحصول على البوستات المحفوظة
SELECT p.* FROM saved_posts sp
JOIN posts p ON sp.post_id = p.id
WHERE sp.user_id = 'user-uuid'
ORDER BY sp.created_at DESC;

-- التحقق من حفظ البوست
SELECT EXISTS(SELECT 1 FROM saved_posts WHERE user_id = 'user-uuid' AND post_id = 'post-uuid');
```

---

### 5. Post Views (مشاهدات البوست)

**الكود:**
```typescript
// Frontend - عند فتح البوست modal أو عرضه
const handleViewPost = async () => {
  await supabase
    .from('post_views')
    .insert({ 
      post_id: postId, 
      user_id: userId 
    })
    .select();
};
```

**SQL Queries:**
```sql
-- تسجيل مشاهدة
INSERT INTO post_views (post_id, user_id) VALUES ('post-uuid', 'user-uuid')
ON CONFLICT (post_id, user_id) DO NOTHING;

-- الحصول على عدد المشاهدات
SELECT views_count FROM posts WHERE id = 'post-uuid';

-- قائمة الأشخاص الذين شاهدوا
SELECT pr.* FROM post_views pv
JOIN profiles pr ON pv.user_id = pr.id
WHERE pv.post_id = 'post-uuid'
ORDER BY pv.viewed_at DESC;
```

---

### 6. Post Insights (الإحصائيات)

**الكود:**
```typescript
// Frontend - داشبورد الإحصائيات
const getPostInsights = async () => {
  const { data } = await supabase
    .from('post_insights')
    .select('*')
    .eq('post_id', postId)
    .single();
  return data;
};
```

**SQL Queries:**
```sql
-- الحصول على الإحصائيات
SELECT views_count, likes_count, comments_count, saves_count, engagement_rate
FROM post_insights WHERE post_id = 'post-uuid';

-- أفضل البوستات
SELECT p.*, pi.views_count, pi.engagement_rate
FROM post_insights pi
JOIN posts p ON pi.post_id = p.id
WHERE p.user_id = 'user-uuid'
ORDER BY pi.engagement_rate DESC LIMIT 10;
```

---

## 🔐 Row Level Security (RLS)

جميع الجداول محمية بـ RLS:

```sql
-- مثال: لا يمكن حفظ بوستات إلا للمستخدم الموثق
CREATE POLICY "Users can save posts"
ON saved_posts
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- لا يمكن حذف الحفظ إلا من مالكه
CREATE POLICY "Users can delete their saved posts"
ON saved_posts
FOR DELETE
USING (user_id = auth.uid());
```

---

## 📊 الأداء و الـ Indexes

تم إنشاء Indexes للأداء الأفضل:

```sql
-- البحث السريع عن البوستات المحفوظة
CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id);

-- البحث السريع عن المشاهدات
CREATE INDEX idx_post_views_post_id ON post_views(post_id);

-- البحث عن البوستات المثبتة
CREATE INDEX idx_posts_pinned ON posts(user_id, is_pinned) WHERE is_pinned = TRUE;
```

---

## 🔄 الـ Triggers (تحديث تلقائي)

عند إدراج مشاهدة جديدة، يتم تحديث عداد المشاهدات تلقائياً:

```sql
-- Trigger: تحديث عداد المشاهدات
CREATE TRIGGER trigger_update_post_views
AFTER INSERT ON post_views
FOR EACH ROW
EXECUTE FUNCTION update_post_views_count();

-- Trigger: تحديث عداد الحفظ
CREATE TRIGGER trigger_update_saves_count
AFTER INSERT OR DELETE ON saved_posts
FOR EACH ROW
EXECUTE FUNCTION update_post_saves_count();
```

---

## 📡 API Endpoints المطلوبة (Express Backend)

```typescript
// GET - الحصول على بيانات البوست مع الإحصائيات
GET /api/posts/:id

// PUT - تحديث إعدادات البوست
PUT /api/posts/:id/settings
Body: { is_pinned, hide_likes, replies_disabled }

// POST - حفظ البوست
POST /api/posts/:id/save

// DELETE - إلغاء حفظ
DELETE /api/posts/:id/save

// POST - تسجيل مشاهدة
POST /api/posts/:id/view

// GET - الإحصائيات
GET /api/posts/:id/insights

// GET - البوستات المحفوظة
GET /api/posts/saved

// GET - البوستات المثبتة
GET /api/user/:userId/pinned-posts
```

---

## ✅ Checklist التطبيق

- [ ] تطبيق الـ Migration
- [ ] التحقق من الـ Indexes
- [ ] تفعيل RLS
- [ ] كتابة API Endpoints
- [ ] اختبار Save/Unsave
- [ ] اختبار Pin/Unpin
- [ ] اختبار Hide Likes
- [ ] اختبار Reply Settings
- [ ] اختبار Post Views
- [ ] اختبار Post Insights

---

## 🐛 استكشاف الأخطاء

### مشكلة: لا تعمل الحفظ
```sql
-- تحقق من وجود الـ policy
SELECT * FROM pg_policies WHERE tablename = 'saved_posts';

-- تحقق من RLS مفعل
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'saved_posts';
```

### مشكلة: المشاهدات لا تتحدث
```sql
-- تحقق من الـ Trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_post_views';

-- تحقق من الـ Function
SELECT * FROM pg_proc WHERE proname = 'update_post_views_count';
```

### مشكلة: Performance بطيء
```sql
-- تحقق من الـ Indexes
SELECT * FROM pg_indexes WHERE tablename IN ('saved_posts', 'post_views', 'posts');

-- أضف Indexes إذا كانت ناقصة
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
```

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. تحقق من أن جميع الـ Migrations تم تطبيقها
2. تحقق من RLS مفعل
3. تحقق من الـ Indexes موجودة
4. جرب الـ SQL Queries مباشرة في Supabase SQL Editor
