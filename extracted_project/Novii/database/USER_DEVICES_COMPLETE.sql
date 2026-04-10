-- ==========================================
-- Device Tracking Security Feature - Complete SQL Schema
-- Novii Social Media Platform
-- ==========================================
-- This migration sets up complete device tracking:
-- - Table schema with all device information
-- - Foreign key relationships
-- - Performance indexes
-- - Row Level Security (RLS) policies
-- - Permission grants
-- ==========================================

-- ==========================================
-- 1. CREATE USER_DEVICES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key relationship to profiles table
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Network Information
  ip_address TEXT NOT NULL,
  
  -- Browser Information
  browser TEXT,                    -- e.g., "Chrome", "Safari", "Firefox", "Edge", "Unknown"
  browser_version TEXT,            -- e.g., "131.0.0.0", "142.0.0.0"
  
  -- Device Information
  device_type TEXT,                -- 'mobile', 'tablet', 'desktop'
  device_name TEXT,                -- e.g., "iPhone 12", "Samsung Galaxy S21", "My Computer"
  device_model TEXT,               -- e.g., "SM-G991B", "iPhone12,1", "Unknown"
  
  -- Operating System Information
  os_name TEXT,                    -- 'iOS', 'Android', 'Windows', 'macOS', 'Linux'
  os_version TEXT,                 -- e.g., "16.0", "10", "12.2"
  
  -- Geolocation Information (from IP)
  country TEXT,                    -- e.g., "Egypt", "United States"
  country_code TEXT,               -- ISO 3166-1 alpha-2 code e.g., "EG", "US"
  city TEXT,                       -- e.g., "Cairo", "New York"
  
  -- Timestamps
  last_active_at TIMESTAMP DEFAULT NOW(),  -- Track when device was last active
  created_at TIMESTAMP DEFAULT NOW(),      -- When device was first registered
  updated_at TIMESTAMP DEFAULT NOW()       -- Last update timestamp
);

-- ==========================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Index for fast lookups by user (most common query)
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id 
ON user_devices(user_id);

-- Index for tracking devices by IP address
CREATE INDEX IF NOT EXISTS idx_user_devices_ip 
ON user_devices(ip_address);

-- Index for finding recently active devices
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active 
ON user_devices(last_active_at DESC);

-- Composite index for finding devices by user and activity
CREATE INDEX IF NOT EXISTS idx_user_devices_user_active 
ON user_devices(user_id, last_active_at DESC);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Policy 1: Users can only VIEW their own devices
-- Users can see all devices linked to their account
CREATE POLICY "Users can view their own devices"
ON user_devices FOR SELECT
USING (user_id = auth.uid());

-- Policy 2: Users can only DELETE their own devices
-- Users can remove/disconnect their own devices
CREATE POLICY "Users can delete their own devices"
ON user_devices FOR DELETE
USING (user_id = auth.uid());

-- Policy 3: System can INSERT device records
-- Server-side tracking is allowed (no auth.uid() check)
-- This allows the backend API to track devices on login/signup
CREATE POLICY "System can track devices"
ON user_devices FOR INSERT
WITH CHECK (true);

-- Policy 4: Users can UPDATE their own device activity
-- Allow updating last_active_at timestamp for their devices
CREATE POLICY "Users can update their own devices"
ON user_devices FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 5. GRANT PERMISSIONS
-- ==========================================

-- Authenticated users can SELECT and DELETE their own devices (via RLS)
GRANT SELECT, DELETE, UPDATE ON user_devices TO authenticated;

-- Both anonymous and authenticated users can INSERT (via RLS)
GRANT INSERT ON user_devices TO anon, authenticated;

-- ==========================================
-- 6. TABLE RELATIONSHIP DOCUMENTATION
-- ==========================================
/*
FOREIGN KEY RELATIONSHIP:
- user_devices.user_id → profiles.id
- Cascade behavior: ON DELETE CASCADE
  (When a user account is deleted, all their device records are automatically deleted)

RELATIONSHIP CARDINALITY:
- One user (profiles) has MANY devices (user_devices)
- One device belongs to ONE user (many-to-one)

DRIZZLE ORM RELATIONS:
Export from shared/schema.ts:
  export const userDevicesRelations = relations(userDevices, ({ one }) => ({
    user: one(profiles, {
      fields: [userDevices.userId],
      references: [profiles.id],
    }),
  }));

  export const profilesRelationsUpdated = relations(profiles, ({ many, one }) => ({
    devices: many(userDevices),
    // ... other relations
  }));
*/

-- ==========================================
-- 7. COMMON QUERIES
-- ==========================================

/*
-- Get all devices for a user
SELECT * FROM user_devices 
WHERE user_id = 'uuid-here' 
ORDER BY last_active_at DESC;

-- Get devices for a user (via RLS - authenticated user sees only their own)
SELECT * FROM user_devices 
ORDER BY last_active_at DESC;

-- Find all devices from a specific IP
SELECT * FROM user_devices 
WHERE ip_address = '192.168.1.1' 
ORDER BY last_active_at DESC;

-- Get recently active devices (last 24 hours)
SELECT * FROM user_devices 
WHERE last_active_at > NOW() - INTERVAL '24 hours' 
ORDER BY last_active_at DESC;

-- Count devices per user
SELECT user_id, COUNT(*) as device_count 
FROM user_devices 
GROUP BY user_id;

-- Find suspicious activity (multiple devices from different countries in short time)
SELECT user_id, COUNT(DISTINCT country) as countries, 
       MIN(last_active_at) as earliest, 
       MAX(last_active_at) as latest
FROM user_devices 
WHERE last_active_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id 
HAVING COUNT(DISTINCT country) > 1;

-- Delete old unused devices (older than 90 days and inactive)
DELETE FROM user_devices 
WHERE last_active_at < NOW() - INTERVAL '90 days' 
  AND created_at < NOW() - INTERVAL '120 days';
*/

-- ==========================================
-- 8. PERFORMANCE NOTES
-- ==========================================
/*
INDEXES OPTIMIZATION:
1. idx_user_devices_user_id - PRIMARY lookup (O(log n))
2. idx_user_devices_ip - Security checks for suspicious IPs
3. idx_user_devices_last_active - Find recently active devices
4. idx_user_devices_user_active - Composite for common joined queries

QUERY PERFORMANCE:
- Get user devices: O(log n) via user_id index + ORDER BY last_active_at DESC
- Delete device: O(log n) single row lookup by id
- Security checks: O(log n) via ip_address index

RLS PERFORMANCE:
- RLS policies have minimal overhead as they're compiled into queries
- Each query automatically filters by auth.uid() at the database level
- No need for application-level authorization checks
*/

-- ==========================================
-- 9. SECURITY NOTES
-- ==========================================
/*
RLS (ROW LEVEL SECURITY) GUARANTEES:
1. Users can ONLY see/delete their own devices
   - Even if someone tries to query, RLS enforces the filter
   - SQL injection cannot bypass RLS policies

2. Server can track devices without auth verification
   - Backend API can insert during signup/login
   - frontend provides user_id, backend validates it's real

3. Cascade delete
   - User account deletion automatically removes all devices
   - No orphaned device records in database

DEVICE TRACKING FLOW:
1. Frontend: POST /api/devices/track with {userId}
2. Backend: Detects device info from user-agent + IP-API
3. Backend: INSERT into user_devices with full details
4. Frontend: GET /api/devices/user/{userId}
5. RLS: Database only returns devices for authenticated user
6. Frontend: Displays devices in Settings → Security

DATA RETENTION:
- All device data persists until manually deleted by user
- Devices older than 90 days with no activity can be auto-deleted
- Timestamps enable activity tracking and reporting
*/

-- ==========================================
-- 10. STATUS CHECK
-- ==========================================

-- After applying this migration, verify:
-- 1. Table exists
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'user_devices');

-- 2. Indexes are created
SELECT indexname FROM pg_indexes WHERE tablename = 'user_devices';

-- 3. RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'user_devices';

-- 4. Policies are created
SELECT * FROM pg_policies WHERE tablename = 'user_devices';
