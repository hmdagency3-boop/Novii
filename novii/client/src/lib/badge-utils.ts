// Badge utility functions and types
import { supabase } from './supabase';

export type BadgeType = 'gold_early_member' | 'silver_early_member' | 'bronze_early_member' | 'beta_tester' | 'bug_hunter';

export interface BadgeInfo {
  type: BadgeType;
  columnName: string;
  dateColumnName: string;
  title: string;
  description: string;
  color: string;
}

export const BADGES_CONFIG: Record<BadgeType, BadgeInfo> = {
  gold_early_member: {
    type: 'gold_early_member',
    columnName: 'is_gold_early_member',
    dateColumnName: 'gold_early_member_at',
    title: 'Gold Early Member',
    description: 'Gold tier early member of the platform',
    color: 'text-yellow-400',
  },
  silver_early_member: {
    type: 'silver_early_member',
    columnName: 'is_silver_early_member',
    dateColumnName: 'silver_early_member_at',
    title: 'Silver Early Member',
    description: 'Silver tier early member of the platform',
    color: 'text-slate-300',
  },
  bronze_early_member: {
    type: 'bronze_early_member',
    columnName: 'is_bronze_early_member',
    dateColumnName: 'bronze_early_member_at',
    title: 'Bronze Early Member',
    description: 'Bronze tier early member of the platform',
    color: 'text-orange-600',
  },
  beta_tester: {
    type: 'beta_tester',
    columnName: 'is_beta_tester',
    dateColumnName: 'beta_tester_at',
    title: 'Beta Tester',
    description: 'Participated in platform beta testing',
    color: 'text-purple-500',
  },
  bug_hunter: {
    type: 'bug_hunter',
    columnName: 'is_bug_hunter',
    dateColumnName: 'bug_hunter_at',
    title: 'Bug Hunter',
    description: 'Found and reported platform bugs',
    color: 'text-green-500',
  },
};

// Award badge to user
export async function awardBadge(userId: string, badgeType: BadgeType) {
  const badgeInfo = BADGES_CONFIG[badgeType];
  if (!badgeInfo) throw new Error(`Invalid badge type: ${badgeType}`);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      [badgeInfo.columnName]: true,
      [badgeInfo.dateColumnName]: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Remove badge from user
export async function removeBadge(userId: string, badgeType: BadgeType) {
  const badgeInfo = BADGES_CONFIG[badgeType];
  if (!badgeInfo) throw new Error(`Invalid badge type: ${badgeType}`);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      [badgeInfo.columnName]: false,
      [badgeInfo.dateColumnName]: null,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user badges
export function getUserBadges(profile: any): BadgeType[] {
  const badges: BadgeType[] = [];
  
  if (profile?.is_gold_early_member) badges.push('gold_early_member');
  if (profile?.is_silver_early_member) badges.push('silver_early_member');
  if (profile?.is_bronze_early_member) badges.push('bronze_early_member');
  if (profile?.is_beta_tester) badges.push('beta_tester');
  if (profile?.is_bug_hunter) badges.push('bug_hunter');
  
  return badges;
}
