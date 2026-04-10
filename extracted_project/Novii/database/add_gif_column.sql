-- Add GIF URL column to comments table
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS gif_url TEXT;

-- Create index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_comments_gif_url ON comments(gif_url) WHERE gif_url IS NOT NULL;
