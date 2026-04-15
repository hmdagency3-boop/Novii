-- =============================================
-- Verification Requests Table + RLS Policies
-- =============================================

-- 1) Create the table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'personal'
    CHECK (category IN ('personal', 'creator', 'business', 'public_figure', 'organization')),
  social_links JSONB DEFAULT '{}',
  id_card_url TEXT,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_vr_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vr_status ON verification_requests(status);

-- 3) Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- 4) Policy: Users can read their own requests
CREATE POLICY "Users can view own verification requests"
  ON verification_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5) Policy: Users can insert their own requests
CREATE POLICY "Users can submit verification requests"
  ON verification_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- 6) Policy: Service role (admins) can do everything (automatically bypasses RLS)
-- No explicit policy needed — service_role key bypasses RLS by default

-- 7) Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verification_updated_at ON verification_requests;
CREATE TRIGGER trg_verification_updated_at
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_updated_at();
