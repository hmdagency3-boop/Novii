-- ============================================================
-- Migration: Add Badge Columns to Profiles Table
-- ============================================================
-- This migration adds columns for the new badges:
-- Creator, Premium, Popular, and Active
-- Simple BOOLEAN columns like is_verified and is_official

-- Add badge columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Create indexes for badge columns for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_creator ON profiles(is_creator) WHERE is_creator = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium) WHERE is_premium = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_popular ON profiles(is_popular) WHERE is_popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active) WHERE is_active = TRUE;

-- Create combined index for badge queries
CREATE INDEX IF NOT EXISTS idx_profiles_badges ON profiles(is_creator, is_premium, is_popular, is_active);
