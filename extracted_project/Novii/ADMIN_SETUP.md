# إعداد لوحة التحكم (Admin Setup)

## الخطوات:

### 1️⃣ أضف الأعمدة الناقصة إلى Supabase

اذهب إلى **Supabase Dashboard** → **SQL Editor** وشغل هذه الأوامر واحد تلو الآخر:

```sql
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
```

```sql
ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN DEFAULT false;
```

```sql
ALTER TABLE profiles ADD COLUMN banned_reason TEXT;
```

### 2️⃣ اجعل نفسك أدمن

بعد إضافة الأعمدة، شغل هذا الأمر:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = '50454f71-9cc9-40e4-9363-aa6bdf739b34';
```

### 3️⃣ ادخل لوحة التحكم

الآن افتح التطبيق واذهب إلى:
```
/admin
```

ستشوف:
✅ Dashboard - إحصائيات المنصة
✅ Users - إدارة المستخدمين
✅ Ban/Unban/Delete - تحكم كامل

---

## ملاحظات:
- إذا رأيت "Access Denied" - تأكد أن الأعمدة أضيفت والـ role تغير إلى admin
- اعمل refresh للصفحة إذا ما شفت التحديثات
