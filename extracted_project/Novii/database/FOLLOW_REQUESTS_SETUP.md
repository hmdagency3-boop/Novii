# Follow Requests Setup Guide

## Overview
This setup enables follow request functionality for private accounts on the Novii platform.

## What Changed

### 1. **Profiles Table Updates**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pending_follow_requests_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
```

### 2. **New Follow Requests Table**
```sql
CREATE TABLE follow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(requester_id, recipient_id),
  CHECK (requester_id != recipient_id)
);
```

### 3. **Indexes Created**
- `idx_profiles_is_private` - For faster queries on private accounts
- `idx_follow_requests_requester` - Find requests by requester
- `idx_follow_requests_recipient` - Find requests by recipient
- `idx_follow_requests_status` - Filter by status
- `idx_follow_requests_recipient_status` - Combined query optimization

### 4. **Row Level Security (RLS) Policies**
- Users can only view their own follow requests
- Users can create follow requests
- Only recipients can approve/reject requests
- Only requesters can delete their own requests

### 5. **Automatic Triggers**
- `auto_approve_follow_request` - For public accounts, requests auto-convert to follows
- `approve_follow_request` - When request approved, creates follow relationship

### 6. **Helper Functions**
- `get_pending_follow_requests_count(user_id)` - Count pending requests
- `has_pending_follow_request(requester_id, recipient_id)` - Check if request exists

### 7. **Views**
- `pending_follow_requests_with_profile` - Query pending requests with profile details

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project
2. Open SQL Editor → New Query
3. Copy contents of `database/follow_requests_schema.sql`
4. Run the query

### Option 2: CLI
```bash
supabase db push database/follow_requests_schema.sql
```

## How It Works

### For Private Accounts:
1. User tries to follow a private account
2. System creates a `follow_request` record
3. Owner receives a notification (`type: 'follow_request'`)
4. Owner can approve (creates follow relationship) or reject

### For Public Accounts:
1. User tries to follow a public account
2. `auto_approve_follow_request` trigger runs
3. Request is auto-approved and follow is created immediately

## Database Schema Diagram

```
┌─────────────────────┐
│     profiles        │
├─────────────────────┤
│ id (PK)             │
│ username            │
│ is_private ◄────────┼─── Controls behavior
│ is_official         │
│ verified_at         │
│ cover_url           │
│ is_online           │
│ last_seen           │
└─────────────────────┘
         │
         │ (1:many)
         │
┌────────▼──────────────────────┐
│    follow_requests            │
├───────────────────────────────┤
│ id (PK)                       │
│ requester_id (FK) ────────────┼─► profiles
│ recipient_id (FK) ────────────┼─► profiles
│ status: pending/approved/...  │
│ created_at                    │
│ updated_at                    │
└───────────────────────────────┘
         │
         │ (on approved)
         │
    ┌────▼────────────┐
    │    follows      │
    ├─────────────────┤
    │ id (PK)         │
    │ follower_id (FK)│
    │ following_id(FK)│
    └─────────────────┘

┌──────────────────────────────┐
│   notifications              │
├──────────────────────────────┤
│ id (PK)                      │
│ type: follow_request ◄───────┼─── New type
│ actor_id                     │
│ user_id                      │
│ created_at                   │
└──────────────────────────────┘
```

## API Integration

The following API functions are already implemented:

```typescript
// Send follow request (automatic for private accounts)
api.toggleFollow(targetUserId)

// Get pending requests
api.getPendingFollowRequests()

// Approve request
api.approveFollowRequest(actorId)

// Reject request  
api.rejectFollowRequest(actorId)

// Check pending request status
api.hasFollowRequest(targetUserId)
```

## UI Components Needed

The following need to be added to the notifications page:
- Display pending follow requests
- Approve button
- Reject button
- Requester profile preview

## Testing Checklist

- [ ] Create two accounts
- [ ] Make Account 1 private (Settings → Account Privacy)
- [ ] Try to follow from Account 2
- [ ] Verify "Request Pending" status shown
- [ ] Check Account 1 receives notification
- [ ] Approve request from Account 1
- [ ] Verify Account 2 now follows Account 1
- [ ] Test reject functionality
- [ ] Test public account (should auto-approve)

