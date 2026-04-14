-- =============================================
-- ADMIN SYSTEM UPGRADE MIGRATION
-- Run this on your Supabase instance
-- =============================================

-- 1. Add new columns to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'moderator' CHECK (role IN ('super_admin', 'admin', 'moderator'));
ALTER TABLE admins ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN DEFAULT FALSE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS can_manage_content BOOLEAN DEFAULT FALSE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS can_manage_admins BOOLEAN DEFAULT FALSE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS can_manage_reports BOOLEAN DEFAULT FALSE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT FALSE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS can_manage_settings BOOLEAN DEFAULT FALSE;

-- 2. Update existing admins to super_admin with full permissions
UPDATE admins SET
  role = 'super_admin',
  can_manage_users = TRUE,
  can_manage_content = TRUE,
  can_manage_admins = TRUE,
  can_manage_reports = TRUE,
  can_view_analytics = TRUE,
  can_manage_settings = TRUE
WHERE role IS NULL OR role = 'moderator';

-- 3. Create admin activity logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action         TEXT NOT NULL,
  target_type    TEXT,
  target_id      UUID,
  details        TEXT,
  ip_address     TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  value       TEXT,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert default platform settings
INSERT INTO platform_settings (key, value) VALUES
  ('auto_moderation', 'false'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);

-- 7. RLS policies for admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert logs"
  ON admin_logs FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.is_active = TRUE)
  );

CREATE POLICY "Admins can view logs"
  ON admin_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.is_active = TRUE)
  );

-- 8. RLS policies for platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings"
  ON platform_settings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.is_active = TRUE)
  );

CREATE POLICY "Admins with settings permission can update"
  ON platform_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.is_active = TRUE AND admins.can_manage_settings = TRUE)
  );

CREATE POLICY "Admins with settings permission can insert"
  ON platform_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.is_active = TRUE AND admins.can_manage_settings = TRUE)
  );
