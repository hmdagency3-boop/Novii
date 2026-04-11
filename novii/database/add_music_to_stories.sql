-- Add music fields to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS music_url TEXT,
ADD COLUMN IF NOT EXISTS music_title TEXT,
ADD COLUMN IF NOT EXISTS music_artist TEXT,
ADD COLUMN IF NOT EXISTS music_artwork_url TEXT;
