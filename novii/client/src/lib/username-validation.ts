/**
 * Username Validation System for Novii
 * Implements strict validation rules for usernames
 */

// Blacklist of prohibited words
const BLACKLIST_WORDS = [
  'admin', 'administrator', 'support', 'official', 'novii', 'system',
  'moderator', 'mod', 'staff', 'root', 'system', 'bot', 'bot_',
  'fuck', 'shit', 'damn', 'hell', 'crap', 'bitch', 'ass', 'asshole',
  'bastard', 'motherfucker', 'whore', 'slut', 'faggot', 'nigga', 'nigger',
  'jew', 'christian', 'muslim', 'arab', 'gay', 'lesbian', 'transgender',
  'rape', 'murder', 'kill', 'suicide', 'die', 'death', 'terrorist',
  'bomb', 'explode', 'shoot', 'gun', 'weapon', 'drug', 'cocaine',
  'heroin', 'weed', 'marijuana', 'nazi', 'hitler', 'klan', 'kkk',
];

// Reserved usernames (case-insensitive)
const RESERVED_USERNAMES = [
  'admin',
  'support',
  'official',
  'novii',
  'system',
];

export interface UsernameValidationError {
  isValid: boolean;
  error: string | null;
}

export interface UsernameCheckRequest {
  username: string;
  excludeUserId?: string; // For edit mode - exclude current user from uniqueness check
}

/**
 * Validates username format locally
 * Returns detailed error message if invalid
 */
export function validateUsernameFormat(username: string): UsernameValidationError {
  // Trim whitespace
  username = username.trim();

  // Check if empty
  if (!username || username.length === 0) {
    return {
      isValid: false,
      error: 'Username is required',
    };
  }

  // Check length
  if (username.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long',
    };
  }

  if (username.length > 20) {
    return {
      isValid: false,
      error: 'Username must not exceed 20 characters',
    };
  }

  // Check for invalid characters
  const validPattern = /^[a-zA-Z0-9._]+$/;
  if (!validPattern.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters (A-Z), numbers (0-9), dots (.), and underscores (_)',
    };
  }

  // Check if starts with dot or underscore
  if (username.startsWith('.') || username.startsWith('_')) {
    return {
      isValid: false,
      error: 'Username cannot start with a dot (.) or underscore (_)',
    };
  }

  // Check if ends with dot or underscore
  if (username.endsWith('.') || username.endsWith('_')) {
    return {
      isValid: false,
      error: 'Username cannot end with a dot (.) or underscore (_)',
    };
  }

  // Check for consecutive dots or underscores
  if (username.includes('..') || username.includes('__')) {
    return {
      isValid: false,
      error: 'Username cannot contain consecutive dots (..) or underscores (__)',
    };
  }

  // Check for reserved usernames (case-insensitive)
  const lowerUsername = username.toLowerCase();
  if (RESERVED_USERNAMES.includes(lowerUsername)) {
    return {
      isValid: false,
      error: 'This username is reserved and cannot be used',
    };
  }

  // Check for blacklisted words (exact match only, not substring)
  const hasBlacklistedWord = BLACKLIST_WORDS.some((word) => {
    const lowerWord = word.toLowerCase();
    // Only match if the entire username is the blacklisted word
    return lowerUsername === lowerWord;
  });

  if (hasBlacklistedWord) {
    return {
      isValid: false,
      error: 'This username contains prohibited content and cannot be used',
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Full validation including server-side checks
 * This is called from edit-profile-dialog for real-time feedback
 */
export async function validateUsernameComplete(
  username: string,
  excludeUserId?: string
): Promise<UsernameValidationError> {
  // First, validate format locally
  const formatValidation = validateUsernameFormat(username);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  // Then, check uniqueness on server
  try {
    const response = await fetch('/api/auth/check-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), excludeUserId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        isValid: false,
        error: error.error || 'Failed to check username availability',
      };
    }

    const data = await response.json();
    if (!data.available) {
      return {
        isValid: false,
        error: 'This username is already taken. Please choose another one.',
      };
    }

    return {
      isValid: true,
      error: null,
    };
  } catch (error) {
    console.error('Username validation error:', error);
    return {
      isValid: false,
      error: 'Could not verify username availability. Please try again.',
    };
  }
}

/**
 * Debounced version for real-time validation in form
 */
export function createDebouncedUsernameValidator(delayMs = 500) {
  let timeoutId: NodeJS.Timeout | null = null;

  return async (
    username: string,
    excludeUserId?: string,
    callback?: (result: UsernameValidationError) => void
  ) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(async () => {
      const result = await validateUsernameComplete(username, excludeUserId);
      callback?.(result);
    }, delayMs);
  };
}
