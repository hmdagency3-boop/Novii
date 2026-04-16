-- Rollback: remove ONLY account deactivation/deletion additions from profiles.
-- Safe to run in Supabase SQL editor. Idempotent.
-- Does NOT touch communities or any other tables.

BEGIN;

-- Drop deactivation/deletion-related columns on profiles (if present)
ALTER TABLE IF EXISTS public.profiles
  DROP COLUMN IF EXISTS is_deactivated,
  DROP COLUMN IF EXISTS deactivated_at,
  DROP COLUMN IF EXISTS scheduled_deletion_at,
  DROP COLUMN IF EXISTS deletion_backup,
  DROP COLUMN IF EXISTS redacted_at;

-- Drop any trigger/function used to auto-redact profiles on deactivation
DROP TRIGGER IF EXISTS trg_profiles_redact ON public.profiles;
DROP FUNCTION IF EXISTS public.redact_deactivated_profile() CASCADE;
DROP FUNCTION IF EXISTS public.restore_deactivated_profile(uuid) CASCADE;

-- Drop any lifecycle index left behind
DROP INDEX IF EXISTS public.idx_profiles_is_deactivated;

COMMIT;
