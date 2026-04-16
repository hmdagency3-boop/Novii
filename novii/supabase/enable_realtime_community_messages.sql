-- Enable Supabase Realtime for community_messages so members receive new
-- messages instantly without needing to refetch.
--
-- Run this ONCE in the Supabase SQL Editor.

-- 1) Make sure the publication exists (it should by default on Supabase).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END$$;

-- 2) Add community_messages to the publication if it isn't already there.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'community_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages';
  END IF;
END$$;

-- 3) Ensure full row data is sent on UPDATE/DELETE events (needed for edits & reactions).
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;

-- 4) Also enable realtime for the reactions table if it exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'community_message_reactions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'community_message_reactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.community_message_reactions';
    EXECUTE 'ALTER TABLE public.community_message_reactions REPLICA IDENTITY FULL';
  END IF;
END$$;

-- 5) And community_members (so kicks / mutes propagate live).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'community_members'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members';
  END IF;
END$$;

-- 6) Direct messages (DMs) — required for instant delivery in private chats.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END$$;

ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Verify which tables are now in the publication:
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
