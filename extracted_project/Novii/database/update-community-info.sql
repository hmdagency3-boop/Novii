-- Update communities table with additional fields for owner customization

-- Note: avatar_url already exists in the communities table
-- Just ensure description can hold longer text for community info
ALTER TABLE communities
ALTER COLUMN description TYPE text;

-- Create index for faster queries when filtering communities by description or other fields
CREATE INDEX IF NOT EXISTS idx_communities_created_by 
ON communities(created_by);

-- Enable tracking of community updates
ALTER TABLE communities
ALTER COLUMN updated_at SET DEFAULT now();

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_communities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS communities_updated_at_trigger ON communities;
CREATE TRIGGER communities_updated_at_trigger
BEFORE UPDATE ON communities
FOR EACH ROW
EXECUTE FUNCTION update_communities_updated_at();
