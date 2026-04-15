CREATE TABLE IF NOT EXISTS ban_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  message TEXT,
  admin_note TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ban_appeals_user_id ON ban_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_status ON ban_appeals(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ban_appeals_one_active_per_user
  ON ban_appeals(user_id)
  WHERE status IN ('pending', 'reviewing');
