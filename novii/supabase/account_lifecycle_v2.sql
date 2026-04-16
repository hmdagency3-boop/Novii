-- Account lifecycle v2: soft-delete with 30-day grace period
-- Safe to run multiple times

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ;

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_is_deactivated
  ON profiles(is_deactivated) WHERE is_deactivated = TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_pending_deletion
  ON profiles(scheduled_deletion_at) WHERE scheduled_deletion_at IS NOT NULL;
