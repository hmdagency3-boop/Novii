# إعداد جدول الأدمن (Admin Table Setup)

## خطوات الإعداد:

### 1️⃣ أنشئ جدول admins في Supabase

اذهب إلى **Supabase Dashboard** → **SQL Editor** وشغل هذا الأمر:

```sql
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  permissions TEXT DEFAULT 'full',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- أضف فهرس على user_id للسرعة
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
```

### 2️⃣ أضف نفسك كأدمن

بعد إنشاء الجدول، شغل هذا الأمر:

```sql
INSERT INTO admins (user_id, permissions, is_active) 
VALUES ('50454f71-9cc9-40e4-9363-aa6bdf739b34', 'full', true);
```

### 3️⃣ ادخل لوحة التحكم

الآن افتح التطبيق واذهب إلى:
```
/admin
```

---

## ملاحظات مهمة:

✅ جدول admins منفصل تماماً عن profiles
✅ كل أدمن له صلاحيات محددة:
   - `full`: تحكم كامل
   - `moderate`: إدارة المحتوى فقط
   - `view`: عرض فقط

✅ عندما تحذف مستخدم من admins، لا يتم حذف حسابه من profiles

---

## إضافة أدمن آخر:

إذا أردت تحويل مستخدم آخر إلى أدمن:

```sql
INSERT INTO admins (user_id, permissions, is_active) 
VALUES ('USER_ID_HERE', 'full', true);
```

## حذف أدمن:

```sql
DELETE FROM admins WHERE user_id = 'USER_ID_HERE';
```

## تعديل الصلاحيات:

```sql
UPDATE admins 
SET permissions = 'moderate' 
WHERE user_id = 'USER_ID_HERE';
```
