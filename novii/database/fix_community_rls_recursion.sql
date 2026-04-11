-- ============================================================
-- FIX: Infinite Recursion in community_members RLS Policies
-- Error code: 42P17
-- ============================================================
-- المشكلة:
--   سياسة SELECT على جدول community_members تراجع نفسها:
--   community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
--   مما يسبب infinite recursion (42P17).
--
-- الحل:
--   إنشاء SECURITY DEFINER functions تعمل بصلاحيات المالك
--   (تتجاوز RLS) لكسر حلقة التكرار، ثم استبدال كل السياسات
--   القديمة بسياسات جديدة غير متكررة.
-- ============================================================

-- ============================================================
-- الخطوة 1: إنشاء وظائف SECURITY DEFINER للتحقق من العضوية
-- ============================================================

-- التحقق إذا كان المستخدم الحالي عضوًا في المجتمع
CREATE OR REPLACE FUNCTION auth_is_community_member(p_community_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- التحقق إذا كان المستخدم الحالي أدمن أو مشرف في المجتمع
CREATE OR REPLACE FUNCTION auth_is_community_admin(p_community_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- الخطوة 2: حذف السياسات القديمة المتكررة
-- ============================================================

-- communities
DROP POLICY IF EXISTS "Users can view their communities"              ON communities;
DROP POLICY IF EXISTS "Authenticated users can create communities"   ON communities;
DROP POLICY IF EXISTS "Only creator can update community"            ON communities;
DROP POLICY IF EXISTS "Only creator can delete community"            ON communities;

-- community_members
DROP POLICY IF EXISTS "Users can view community members"             ON community_members;
DROP POLICY IF EXISTS "Admins can add members"                       ON community_members;
DROP POLICY IF EXISTS "Users can leave or be removed from community" ON community_members;
DROP POLICY IF EXISTS "Admins can update member roles"               ON community_members;

-- community_messages
DROP POLICY IF EXISTS "Users can view community messages"            ON community_messages;
DROP POLICY IF EXISTS "Members can send messages"                    ON community_messages;
DROP POLICY IF EXISTS "Users can edit their messages"                ON community_messages;
DROP POLICY IF EXISTS "Users can delete their messages"              ON community_messages;

-- moderation_logs
DROP POLICY IF EXISTS "Admins can read moderation logs"              ON moderation_logs;
DROP POLICY IF EXISTS "Admins can create moderation logs"            ON moderation_logs;

-- typing_indicators
DROP POLICY IF EXISTS "Anyone can read typing indicators"            ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing status"     ON typing_indicators;
DROP POLICY IF EXISTS "Users can update their own typing status"     ON typing_indicators;
DROP POLICY IF EXISTS "Users can delete their own typing status"     ON typing_indicators;

-- ============================================================
-- الخطوة 3: إنشاء سياسات جديدة غير متكررة
-- ============================================================

-- ---- COMMUNITIES ----
CREATE POLICY "Users can view their communities"
  ON communities FOR SELECT
  USING (
    created_by = auth.uid()
    OR auth_is_community_member(id)
  );

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only creator can update community"
  ON communities FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Only creator can delete community"
  ON communities FOR DELETE
  USING (created_by = auth.uid());

-- ---- COMMUNITY MEMBERS ----
-- المستخدم يرى صفه الخاص مباشرة (user_id = auth.uid())
-- أو يرى أعضاء مجتمع هو عضو فيه (عبر SECURITY DEFINER)
CREATE POLICY "Users can view community members"
  ON community_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR auth_is_community_member(community_id)
  );

CREATE POLICY "Admins can add members"
  ON community_members FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can leave or be removed from community"
  ON community_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR auth_is_community_admin(community_id)
  );

CREATE POLICY "Admins can update member roles"
  ON community_members FOR UPDATE
  USING (auth_is_community_admin(community_id));

-- ---- COMMUNITY MESSAGES ----
CREATE POLICY "Users can view community messages"
  ON community_messages FOR SELECT
  USING (
    auth_is_community_member(community_id)
    OR community_id IN (SELECT id FROM communities WHERE created_by = auth.uid())
  );

CREATE POLICY "Members can send messages"
  ON community_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND auth_is_community_member(community_id)
  );

CREATE POLICY "Users can edit their messages"
  ON community_messages FOR UPDATE
  USING (TRUE);

CREATE POLICY "Users can delete their messages"
  ON community_messages FOR DELETE
  USING (sender_id = auth.uid());

-- ---- MODERATION LOGS ----
CREATE POLICY "Admins can read moderation logs"
  ON moderation_logs FOR SELECT
  USING (auth_is_community_admin(community_id));

CREATE POLICY "Admins can create moderation logs"
  ON moderation_logs FOR INSERT
  WITH CHECK (auth_is_community_admin(community_id));

-- ---- TYPING INDICATORS ----
-- بسيطة وغير متكررة: المستخدم يتحكم في حالته فقط
CREATE POLICY "Anyone can read typing indicators"
  ON typing_indicators FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can manage their own typing status"
  ON typing_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status"
  ON typing_indicators FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status"
  ON typing_indicators FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- التحقق من النتيجة
-- ============================================================
-- بعد تطبيق هذا الملف، يجب أن تختفي أخطاء 42P17.
-- يمكنك التحقق بتشغيل:
--   SELECT auth_is_community_member('<community-uuid>');
--   SELECT auth_is_community_admin('<community-uuid>');
-- ============================================================
