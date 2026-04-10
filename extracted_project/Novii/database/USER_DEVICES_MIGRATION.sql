-- User Devices Table Migration for Device Tracking Security Feature
-- This table tracks all devices (browsers, IPs, OS) linked to user accounts

CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  browser TEXT,
  browser_version TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  device_name TEXT,
  device_model TEXT,
  os_name TEXT,
  os_version TEXT,
  country TEXT,
  country_code TEXT,
  city TEXT,
  last_active_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);

-- Create index for tracking by IP
CREATE INDEX IF NOT EXISTS idx_user_devices_ip ON user_devices(ip_address);

-- Create index for last_active_at to find recent activity
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active ON user_devices(last_active_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own devices" ON user_devices;
DROP POLICY IF EXISTS "Users can delete their own devices" ON user_devices;
DROP POLICY IF EXISTS "System can track devices" ON user_devices;

-- Policy: Users can only see their own devices
CREATE POLICY "Users can view their own devices"
ON user_devices FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can only delete their own devices
CREATE POLICY "Users can delete their own devices"
ON user_devices FOR DELETE
USING (user_id = auth.uid());

-- Policy: System can insert device records
CREATE POLICY "System can track devices"
ON user_devices FOR INSERT
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, DELETE ON user_devices TO authenticated;
GRANT INSERT ON user_devices TO anon, authenticated;
