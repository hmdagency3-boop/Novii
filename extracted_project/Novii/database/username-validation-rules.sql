-- ============================================================================
-- USERNAME VALIDATION SYSTEM FOR NOVII
-- ============================================================================
-- This document outlines the username validation rules and constraints
-- applied at the database and backend levels for the Novii platform.
--
-- Date: November 25, 2025
-- ============================================================================

-- VALIDATION RULES:
-- ============================================================================

-- 1. REQUIRED FIELD
--    - Username cannot be empty or NULL
--    - User MUST provide a username value
--    - After trimming, length must be > 0

-- 2. LENGTH CONSTRAINTS
--    - Minimum: 3 characters
--    - Maximum: 20 characters
--    - Ensures usernames are memorable and easy to share

-- 3. ALLOWED CHARACTERS
--    - Letters: A-Z (case-insensitive, A-z)
--    - Numbers: 0-9
--    - Special characters: . (dot), _ (underscore)
--    - Pattern: ^[a-zA-Z0-9._]+$
--
--    NOT ALLOWED:
--    - Spaces
--    - Foreign/Unicode characters (including Arabic)
--    - Special symbols: ! @ # $ % ^ & * ( ) - + = [ ] { } ; : ' " < > , ? / \

-- 4. POSITIONAL CONSTRAINTS
--    - Cannot START with: . (dot) or _ (underscore)
--    - Cannot END with: . (dot) or _ (underscore)
--    - Cannot contain: .. (consecutive dots) or __ (consecutive underscores)
--    - Prevents confusing or malformed usernames

-- 5. RESERVED USERNAMES (CASE-INSENSITIVE)
--    The following usernames are RESERVED and cannot be used:
--    - admin
--    - support
--    - official
--    - novii
--    - system
--
--    SQL CHECK:
--    WHERE LOWER(username) NOT IN ('admin', 'support', 'official', 'novii', 'system')

-- 6. BLACKLISTED CONTENT
--    Usernames containing offensive, racist, sexual, or abusive words
--    are automatically rejected. This includes but is not limited to:
--    - Profanity and curse words
--    - Slurs and hateful language
--    - Sexual or explicit content
--    - Drug-related terms
--    - Extremist references
--
--    The blacklist is maintained in the backend validation code:
--    See: client/src/lib/username-validation.ts (BLACKLIST_WORDS)

-- 7. UNIQUENESS
--    - Usernames must be UNIQUE in the profiles table
--    - Validation is CASE-INSENSITIVE: "Mo_Salah" == "mo_salah"
--    - Multiple accounts cannot have the same username (even with different casing)
--
--    SQL CHECK (Case-Insensitive):
--    SELECT COUNT(*) FROM profiles WHERE LOWER(username) = LOWER($1)
--    Result must be 0 for the username to be available

-- ============================================================================
-- BACKEND VALIDATION ENDPOINT
-- ============================================================================

-- Endpoint: POST /api/auth/check-username
-- Purpose: Verify username format and availability
--
-- Request Body:
--   {
--     "username": "string",        // Required: Username to validate
--     "excludeUserId": "uuid"      // Optional: Exclude specific user ID (for edits)
--   }
--
-- Response (Success):
--   {
--     "available": true,
--     "message": "Username is available"
--   }
--
-- Response (Error):
--   {
--     "available": false,
--     "error": "Descriptive error message"
--   }

-- ============================================================================
-- DATABASE QUERY FOR USERNAME CHECK
-- ============================================================================

-- Check if username exists (case-insensitive):
-- This query ensures case-insensitive uniqueness constraint
--
-- For signup (new user):
-- SELECT COUNT(*) FROM profiles 
-- WHERE LOWER(username) = LOWER($1);
--
-- For profile edit (excluding current user):
-- SELECT COUNT(*) FROM profiles 
-- WHERE LOWER(username) = LOWER($1) 
-- AND id != $2::uuid;

-- ============================================================================
-- FRONTEND VALIDATION
-- ============================================================================

-- Framework: React + TypeScript
-- Location: client/src/lib/username-validation.ts
--
-- Functions:
-- 1. validateUsernameFormat(username: string): UsernameValidationError
--    - Performs local validation (format, length, characters)
--    - No network request - instant feedback
--
-- 2. validateUsernameComplete(username: string, excludeUserId?: string): Promise<UsernameValidationError>
--    - Combines format validation with server-side uniqueness check
--    - Returns detailed error messages
--
-- 3. createDebouncedUsernameValidator(delayMs): Function
--    - Debounced validation for real-time form feedback
--    - Prevents excessive API calls

-- ============================================================================
-- VALIDATION FLOW
-- ============================================================================

-- 1. User enters username in edit profile dialog
-- 2. Frontend performs real-time format validation (debounced by 500ms)
-- 3. If format is valid, check uniqueness via /api/auth/check-username
-- 4. Display visual feedback:
--    - Green checkmark + "Username is available!" (valid)
--    - Red alert + specific error message (invalid)
-- 5. Save button is disabled until username is valid
-- 6. On submit, final validation is performed
-- 7. Backend receives validated username and stores in profiles.username

-- ============================================================================
-- SECURITY CONSIDERATIONS
-- ============================================================================

-- 1. Whitelist approach for character validation (only allow specific chars)
-- 2. Case-insensitive uniqueness to prevent homograph attacks
-- 3. Blacklist of offensive content to prevent abuse
-- 4. Reserved usernames to prevent impersonation of system accounts
-- 5. No SQL injection risk: Uses parameterized queries ($1, $2, etc.)
-- 6. Rate limiting on /api/auth/check-username endpoint (recommended future)

-- ============================================================================
-- ERROR MESSAGES
-- ============================================================================

-- 1. "Username is required"
-- 2. "Username must be at least 3 characters long"
-- 3. "Username must not exceed 20 characters"
-- 4. "Username can only contain letters (A-Z), numbers (0-9), dots (.), and underscores (_)"
-- 5. "Username cannot start with a dot (.) or underscore (_)"
-- 6. "Username cannot end with a dot (.) or underscore (_)"
-- 7. "Username cannot contain consecutive dots (..) or underscores (__)"
-- 8. "This username is reserved and cannot be used"
-- 9. "This username contains prohibited content and cannot be used"
-- 10. "This username is already taken. Please choose another one."
-- 11. "Could not verify username availability. Please try again."

-- ============================================================================
-- EXAMPLES
-- ============================================================================

-- VALID usernames:
-- - john_doe (3+ chars, allowed chars, no start/end special chars)
-- - jane.smith (mixed dots and letters)
-- - user123 (numbers included)
-- - a.b_c (multiple special chars, not consecutive)
-- - username20 (exactly 20 chars)
--
-- INVALID usernames:
-- - "" or " " (empty - required)
-- - mo (2 chars - too short)
-- - john.doe.smith.williams (21 chars - too long)
-- - john_doe! (contains !)
-- - _john (starts with _)
-- - john. (ends with .)
-- - john..doe (consecutive dots)
-- - admin (reserved)
-- - john_shit (contains blacklisted word)

-- ============================================================================
