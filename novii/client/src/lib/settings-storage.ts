import { supabase } from './supabase';

export interface UserSettings {
  notifications: {
    email_notifications: boolean;
    push_notifications: boolean;
    message_notifications: boolean;
    like_notifications: boolean;
    comment_notifications: boolean;
    follow_notifications: boolean;
  };
  messages: {
    who_can_message: 'everyone' | 'followers' | 'approved';
  };
  comments: {
    who_can_comment: 'everyone' | 'followers' | 'none';
  };
  story: {
    hide_story_from_all: boolean;
    hide_from_users: string[];
  };
  tags: {
    who_can_tag: 'everyone' | 'followers' | 'none';
  };
  sharing: {
    who_can_share: 'everyone' | 'followers' | 'none';
  };
  hidden_words: {
    enabled: boolean;
    custom_words: string[];
  };
  likes: {
    hide_like_counts_own: boolean;
    hide_like_counts_others: boolean;
  };
  content: {
    show_suggested: boolean;
    show_trending: boolean;
    sensitive_content: boolean;
  };
  archiving: {
    auto_archive_stories: boolean;
    auto_archive_reels: boolean;
  };
  accessibility: {
    font_size: 'small' | 'medium' | 'large' | 'xlarge';
    high_contrast: boolean;
    reduce_motion: boolean;
  };
  account_type: 'personal' | 'business' | 'creator';
  hide_online_status: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email_notifications: true,
    push_notifications: true,
    message_notifications: true,
    like_notifications: true,
    comment_notifications: true,
    follow_notifications: true,
  },
  messages: { who_can_message: 'approved' },
  comments: { who_can_comment: 'everyone' },
  story: { hide_story_from_all: false, hide_from_users: [] },
  tags: { who_can_tag: 'everyone' },
  sharing: { who_can_share: 'everyone' },
  hidden_words: { enabled: false, custom_words: [] },
  likes: { hide_like_counts_own: false, hide_like_counts_others: false },
  content: { show_suggested: true, show_trending: true, sensitive_content: false },
  archiving: { auto_archive_stories: false, auto_archive_reels: false },
  accessibility: { font_size: 'medium', high_contrast: false, reduce_motion: false },
  account_type: 'personal',
  hide_online_status: false,
};

const SETTINGS_KEY = 'novii_user_settings';
const BLOCKED_KEY = 'novii_blocked_users';
const CLOSE_FRIENDS_KEY = 'novii_close_friends';
const MUTED_KEY = 'novii_muted_users';
const RESTRICTED_KEY = 'novii_restricted_users';
const FAVORITES_KEY = 'novii_favorites';

function getKey(base: string, userId: string) { return `${base}_${userId}`; }

export function getUserSettings(userId: string): UserSettings {
  try {
    const raw = localStorage.getItem(getKey(SETTINGS_KEY, userId));
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveUserSettings(userId: string, settings: UserSettings): void {
  localStorage.setItem(getKey(SETTINGS_KEY, userId), JSON.stringify(settings));
}

export function updateUserSettings(userId: string, partial: Partial<UserSettings>): UserSettings {
  const current = getUserSettings(userId);
  const updated = { ...current, ...partial };
  saveUserSettings(userId, updated);
  return updated;
}

export interface StoredUser {
  id: string;
  username: string;
  avatar_url: string;
  full_name?: string;
  added_at: string;
}

function getList(key: string, userId: string): StoredUser[] {
  try {
    const raw = localStorage.getItem(getKey(key, userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveList(key: string, userId: string, list: StoredUser[]): void {
  localStorage.setItem(getKey(key, userId), JSON.stringify(list));
}

function addToList(key: string, userId: string, target: StoredUser): StoredUser[] {
  const list = getList(key, userId);
  if (list.some(u => u.id === target.id)) return list;
  const updated = [...list, { ...target, added_at: new Date().toISOString() }];
  saveList(key, userId, updated);
  return updated;
}

function removeFromList(key: string, userId: string, targetId: string): StoredUser[] {
  const list = getList(key, userId).filter(u => u.id !== targetId);
  saveList(key, userId, list);
  return list;
}

function isInList(key: string, userId: string, targetId: string): boolean {
  return getList(key, userId).some(u => u.id === targetId);
}

export const blockedUsers = {
  get: (userId: string) => getList(BLOCKED_KEY, userId),
  add: (userId: string, target: StoredUser) => addToList(BLOCKED_KEY, userId, target),
  remove: (userId: string, targetId: string) => removeFromList(BLOCKED_KEY, userId, targetId),
  has: (userId: string, targetId: string) => isInList(BLOCKED_KEY, userId, targetId),
};

export const closeFriends = {
  get: (userId: string) => getList(CLOSE_FRIENDS_KEY, userId),
  add: (userId: string, target: StoredUser) => addToList(CLOSE_FRIENDS_KEY, userId, target),
  remove: (userId: string, targetId: string) => removeFromList(CLOSE_FRIENDS_KEY, userId, targetId),
  has: (userId: string, targetId: string) => isInList(CLOSE_FRIENDS_KEY, userId, targetId),
};

export const mutedUsers = {
  get: (userId: string) => getList(MUTED_KEY, userId),
  add: (userId: string, target: StoredUser) => addToList(MUTED_KEY, userId, target),
  remove: (userId: string, targetId: string) => removeFromList(MUTED_KEY, userId, targetId),
  has: (userId: string, targetId: string) => isInList(MUTED_KEY, userId, targetId),
};

export const restrictedUsers = {
  get: (userId: string) => getList(RESTRICTED_KEY, userId),
  add: (userId: string, target: StoredUser) => addToList(RESTRICTED_KEY, userId, target),
  remove: (userId: string, targetId: string) => removeFromList(RESTRICTED_KEY, userId, targetId),
  has: (userId: string, targetId: string) => isInList(RESTRICTED_KEY, userId, targetId),
};

export const favoriteUsers = {
  get: (userId: string) => getList(FAVORITES_KEY, userId),
  add: (userId: string, target: StoredUser) => addToList(FAVORITES_KEY, userId, target),
  remove: (userId: string, targetId: string) => removeFromList(FAVORITES_KEY, userId, targetId),
  has: (userId: string, targetId: string) => isInList(FAVORITES_KEY, userId, targetId),
};

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
