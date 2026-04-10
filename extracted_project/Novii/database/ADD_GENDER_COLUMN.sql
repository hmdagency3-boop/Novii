-- Add gender column to profiles table
-- This migration adds support for storing user gender during registration

ALTER TABLE profiles
ADD COLUMN gender TEXT;

-- Add constraint to ensure valid gender values
ALTER TABLE profiles
ADD CONSTRAINT gender_check CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));

-- Create an index for better query performance
CREATE INDEX idx_profiles_gender ON profiles(gender);
