import { supabase } from "./supabase";

const NOVII_API_BASE = `${import.meta.env.BASE_URL}api`;

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
    throw new Error(text || `HTTP ${res.status}`);
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
  data: { ban: boolean; reason?: string; duration?: string }
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
  is_banned: boolean;
  ban_reason: string;
  banned_reason?: string;
  ban_expires_at: string | null;
  ban_until?: string | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
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
