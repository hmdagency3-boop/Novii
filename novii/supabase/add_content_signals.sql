CREATE TABLE IF NOT EXISTS content_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('not_interested', 'skip')),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'reel')),
  target_id UUID NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_signals_user ON content_signals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_signals_target ON content_signals(target_id, signal_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_signals_ni_unique
  ON content_signals(user_id, target_id, signal_type, target_type)
  WHERE signal_type = 'not_interested';

ALTER TABLE content_signals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own signals' AND tablename = 'content_signals') THEN
    CREATE POLICY "Users can insert own signals"
      ON content_signals FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own signals' AND tablename = 'content_signals') THEN
    CREATE POLICY "Users can read own signals"
      ON content_signals FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own signals' AND tablename = 'content_signals') THEN
    CREATE POLICY "Users can delete own signals"
      ON content_signals FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on content_signals' AND tablename = 'content_signals') THEN
    CREATE POLICY "Service role full access on content_signals"
      ON content_signals FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END
$$;
