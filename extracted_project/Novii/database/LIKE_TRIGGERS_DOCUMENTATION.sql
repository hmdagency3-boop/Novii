-- =====================================================
-- LIKES FUNCTIONALITY - DATABASE TRIGGERS & FUNCTIONS
-- =====================================================
-- Complete documentation and SQL code for like count management
-- These triggers automatically update the likes_count in posts table
-- when likes are added or removed from the likes table

-- =====================================================
-- 1. FUNCTION: increment_likes_on_insert
-- =====================================================
-- Purpose: Automatically increment likes_count when a new like is inserted
-- Triggered by: AFTER INSERT ON likes
-- Usage: Called automatically by likes_increment_trigger

CREATE OR REPLACE FUNCTION increment_likes_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the likes_count in posts table by 1
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FUNCTION: decrement_likes_on_delete
-- =====================================================
-- Purpose: Automatically decrement likes_count when a like is deleted
-- Triggered by: AFTER DELETE ON likes
-- Usage: Called automatically by likes_decrement_trigger
-- Note: Uses GREATEST(..., 0) to prevent negative values

CREATE OR REPLACE FUNCTION decrement_likes_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement the likes_count in posts table by 1
  -- Use GREATEST to ensure it never goes below 0
  UPDATE posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.post_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TRIGGER: likes_increment_trigger
-- =====================================================
-- Purpose: Execute increment_likes_on_insert() after a new like is inserted
-- Event: AFTER INSERT ON likes
-- Effect: likes_count in posts table increases by 1

CREATE TRIGGER likes_increment_trigger
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_likes_on_insert();

-- =====================================================
-- 4. TRIGGER: likes_decrement_trigger
-- =====================================================
-- Purpose: Execute decrement_likes_on_delete() after a like is deleted
-- Event: AFTER DELETE ON likes
-- Effect: likes_count in posts table decreases by 1

CREATE TRIGGER likes_decrement_trigger
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_likes_on_delete();

-- =====================================================
-- HOW IT WORKS
-- =====================================================
-- 
-- 1. When a user likes a post:
--    a) API receives like request: POST /api/posts/:id/like
--    b) Database INSERT into likes table: INSERT INTO likes (post_id, user_id) VALUES (...)
--    c) Trigger likes_increment_trigger fires AFTER INSERT
--    d) Function increment_likes_on_insert() executes
--    e) UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id
--
-- 2. When a user unlikes a post:
--    a) API receives unlike request: DELETE /api/posts/:id/like
--    b) Database DELETE from likes table: DELETE FROM likes WHERE post_id = ... AND user_id = ...
--    c) Trigger likes_decrement_trigger fires AFTER DELETE
--    d) Function decrement_likes_on_delete() executes
--    e) UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id
--
-- This ensures the likes_count is ALWAYS in sync with the actual number of likes!

-- =====================================================
-- DATA FLOW
-- =====================================================
-- 
-- User clicks Like button
--        |
--        v
-- POST /api/posts/:postId/like (frontend sends request)
--        |
--        v
-- Backend API: api.toggleLike(postId) in client/src/lib/api.ts
--        |
--        v
-- Database: INSERT INTO likes (post_id, user_id) VALUES (...)
--        |
--        v
-- Trigger: likes_increment_trigger fires
--        |
--        v
-- Function: increment_likes_on_insert() executes
--        |
--        v
-- Result: UPDATE posts SET likes_count = likes_count + 1
--        |
--        v
-- Frontend: Optimistic update shows new likes_count immediately

-- =====================================================
-- TESTING THE TRIGGERS
-- =====================================================
-- 
-- Test 1: Check current likes_count
-- SELECT id, caption, likes_count FROM posts WHERE caption = 'Your Test Post';
-- 
-- Test 2: Insert a like
-- INSERT INTO likes (post_id, user_id) VALUES ('post-uuid', 'user-uuid');
-- 
-- Test 3: Verify likes_count increased
-- SELECT id, caption, likes_count FROM posts WHERE id = 'post-uuid';
-- -- Should show likes_count incremented by 1
-- 
-- Test 4: Delete the like
-- DELETE FROM likes WHERE post_id = 'post-uuid' AND user_id = 'user-uuid';
-- 
-- Test 5: Verify likes_count decreased
-- SELECT id, caption, likes_count FROM posts WHERE id = 'post-uuid';
-- -- Should show likes_count decremented by 1
-- 
-- Test 6: Check if likes_count and actual likes match
-- SELECT 
--   p.id,
--   p.caption,
--   p.likes_count,
--   COUNT(l.id) as actual_likes_in_table
-- FROM posts p
-- LEFT JOIN likes l ON p.id = l.post_id
-- WHERE p.id = 'post-uuid'
-- GROUP BY p.id, p.caption, p.likes_count;
-- -- likes_count should equal actual_likes_in_table

-- =====================================================
-- KEY FEATURES
-- =====================================================
-- 
-- ✅ Automatic: No manual code needed to update likes_count
-- ✅ Instant: Updates happen immediately in the database
-- ✅ Safe: GREATEST(..., 0) prevents negative counts
-- ✅ Consistent: Always matches the actual number of likes
-- ✅ Efficient: Uses database triggers (faster than application code)
-- ✅ Reliable: Works even if application crashes after like is saved
-- 
-- =====================================================
-- RELATED CODE
-- =====================================================
-- 
-- Frontend Like Button: client/src/components/post-card.tsx
-- - handleLike() function calls api.toggleLike()
-- - Uses optimistic updates with TanStack Query
-- - Shows floating hearts animation
-- 
-- Backend API: client/src/lib/api.ts
-- - toggleLike(postId) method
-- - Checks if like exists
-- - Inserts or deletes from likes table
-- 
-- Database Schema: database/schema.sql
-- - profiles table: stores user information
-- - posts table: stores posts with likes_count
-- - likes table: stores which users like which posts
--
-- =====================================================
