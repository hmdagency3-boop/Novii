-- Migration: Add music_start_time to stories table
-- Run this in your Supabase SQL editor

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS music_start_time INTEGER DEFAULT 0;
