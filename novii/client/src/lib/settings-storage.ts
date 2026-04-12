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

export const DEFAULT_SETTINGS: UserSettings = {
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

function dbRowToSettings(row: any): UserSettings {
  return {
    notifications: {
      email_notifications: row.notifications_enabled ?? true,
      push_notifications: row.push_notifications ?? true,
      message_notifications: row.message_notifications ?? true,
      like_notifications: row.like_notifications ?? true,
      comment_notifications: row.comment_notifications ?? true,
      follow_notifications: row.follow_notifications ?? true,
    },
    messages: { who_can_message: row.messages_privacy ?? 'approved' },
    comments: { who_can_comment: row.comments_privacy === 'approved' ? 'none' : (row.comments_privacy ?? 'everyone') },
    story: { hide_story_from_all: row.hide_story ?? false, hide_from_users: [] },
    tags: { who_can_tag: row.tags_privacy ?? 'everyone' },
    sharing: { who_can_share: row.sharing_privacy ?? 'everyone' },
    hidden_words: { enabled: row.hidden_words_enabled ?? false, custom_words: row.hidden_words ?? [] },
    likes: { hide_like_counts_own: row.hide_like_counts ?? false, hide_like_counts_others: row.hide_others_like_counts ?? false },
    content: { show_suggested: true, show_trending: true, sensitive_content: false },
    archiving: { auto_archive_stories: row.auto_archive_stories ?? false, auto_archive_reels: row.auto_archive_reels ?? false },
    accessibility: { font_size: row.font_size ?? 'medium', high_contrast: row.high_contrast ?? false, reduce_motion: row.reduce_motion ?? false },
    account_type: row.account_type ?? 'personal',
    hide_online_status: row.hide_online_status ?? false,
  };
}

function settingsToDbRow(s: UserSettings) {
  return {
    notifications_enabled: s.notifications.email_notifications,
    push_notifications: s.notifications.push_notifications,
    message_notifications: s.notifications.message_notifications,
    like_notifications: s.notifications.like_notifications,
    comment_notifications: s.notifications.comment_notifications,
    follow_notifications: s.notifications.follow_notifications,
    messages_privacy: s.messages.who_can_message,
    comments_privacy: s.comments.who_can_comment === 'none' ? 'approved' : s.comments.who_can_comment,
    tags_privacy: s.tags.who_can_tag,
    sharing_privacy: s.sharing.who_can_share,
    hide_online_status: s.hide_online_status,
    hide_story: s.story.hide_story_from_all,
    hidden_words: s.hidden_words.custom_words,
    hidden_words_enabled: s.hidden_words.enabled,
    hide_like_counts: s.likes.hide_like_counts_own,
    hide_others_like_counts: s.likes.hide_like_counts_others,
    auto_archive_stories: s.archiving.auto_archive_stories,
    auto_archive_reels: s.archiving.auto_archive_reels,
    font_size: s.accessibility.font_size === 'xlarge' ? 'large' : s.accessibility.font_size,
    high_contrast: s.accessibility.high_contrast,
    reduce_motion: s.accessibility.reduce_motion,
    account_type: s.account_type,
  };
}

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { ...DEFAULT_SETTINGS };
  }
  return dbRowToSettings(data);
}

export async function saveUserSettingsToDb(userId: string, settings: UserSettings): Promise<void> {
  const row = settingsToDbRow(settings);
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...row }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

export interface StoredUser {
  id: string;
  username: string;
  avatar_url: string;
  full_name?: string;
  added_at: string;
}

type ListTable = 'blocked_users' | 'close_friends' | 'muted_users' | 'restricted_users' | 'favorite_users';

const LIST_CONFIG: Record<ListTable, { targetCol: string }> = {
  blocked_users: { targetCol: 'blocked_user_id' },
  close_friends: { targetCol: 'friend_id' },
  muted_users: { targetCol: 'muted_user_id' },
  restricted_users: { targetCol: 'restricted_user_id' },
  favorite_users: { targetCol: 'favorite_user_id' },
};

async function getListFromDb(table: ListTable, userId: string): Promise<StoredUser[]> {
  const { targetCol } = LIST_CONFIG[table];
  const { data, error } = await supabase
    .from(table)
    .select(`created_at, ${targetCol}`)
    .eq('user_id', userId);

  if (error || !data || data.length === 0) return [];

  const targetIds = data.map((row: any) => row[targetCol]);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', targetIds);

  if (profileError || !profiles) return [];

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
  return data
    .map((row: any) => {
      const profile = profileMap.get(row[targetCol]);
      if (!profile) return null;
      return {
        id: profile.id,
        username: profile.username || '',
        avatar_url: profile.avatar_url || '',
        full_name: profile.full_name || '',
        added_at: row.created_at,
      };
    })
    .filter(Boolean) as StoredUser[];
}

async function addToListDb(table: ListTable, userId: string, targetId: string): Promise<void> {
  const { targetCol } = LIST_CONFIG[table];
  const { error } = await supabase
    .from(table)
    .insert({ user_id: userId, [targetCol]: targetId });
  if (error && error.code !== '23505') {
    console.error(`Failed to add to ${table}:`, error);
    throw error;
  }
}

async function removeFromListDb(table: ListTable, userId: string, targetId: string): Promise<void> {
  const { targetCol } = LIST_CONFIG[table];
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('user_id', userId)
    .eq(targetCol, targetId);
  if (error) {
    console.error(`Failed to remove from ${table}:`, error);
    throw error;
  }
}

async function isInListDb(table: ListTable, userId: string, targetId: string): Promise<boolean> {
  const { targetCol } = LIST_CONFIG[table];
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('user_id', userId)
    .eq(targetCol, targetId)
    .single();
  return !error && !!data;
}

function createListHelper(table: ListTable) {
  return {
    get: (userId: string) => getListFromDb(table, userId),
    add: (userId: string, targetId: string) => addToListDb(table, userId, targetId),
    remove: (userId: string, targetId: string) => removeFromListDb(table, userId, targetId),
    has: (userId: string, targetId: string) => isInListDb(table, userId, targetId),
  };
}

export const blockedUsers = createListHelper('blocked_users');
export const closeFriends = createListHelper('close_friends');
export const mutedUsers = createListHelper('muted_users');
export const restrictedUsers = createListHelper('restricted_users');
export const favoriteUsers = createListHelper('favorite_users');

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
