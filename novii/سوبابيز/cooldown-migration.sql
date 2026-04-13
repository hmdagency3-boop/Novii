-- =============================================
-- سياسة تغيير البيانات الشخصية (مثل Instagram)
-- اسم المستخدم والاسم: كل 14 يوم
-- الجنس: كل 30 يوم
-- شغّل هذا الكود في Supabase Dashboard > SQL Editor
-- =============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name_changed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender_changed_at TIMESTAMPTZ DEFAULT NULL;
