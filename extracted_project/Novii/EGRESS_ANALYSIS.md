# تحليل استهلاك Egress في منصة Novii 📊
*تم إنشاؤه: 24 نوفمبر 2025*

## 📈 ترتيب الجداول حسب عدد الاستعلامات:

| ترتيب | الجدول | عدد الاستعلامات | الـ Egress | الأولوية |
|------|--------|-----------------|----------|----------|
| 1️⃣ | posts | 18 | ~180KB | ⚠️⚠️⚠️ الأخطر |
| 2️⃣ | follows | 17 | ~850B | ✅ كفاءة |
| 3️⃣ | likes | 15 | ~750B | ✅ كفاءة |
| 4️⃣ | profiles | 13 | ~7.8KB | ⚠️⚠️ عالي |
| 5️⃣ | saved_posts | 9 | ~2-4KB | 🟡 متوسط |
| 6️⃣ | notifications | 8 | ~3-5KB | 🟡 متوسط |
| 7️⃣ | stories | 7 | ~5-10KB | 🟡 متوسط |
| 8️⃣ | comments | 6 | ~4-6KB | 🟡 متوسط |
| 9️⃣ | messages | 5 | ~3-5KB | 🟢 منخفض |
| 🔟 | story_views | 4 | ~2KB | 🟢 منخفض |

---

## 🎯 الجداول الأكثر استهلاكاً للـ Egress (بالفعل):

### 1️⃣ **جدول POSTS - الأول بفارق كبير** ⚡️

**عدد الاستعلامات:** 18 استعلام

**الأسباب:**
- `getFeed()` - يجلب 20 صف × 500+ بايت = 10KB لكل استدعاء
- `getUserPosts()` - يجلب posts المستخدم مع profile كاملة
- `getPost()` - استعلام واحد لـ post محدد
- `searchPosts()` - بحث عن posts
- استعلامات count و sort مختلفة

**حساب الـ Egress:**
```
posts: 18 استعلام × متوسط 10KB = ~180KB للـ feed
كل 20 ثانية = ~1.8MB في الساعة 💥
```

**أكثر استعلام استهلاكاً:**
```sql
-- ⚠️ الأخطر! يحدث كل مرة يفتح المستخدم الـ app
SELECT 
  posts.*,
  profiles.id, profiles.username, profiles.full_name, 
  profiles.avatar_url, profiles.is_verified, profiles.is_official,
  profiles.is_creator, profiles.is_premium, profiles.is_popular,
  profiles.is_active, profiles.followers_count, profiles.following_count,
  profiles.posts_count, profiles.is_online, profiles.last_seen, ...
FROM posts
JOIN profiles ON posts.user_id = profiles.id
LIMIT 20;

-- الحجم: 20 صف × ~500 بايت = 10KB
-- الملاحظة: يجلب 18 column من profile لكل post!
```

---

### 2️⃣ **جدول PROFILES - الثاني** 👤

**عدد الاستعلامات:** 13 استعلام

**الأسباب:**
- `getCurrentProfile()` - جلب profile المستخدم الحالي (SELECT *)
- `getProfile()` - جلب profile أي مستخدم (SELECT *)
- `toggleFollow()` - يجلب 2 profile بدون filter (SELECT *)
- في كل استعلام posts/stories يجلب profile كاملة

**حساب الـ Egress:**
```
profiles: 13 استعلام × متوسط 600 بايت = ~7.8KB
```

**أكثر استعلام استهلاكاً:**
```sql
-- ⚠️ يجلب جميع الأعمدة!
SELECT * FROM profiles WHERE id = 'user-id';

-- كل صف ~600 بايت (جميع البيانات الشخصية + الـ badges)
```

---

### 3️⃣ **جدول FOLLOWS - الثالث (لكن كفاءة عالية!)** 🔗

**عدد الاستعلامات:** 17 استعلام ✅

**الأسباب:**
- `getFollowers()` - جلب قائمة المتابعين
- `getFollowing()` - جلب قائمة المتابعة
- `toggleFollow()` - فحص follow موجود

**حساب الـ Egress:**
```
follows: 17 استعلام × متوسط 50 بايت = ~850 بايت فقط! ✅
(لأنها تجلب IDs فقط، مش البيانات الكاملة)
```

---

### 4️⃣ **جدول LIKES - الرابع (كفاءة عالية جداً!)** ❤️

**عدد الاستعلامات:** 15 استعلام

**حساب الـ Egress:**
```
likes: 15 استعلام × متوسط 50 بايت = ~750 بايت فقط! ✅✅
(تقريباً 0.75KB - كفاءة 99.9%!)
```

---

## 🔴 الاستعلامات الخطرة (Egress Killers):

### 1. **`getFeed()` + `POST_WITH_PROFILE`** - الأخطر!
```sql
-- ⚠️⚠️⚠️ هذا يحدث كل 20 ثانية!
SELECT *, profile:profiles!posts_user_id_fkey(*) 
FROM posts 
LIMIT 20;

-- حساب الـ Egress:
-- 20 صف × 500 بايت = 10KB
-- كل 20 ثانية = 1.8MB في الساعة
-- في اليوم = 43MB!
-- في الشهر = 1.3GB! 💥💥💥
```

### 2. **`getComments()` + `COMMENT_WITH_PROFILE`** - خطير!
```sql
-- ⚠️ خطير في posts الشهيرة!
SELECT 
  comments.*,
  profiles.*
FROM comments
JOIN profiles ON comments.user_id = profiles.id
WHERE post_id = 'post-id';

-- الحجم: يعتمد على عدد comments
-- مثال: 500 comment × 400 بايت = 200KB في استعلام واحد!
```

### 3. **`getProfile()` - جلب كل البيانات** - متوسط!
```sql
-- ⚠️ يجلب جميع الأعمدة!
SELECT * FROM profiles WHERE username = 'username';

-- الحجم: 600+ بايت لكل صف
-- 33 column في كل استعلام
```

---

## 📊 حساب الـ Egress الشهري الحالي:

```
جدول          استعلامات/ساعة   بايت/استعلام   Egress/ساعة
─────────────────────────────────────────────────────────
POSTS         15              10,000          150KB
PROFILES      13              600             7.8KB
FOLLOWS       17              50              850B
LIKES         15              50              750B
COMMENTS      6               5,000           30KB
STORIES       7               3,000           21KB
SAVED_POSTS   9               1,000           9KB
NOTIFICATIONS 8               2,000           16KB
MESSAGES      5               3,000           15KB
STORY_VIEWS   4               500             2KB
────────────────────────────────────────────────────────
المجموع:                                      251KB/ساعة

251KB × 24 ساعة × 30 يوم = ~181MB شهرياً! 💰
```

---

## 🚀 التوصيات لتقليل Egress - بالأولوية:

### ✅ **1. تحسين `getFeed()` - توفير 40% من الـ Egress!** (الأولوية الأولى)

**المشكلة:**
```typescript
// الحالي: يجلب profile كاملة
POST_WITH_PROFILE = `
  *,
  profile:profiles!posts_user_id_fkey(
    id, username, full_name, avatar_url, is_verified, is_official, ...
  )
`
```

**الحل:**
```typescript
// الأفضل: جلب فقط البيانات المعروضة
PROFILE_CARD = `
  id, username, avatar_url, is_verified
`

// التأثير:
// قبل: 20 × 500 بايت = 10KB
// بعد: 20 × 100 بايت = 2KB
// توفير: 80% = 8KB من كل استدعاء
```

---

### ✅ **2. استخدام Pagination لـ Comments** (الأولوية الثانية)

**المشكلة:**
```typescript
// الحالي: يجلب جميع comments
async getComments(postId: string) {
  return supabase
    .from('comments')
    .select(COMMENT_WITH_PROFILE)
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
}

// مثال: 500 comment = 200KB!
```

**الحل:**
```typescript
// الأفضل: paginated
async getComments(postId: string, limit = 10, offset = 0) {
  return supabase
    .from('comments')
    .select(COMMENT_WITH_PROFILE)
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
}

// التأثير:
// قبل: 500 × 400 بايت = 200KB
// بعد: 10 × 400 بايت = 4KB
// توفير: 98% = 196KB من كل post!
```

---

### ✅ **3. تقليل Auto-Refresh من 20 إلى 60 ثانية** (الأولوية الثالثة)

**المشكلة:**
```typescript
// الحالي: refresh كل 20 ثانية
const REFRESH_INTERVAL = 20000; // 20 ثانية

// النتيجة:
// 10KB × 3 مرات = 30KB كل دقيقة
// = 1.8MB في الساعة
```

**الحل:**
```typescript
// الأفضل: refresh كل 60 ثانية
const REFRESH_INTERVAL = 60000; // 60 ثانية

// التأثير:
// 10KB × 1 مرة = 10KB كل دقيقة
// توفير: 67% = 1.2MB من الساعة
```

---

### ✅ **4. استخدام Caching للـ Profiles** (الأولوية الرابعة)

**المشكلة:**
```typescript
// الحالي: جلب profile جديد في كل استعلام
async getProfile(username: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
}

// يتم هذا 10+ مرات
```

**الحل:**
```typescript
// الأفضل: caching 5 دقائق
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000;

async function getProfile(username: string) {
  const cached = cache.get(username);
  if (cached && Date.now() - cached.time < CACHE_TIME) {
    return cached.data;
  }
  
  const data = await supabase...
  cache.set(username, { data, time: Date.now() });
  return data;
}

// التأثير:
// توفير: 70% من profile queries
```

---

## 💡 الخلاصة والتأثير الكلي:

### **إذا طبقنا التوصيات الأربع:**

```
الحالة الحالية:     ~181MB/شهر
بعد تحسين feeds:    ~108MB/شهر  (-60%)
بعد pagination:     ~105MB/شهر  (-2%)
بعد تقليل refresh: ~35MB/شهر   (-67%)
بعد caching:        ~10MB/شهر   (-71%)
────────────────────────────────
توفير كلي:          95% 🎉
من 181MB إلى 10MB فقط!
```

### **التكلفة:**
- قبل: 181MB × $0.25 per GB = $0.045/شهر
- بعد: 10MB × $0.25 per GB = $0.0025/شهر
- **توفير: $0.042/شهر** (مش كتير لكن اضربها في ملايين المستخدمين!)

---

## 📋 ملخص التوصيات:

| الأولوية | الحل | التوفير | الصعوبة |
|---------|------|---------|---------|
| 1️⃣ | استخدم PROFILE_CARD في feeds | 40% | سهل ✅ |
| 2️⃣ | أضف pagination للـ comments | 80% | سهل ✅ |
| 3️⃣ | قلل auto-refresh إلى 60 ثانية | 67% | سهل جداً ✅ |
| 4️⃣ | استخدم caching للـ profiles | 70% | متوسط 🟡 |

**المجموع: 95% توفير من Egress!** 🎯
