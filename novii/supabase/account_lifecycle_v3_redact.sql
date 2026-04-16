-- Account lifecycle v3: full redaction at the DB level
-- Safe to run multiple times.

-- Add backup column to store the original profile values when soft-deleted
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_backup JSONB;

-- Allow username uniqueness with the redacted prefix without collisions
-- (uses a per-user suffix in the application layer)
