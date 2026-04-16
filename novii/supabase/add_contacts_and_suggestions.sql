CREATE TABLE IF NOT EXISTS user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone_hash TEXT NOT NULL,
  contact_name TEXT,
  matched_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_contacts_unique
  ON user_contacts(user_id, phone_hash);

CREATE INDEX IF NOT EXISTS idx_user_contacts_matched
  ON user_contacts(matched_user_id) WHERE matched_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_contacts_user
  ON user_contacts(user_id);

CREATE TABLE IF NOT EXISTS suggestion_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dismissed_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suggestion_dismissals_unique
  ON suggestion_dismissals(user_id, dismissed_user_id);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_phone_hash
  ON profiles(phone_hash) WHERE phone_hash IS NOT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contacts_synced_at TIMESTAMPTZ;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_dismissals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own contacts' AND tablename = 'user_contacts') THEN
    CREATE POLICY "Users manage own contacts"
      ON user_contacts FOR ALL
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on user_contacts' AND tablename = 'user_contacts') THEN
    CREATE POLICY "Service role full access on user_contacts"
      ON user_contacts FOR ALL
      USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own dismissals' AND tablename = 'suggestion_dismissals') THEN
    CREATE POLICY "Users manage own dismissals"
      ON suggestion_dismissals FOR ALL
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on suggestion_dismissals' AND tablename = 'suggestion_dismissals') THEN
    CREATE POLICY "Service role full access on suggestion_dismissals"
      ON suggestion_dismissals FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END
$$;
