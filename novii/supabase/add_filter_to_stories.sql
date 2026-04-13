-- Add filter_name column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS filter_name TEXT DEFAULT 'normal';
