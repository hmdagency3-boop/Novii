-- ============================================================================
-- Novii Device Tracking System Upgrade
-- Adds professional device fingerprinting, trust system, session management
-- ============================================================================

ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS screen_resolution TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT FALSE;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 1;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS last_login_ip TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS session_token TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_devices_session ON user_devices(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_devices_status ON user_devices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_devices_trusted ON user_devices(user_id, is_trusted) WHERE is_trusted = TRUE;
