import { supabase } from "./supabase";

const NOVII_API_URL_OVERRIDE = (import.meta.env.VITE_NOVII_API_URL as string | undefined)?.replace(/\/$/, "");
const NOVII_API_BASE = NOVII_API_URL_OVERRIDE
  ? `${NOVII_API_URL_OVERRIDE}/api`
  : `${import.meta.env.BASE_URL}api`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || "";
  const userId = data.session?.user?.id || "";
  return {
    "Content-Type": "application/json",
    "x-user-token": token,
    "x-user-id": userId,
  };
}

export async function adminFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${NOVII_API_BASE}/admin${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text);
      msg = json.error || json.message || msg;
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }

  return res.json();
}

export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  admin: AdminRecord | null;
}> {
  return adminFetch("/check");
}

export async function fetchStats(): Promise<PlatformStats> {
  return adminFetch("/stats");
}

export async function fetchUsers(): Promise<UserProfile[]> {
  return adminFetch("/users");
}

export async function banUser(
  userId: string,
  data: { ban: boolean; reason?: string; duration?: string; terminateSessions?: boolean; showDuration?: boolean }
): Promise<unknown> {
  return adminFetch(`/users/${userId}/ban`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string): Promise<unknown> {
  return adminFetch(`/users/${userId}`, { method: "DELETE" });
}

export async function updateUser(
  userId: string,
  data: Record<string, unknown>
): Promise<unknown> {
  return adminFetch(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<unknown> {
  return adminFetch(`/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword }),
  });
}

export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; avatar_url: string }> {
  const headers = await getAuthHeaders();
  delete (headers as any)["Content-Type"];
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await fetch(
    `${NOVII_API_BASE}/admin/users/${userId}/avatar`,
    { method: "POST", headers, body: formData }
  );
  if (!res.ok) {
    const text = await res.text();
    let msg = `HTTP ${res.status}`;
    try { const json = JSON.parse(text); msg = json.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchAdmins(): Promise<AdminRecord[]> {
  return adminFetch("/admins");
}

export async function addAdmin(data: {
  user_id: string;
  role: string;
  can_manage_users: boolean;
  can_manage_content: boolean;
  can_manage_admins: boolean;
  can_manage_reports: boolean;
  can_view_analytics: boolean;
  can_manage_settings: boolean;
}): Promise<unknown> {
  return adminFetch("/admins", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdmin(
  userId: string,
  data: {
    role: string;
    can_manage_users: boolean;
    can_manage_content: boolean;
    can_manage_admins: boolean;
    can_manage_reports: boolean;
    can_view_analytics: boolean;
    can_manage_settings: boolean;
  }
): Promise<unknown> {
  return adminFetch(`/admins/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAdmin(userId: string): Promise<unknown> {
  return adminFetch(`/admins/${userId}`, { method: "DELETE" });
}

export async function fetchContent(): Promise<PostRecord[]> {
  return adminFetch("/content");
}

export async function deleteContent(postId: string): Promise<unknown> {
  return adminFetch(`/content/${postId}`, { method: "DELETE" });
}

export async function fetchDeletedContent(): Promise<PostRecord[]> {
  return adminFetch("/content/deleted");
}

export async function restoreContent(postId: string): Promise<unknown> {
  return adminFetch(`/content/${postId}/restore`, { method: "POST" });
}

export async function featureContent(postId: string, featured: boolean): Promise<unknown> {
  return adminFetch(`/content/${postId}/feature`, {
    method: "POST",
    body: JSON.stringify({ featured }),
  });
}

export async function featureUser(userId: string, featured: boolean): Promise<unknown> {
  return adminFetch(`/users/${userId}/feature`, {
    method: "POST",
    body: JSON.stringify({ featured }),
  });
}

export async function warnUser(
  userId: string,
  data: { reason?: string }
): Promise<unknown> {
  return adminFetch(`/users/${userId}/warn`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function forceLogoutUser(userId: string): Promise<{ success: boolean; sessions_terminated: number }> {
  return adminFetch(`/users/${userId}/force-logout`, {
    method: "POST",
  });
}

export async function fetchReports(): Promise<ReportRecord[]> {
  return adminFetch("/reports");
}

export async function fetchLogs(): Promise<LogRecord[]> {
  return adminFetch("/logs");
}

export async function fetchSettings(): Promise<SettingRecord[]> {
  const raw = await adminFetch<Record<string, string>>("/settings");
  return Object.entries(raw).map(([key, value], i) => ({
    id: i,
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
}

export async function updateSettings(
  key: string,
  value: string
): Promise<unknown> {
  return adminFetch("/settings", {
    method: "PATCH",
    body: JSON.stringify({ key, value }),
  });
}

export async function fetchCommunities(): Promise<CommunityRecord[]> {
  return adminFetch("/communities");
}

export async function fetchCommunityMembers(communityId: string): Promise<CommunityMemberRecord[]> {
  return adminFetch(`/communities/${communityId}/members`);
}

export async function deleteCommunity(communityId: string): Promise<unknown> {
  return adminFetch(`/communities/${communityId}`, { method: "DELETE" });
}

export async function kickCommunityMember(communityId: string, userId: string): Promise<unknown> {
  return adminFetch(`/communities/${communityId}/kick-member`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function unkickCommunityMember(communityId: string, userId: string): Promise<unknown> {
  return adminFetch(`/communities/${communityId}/unkick-member`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function muteCommunityMember(communityId: string, userId: string): Promise<unknown> {
  return adminFetch(`/communities/${communityId}/mute-member`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function unmuteCommunityMember(communityId: string, userId: string): Promise<unknown> {
  return adminFetch(`/communities/${communityId}/unmute-member`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function setCommunityMemberRole(communityId: string, userId: string, role: string): Promise<unknown> {
  return adminFetch(`/communities/${communityId}/set-role`, {
    method: "POST",
    body: JSON.stringify({ userId, role }),
  });
}

export async function fetchCommunityMessages(communityId: string): Promise<CommunityMessageRecord[]> {
  return adminFetch(`/communities/${communityId}/messages`);
}

export async function deleteCommunityMessage(communityId: string, messageId: string): Promise<unknown> {
  return adminFetch(`/communities/${communityId}/messages/${messageId}`, { method: "DELETE" });
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalReports: number;
  totalCommunities: number;
  totalAdmins: number;
  newUsersThisWeek: number;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  full_name?: string;
  bio: string;
  avatar_url: string;
  is_verified: boolean;
  is_official: boolean;
  is_creator: boolean;
  is_premium: boolean;
  is_popular: boolean;
  is_active: boolean;
  is_gold_early_member: boolean;
  is_silver_early_member: boolean;
  is_bronze_early_member: boolean;
  is_beta_tester: boolean;
  is_bug_hunter: boolean;
  is_featured: boolean;
  is_banned: boolean;
  ban_reason: string;
  banned_reason?: string;
  ban_expires_at: string | null;
  ban_until?: string | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  email?: string | null;
  phone?: string | null;
}

export interface AdminRecord {
  id: number;
  user_id: string;
  role: string;
  is_active: boolean;
  can_manage_users: boolean;
  can_manage_content: boolean;
  can_manage_admins: boolean;
  can_manage_reports: boolean;
  can_view_analytics: boolean;
  can_manage_settings: boolean;
  created_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface PostRecord {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  is_deleted: boolean;
  is_featured: boolean;
  created_at: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ReportRecord {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_post_id: string | null;
  reason: string;
  description: string;
  status: string;
  admin_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter_username?: string;
  reporter_avatar?: string;
  reported_username?: string;
  reported_avatar?: string;
  post_caption?: string;
  post_image?: string;
}

export async function updateReport(reportId: string, data: { status?: string; admin_note?: string }): Promise<ReportRecord> {
  return adminFetch(`/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export interface LogRecord {
  id: string;
  admin_id: string;
  admin_user_id?: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | string;
  created_at: string;
  admin_username?: string;
}

export interface SettingRecord {
  id: number;
  key: string;
  value: string;
  updated_at: string;
}

export interface CommunityRecord {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  invite_code: string;
  is_private: boolean;
  created_at: string;
  created_by: string;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar: string | null;
  members_count: number;
  messages_count: number;
}

export interface CommunityMemberRecord {
  id: string;
  user_id: string;
  community_id: string;
  role: string;
  is_muted: boolean;
  muted_until: string | null;
  kicked_at: string | null;
  joined_at: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

export interface CommunityMessageRecord {
  id: string;
  community_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  is_deleted: boolean;
  is_system_message: boolean;
  created_at: string;
  sender_username: string | null;
  sender_display_name: string | null;
  sender_avatar: string | null;
}

export async function fetchUserDetails(userId: string): Promise<any> {
  return adminFetch(`/users/${userId}/details`);
}

export interface UserActivityResponse {
  liked_posts: any[];
  commented_posts: any[];
  liked_total: number;
  commented_total: number;
}

export async function fetchUserActivity(userId: string): Promise<UserActivityResponse> {
  return adminFetch(`/users/${userId}/activity`);
}

export interface BanAppeal {
  id: string;
  user_id: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  id_front_url: string;
  id_back_url: string;
  selfie_url: string;
  message?: string;
  admin_note?: string;
  reviewed_by?: string;
  created_at: string;
  reviewed_at?: string;
  profiles?: { username: string; full_name?: string; avatar_url?: string };
}

export async function fetchBanAppeals(): Promise<BanAppeal[]> {
  return adminFetch("/ban-appeals");
}

export async function updateBanAppeal(
  appealId: string,
  data: { status: 'approved' | 'rejected'; admin_note?: string }
): Promise<unknown> {
  return adminFetch(`/ban-appeals/${appealId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function sendSystemMessage(
  communityId: string,
  content: string
): Promise<{ success?: boolean; messageId?: string; error?: string; sql?: string }> {
  return adminFetch(`/communities/${communityId}/system-message`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export interface AlgorithmConfig {
  feed_weight_author: number;
  feed_weight_interest: number;
  feed_weight_engagement: number;
  feed_weight_recency: number;
  feed_weight_boost: number;
  feed_batch_size: number;
  feed_max_per_author: number;
  explore_weight_interest: number;
  explore_weight_engagement: number;
  explore_weight_recency: number;
  explore_weight_quality: number;
  explore_batch_size: number;
  explore_max_per_author: number;
  reels_weight_interest: number;
  reels_weight_engagement: number;
  reels_weight_recency: number;
  reels_batch_size: number;
  verified_boost: number;
  official_boost: number;
  creator_boost: number;
  profile_lookback_days: number;
  enabled: boolean;
}

export async function fetchAlgorithmConfig(): Promise<{ config: AlgorithmConfig; defaults: AlgorithmConfig }> {
  return adminFetch("/algorithm");
}

export async function updateAlgorithmConfig(updates: Partial<AlgorithmConfig>): Promise<{ success: boolean; config: AlgorithmConfig }> {
  return adminFetch("/algorithm", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function resetAlgorithmConfig(): Promise<{ success: boolean; config: AlgorithmConfig }> {
  return adminFetch("/algorithm/reset", { method: "POST" });
}
