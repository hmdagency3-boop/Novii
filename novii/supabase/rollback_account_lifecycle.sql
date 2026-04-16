-- Rollback: remove account deactivation/deletion and communities_v3 additions
-- Run this in Supabase SQL editor to undo the account-lifecycle & communities v3 changes.

BEGIN;

-- 1) Drop deactivation/deletion-related columns on profiles (if they were added)
ALTER TABLE IF EXISTS public.profiles
  DROP COLUMN IF EXISTS is_deactivated,
  DROP COLUMN IF EXISTS deactivated_at,
  DROP COLUMN IF EXISTS scheduled_deletion_at,
  DROP COLUMN IF EXISTS deletion_backup,
  DROP COLUMN IF EXISTS redacted_at;

-- 2) Drop any trigger/function used to auto-redact profiles
DROP TRIGGER IF EXISTS trg_profiles_redact ON public.profiles;
DROP FUNCTION IF EXISTS public.redact_deactivated_profile() CASCADE;
DROP FUNCTION IF EXISTS public.restore_deactivated_profile(uuid) CASCADE;

-- 3) Drop communities_v3 additions (reactions/reply/mute/explore)
DROP TABLE IF EXISTS public.community_message_reactions CASCADE;

ALTER TABLE IF EXISTS public.community_members
  DROP COLUMN IF EXISTS notifications_muted;

ALTER TABLE IF EXISTS public.community_messages
  DROP COLUMN IF EXISTS replied_to_message_id;

COMMIT;

-- Note: this rollback is idempotent (safe to run even if columns/tables don't exist).
