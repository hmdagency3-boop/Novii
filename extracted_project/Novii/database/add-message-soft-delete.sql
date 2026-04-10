-- Add soft delete columns to community_messages table
-- This allows admins to delete messages while maintaining audit trail

-- Add the new columns to track soft deletes
ALTER TABLE community_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Create an index on is_deleted for better query performance
CREATE INDEX idx_community_messages_is_deleted 
ON community_messages(community_id, is_deleted);

-- Create an index on deleted_at for audit trail queries
CREATE INDEX idx_community_messages_deleted_at 
ON community_messages(deleted_at) 
WHERE is_deleted = true;
