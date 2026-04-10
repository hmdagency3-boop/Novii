-- إضافة عمود verified_at للـ profiles table
-- هذا العمود يتحفظ على التاريخ الحقيقي لتوثيق الحساب

-- 1. إضافة العمود الأساسي
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. إضافة فهرس لتحسين الأداء عند البحث عن الحسابات الموثقة
CREATE INDEX IF NOT EXISTS idx_profiles_verified_at 
ON profiles(verified_at);

-- 3. إضافة فهرس مركب للبحث عن الحسابات الموثقة والمرتبة بالتاريخ
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified_verified_at 
ON profiles(is_verified DESC, verified_at DESC) 
WHERE is_verified = TRUE;

-- ملاحظات عن السياسة:
-- - العمود يتقبل قيمة NULL (الحسابات غير الموثقة)
-- - عند توثيق حساب، نضيف timestamp حالي
-- - TYPE: TIMESTAMP WITH TIME ZONE يضمن:
--   * دقة الوقت الكاملة (ساعات وثواني)
--   * حفظ المنطقة الزمنية (UTC)
--   * عدم فقدان البيانات عند التحويل بين المناطق الزمنية
-- 
-- مثال لتحديث العمود عند توثيق حساب:
-- UPDATE profiles SET verified_at = NOW() WHERE id = 'user-id' AND is_verified = TRUE;
--
-- مثال للحصول على الحسابات الموثقة مرتبة حسب تاريخ التوثيق:
-- SELECT * FROM profiles WHERE is_verified = TRUE ORDER BY verified_at DESC;
