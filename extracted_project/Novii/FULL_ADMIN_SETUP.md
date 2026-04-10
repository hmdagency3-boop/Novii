# نظام التحكم الكامل للأدمن (Full Admin Control System)

## ✨ المميزات الجديدة:

### 1️⃣ **Dashboard** - لوحة الإحصائيات
- عدد المستخدمين الكلي
- عدد المنشورات الكلي
- المستخدمين النشطين
- المستخدمين المحظورين

### 2️⃣ **Users Management** - إدارة المستخدمين
✅ عرض جميع المستخدمين
✅ حظر/إلغاء حظر المستخدمين
✅ حذف المستخدمين
✅ تعديل معلومات الحساب

### 3️⃣ **Badges & Verification** - الشارات والتحقق
✅ **Verified** - موثق (🔵 أزرق)
✅ **Official** - رسمي (🔴 أحمر)
✅ **Creator** - منشئ محتوى (⭐ أصفر)
✅ **Premium** - بريميوم (🔒 بنفسجي)
✅ **Popular** - مشهور (📊 برتقالي)

### 4️⃣ **Edit Users** - تعديل بيانات المستخدمين
✅ تعديل الاسم الكامل
✅ تعديل السيرة الذاتية
✅ تعديل الموقع الشخصي
✅ تعديل المدينة/الموقع

---

## 📋 خطوات الإعداد:

### 1️⃣ أضف الأعمدة الجديدة في Supabase

اذهب إلى **SQL Editor** وشغل:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
```

### 2️⃣ أضف جدول سجلات العمليات (اختياري)

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(user_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
```

### 3️⃣ تأكد من أنك أدمن

```sql
-- إذا لم تكن مضافاً:
INSERT INTO admins (user_id, permissions, is_active) 
VALUES ('YOUR_USER_ID', 'full', true)
ON CONFLICT (user_id) DO NOTHING;
```

### 4️⃣ ادخل لوحة التحكم

الآن اذهب إلى `/admin` في التطبيق وستشوف:
- ✅ Dashboard
- ✅ Users Management
- ✅ Badges & Verification
- ✅ Edit Users

---

## 🎮 كيفية الاستخدام:

### حظر مستخدم:
1. اذهب إلى **Users Tab**
2. اختر المستخدم
3. اضغط **Ban**
4. اكتب السبب (اختياري)
5. اضغط **Confirm**

### إعطاء شارة:
1. اذهب إلى **Badges & Verification Tab**
2. اختر المستخدم من الجدول
3. اختر الشارات التي تريد إعطاءها
4. اضغط **Save**

### تعديل البيانات:
1. اذهب إلى **Edit Users Tab**
2. اختر المستخدم
3. عدّل البيانات (الاسم، السيرة، الموقع، إلخ)
4. اضغط **Save**

---

## 📝 الصلاحيات المتاحة:

كل أدمن يمكنه:
✅ عرض جميع المستخدمين
✅ حظر/إلغاء حظر أي مستخدم
✅ حذف أي مستخدم
✅ إعطاء/إزالة الشارات
✅ تعديل معلومات أي حساب
✅ عرض الإحصائيات

---

## 🔒 الأمان:

- يمكن الدخول فقط إذا كنت مضاف في جدول **admins**
- جميع العمليات مسجلة (في جدول audit_logs)
- كل عملية تتطلب تأكيد من الأدمن

---

## إضافة أدمن آخر:

```sql
INSERT INTO admins (user_id, permissions, is_active) 
VALUES ('USER_ID_HERE', 'full', true);
```

## حذف أدمن:

```sql
DELETE FROM admins WHERE user_id = 'USER_ID_HERE';
```

## تعطيل أدمن:

```sql
UPDATE admins 
SET is_active = false 
WHERE user_id = 'USER_ID_HERE';
```

---

**كل شيء جاهز الآن! 🎉**
