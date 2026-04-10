-- ========================================
-- POST SETTINGS - API EXAMPLES & QUERIES
-- ========================================

-- ========================================
-- 1. PIN / UNPIN POST (تثبيت/إلغاء تثبيت)
-- ========================================

-- تثبيت البوست
UPDATE posts 
SET is_pinned = TRUE 
WHERE id = 'post-uuid' AND user_id = 'user-uuid';

-- إلغاء تثبيت البوست
UPDATE posts 
SET is_pinned = FALSE 
WHERE id = 'post-uuid' AND user_id = 'user-uuid';

-- الحصول على البوستات المثبتة للمستخدم
SELECT id, caption, image_url, created_at, views_count
FROM posts 
WHERE user_id = 'user-uuid' AND is_pinned = TRUE
ORDER BY created_at DESC;

-- ========================================
-- 2. HIDE / SHOW LIKES (إخفاء/إظهار الإعجابات)
-- ========================================

-- إخفاء عداد الإعجابات
UPDATE posts 
SET hide_likes = TRUE 
WHERE id = 'post-uuid' AND user_id = 'user-uuid';

-- إظهار عداد الإعجابات
UPDATE posts 
SET hide_likes = FALSE 
WHERE id = 'post-uuid' AND user_id = 'user-uuid';

-- الحصول على البوستات بدون إخفاء الإعجابات
SELECT id, caption, likes_count 
FROM posts 
WHERE user_id = 'user-uuid' AND hide_likes = FALSE;

-- ========================================
-- 3. REPLY SETTINGS (خيارات الرد)
-- ========================================

-- تعطيل التعليقات على البوست
UPDATE posts 
SET replies_disabled = TRUE 
WHERE id = 'post-uuid' AND user_id = 'user-uuid';

-- تفعيل التعليقات على البوست
UPDATE posts 
SET replies_disabled = FALSE 
WHERE id = 'post-uuid' AND user_id = 'user-uuid';

-- التحقق من إمكانية التعليق على البوست
SELECT replies_disabled 
FROM posts 
WHERE id = 'post-uuid';

-- ========================================
-- 4. SAVE / UNSAVE POST (حفظ/إلغاء حفظ)
-- ========================================

-- حفظ البوست
INSERT INTO saved_posts (user_id, post_id)
VALUES ('user-uuid', 'post-uuid')
ON CONFLICT (user_id, post_id) DO NOTHING;

-- إلغاء حفظ البوست
DELETE FROM saved_posts
WHERE user_id = 'user-uuid' AND post_id = 'post-uuid';

-- الحصول على البوستات المحفوظة للمستخدم
SELECT 
  p.id,
  p.caption,
  p.image_url,
  p.likes_count,
  p.comments_count,
  pr.username,
  pr.avatar_url,
  sp.created_at as saved_at
FROM saved_posts sp
JOIN posts p ON sp.post_id = p.id
JOIN profiles pr ON p.user_id = pr.id
WHERE sp.user_id = 'user-uuid'
ORDER BY sp.created_at DESC;

-- التحقق من حفظ المستخدم للبوست
SELECT EXISTS(
  SELECT 1 FROM saved_posts
  WHERE user_id = 'user-uuid' AND post_id = 'post-uuid'
) as is_saved;

-- عدد البوستات المحفوظة للمستخدم
SELECT COUNT(*) as saved_count
FROM saved_posts
WHERE user_id = 'user-uuid';

-- ========================================
-- 5. POST VIEWS (مشاهدات البوست)
-- ========================================

-- تسجيل مشاهدة جديدة للبوست
INSERT INTO post_views (post_id, user_id)
VALUES ('post-uuid', 'user-uuid')
ON CONFLICT (post_id, user_id) DO NOTHING;

-- الحصول على عدد مشاهدات البوست
SELECT views_count
FROM posts
WHERE id = 'post-uuid';

-- الحصول على قائمة الأشخاص الذين شاهدوا البوست
SELECT 
  pr.id,
  pr.username,
  pr.avatar_url,
  pv.viewed_at
FROM post_views pv
JOIN profiles pr ON pv.user_id = pr.id
WHERE pv.post_id = 'post-uuid'
ORDER BY pv.viewed_at DESC;

-- التحقق من مشاهدة المستخدم للبوست
SELECT EXISTS(
  SELECT 1 FROM post_views
  WHERE post_id = 'post-uuid' AND user_id = 'user-uuid'
) as is_viewed;

-- ========================================
-- 6. POST INSIGHTS (إحصائيات البوست)
-- ========================================

-- إنشاء insights للبوست الجديد
INSERT INTO post_insights (post_id, views_count, likes_count, comments_count)
VALUES ('post-uuid', 0, 0, 0);

-- الحصول على إحصائيات البوست
SELECT 
  post_id,
  views_count,
  likes_count,
  comments_count,
  saves_count,
  reach,
  impressions,
  engagement_rate
FROM post_insights
WHERE post_id = 'post-uuid';

-- الحصول على البوستات الأفضل أداءً (الأكثر مشاهدة)
SELECT 
  p.id,
  p.caption,
  p.image_url,
  pr.username,
  pi.views_count,
  pi.likes_count,
  pi.comments_count,
  pi.saves_count,
  pi.engagement_rate
FROM post_insights pi
JOIN posts p ON pi.post_id = p.id
JOIN profiles pr ON p.user_id = pr.id
WHERE pr.id = 'user-uuid'
ORDER BY pi.views_count DESC
LIMIT 10;

-- تحديث إحصائيات البوست
UPDATE post_insights
SET 
  views_count = views_count + 1,
  updated_at = NOW(),
  engagement_rate = ROUND(
    ((likes_count + comments_count + saves_count) * 100.0 / views_count),
    2
  )
WHERE post_id = 'post-uuid';

-- ========================================
-- 7. COMBINED QUERIES - استعلامات مدمجة
-- ========================================

-- الحصول على بيانات البوست الكاملة مع جميع الإحصائيات
SELECT 
  p.id,
  p.caption,
  p.image_url,
  p.location,
  p.created_at,
  p.is_pinned,
  p.hide_likes,
  p.replies_disabled,
  p.views_count,
  CASE WHEN p.hide_likes THEN 0 ELSE p.likes_count END as likes_count,
  p.comments_count,
  pr.id as user_id,
  pr.username,
  pr.avatar_url,
  pr.is_verified,
  (SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id) as saves_count,
  (SELECT EXISTS(
    SELECT 1 FROM saved_posts 
    WHERE post_id = p.id AND user_id = 'current-user-uuid'
  )) as is_saved_by_current_user,
  (SELECT EXISTS(
    SELECT 1 FROM post_views 
    WHERE post_id = p.id AND user_id = 'current-user-uuid'
  )) as is_viewed_by_current_user
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.id = 'post-uuid';

-- الحصول على الـ Feed مع كل البيانات
SELECT 
  p.id,
  p.caption,
  p.image_url,
  p.location,
  p.created_at,
  p.is_pinned,
  CASE WHEN p.hide_likes THEN 0 ELSE p.likes_count END as likes_count,
  p.comments_count,
  p.views_count,
  pr.id as user_id,
  pr.username,
  pr.avatar_url,
  pr.is_verified,
  (SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id) as saves_count
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE pr.id IN (
  SELECT following_id FROM follows WHERE follower_id = 'user-uuid'
)
OR p.user_id = 'user-uuid'
ORDER BY p.created_at DESC
LIMIT 20;

-- ========================================
-- 8. STATISTICS & ANALYTICS - إحصائيات تحليلية
-- ========================================

-- الحصول على أفضل 5 بوستات للمستخدم بناءً على الـ engagement
SELECT 
  p.id,
  p.caption,
  p.image_url,
  pi.views_count,
  pi.likes_count,
  pi.comments_count,
  pi.saves_count,
  ROUND(pi.engagement_rate, 2) as engagement_rate
FROM posts p
JOIN post_insights pi ON p.id = pi.post_id
WHERE p.user_id = 'user-uuid'
ORDER BY pi.engagement_rate DESC
LIMIT 5;

-- إجمالي إحصائيات المستخدم
SELECT 
  COUNT(DISTINCT p.id) as total_posts,
  SUM(COALESCE(pi.views_count, 0)) as total_views,
  SUM(COALESCE(pi.likes_count, 0)) as total_likes,
  SUM(COALESCE(pi.comments_count, 0)) as total_comments,
  SUM(COALESCE(pi.saves_count, 0)) as total_saves,
  ROUND(AVG(COALESCE(pi.engagement_rate, 0)), 2) as avg_engagement_rate
FROM posts p
LEFT JOIN post_insights pi ON p.id = pi.post_id
WHERE p.user_id = 'user-uuid';

-- اتجاهات الأسبوع الأخير
SELECT 
  DATE(p.created_at) as date,
  COUNT(DISTINCT p.id) as posts_count,
  SUM(COALESCE(pi.views_count, 0)) as views,
  SUM(COALESCE(pi.likes_count, 0)) as likes,
  SUM(COALESCE(pi.comments_count, 0)) as comments
FROM posts p
LEFT JOIN post_insights pi ON p.id = pi.post_id
WHERE p.user_id = 'user-uuid'
AND p.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(p.created_at)
ORDER BY date DESC;
