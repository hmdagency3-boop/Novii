-- Add reply_to_id to messages table for quoted replies
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);

-- Muted conversations table (client-side mute per user)
CREATE TABLE IF NOT EXISTS muted_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, other_user_id)
);
ALTER TABLE muted_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mutes" ON muted_conversations
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
