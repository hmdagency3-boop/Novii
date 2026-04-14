// Badge types and utilities
export type BadgeType = 'gold_early_member' | 'silver_early_member' | 'bronze_early_member' | 'beta_tester' | 'bug_hunter';

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  awarded_at: string;
  awarded_by?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export const BADGE_TITLES: Record<BadgeType, string> = {
  gold_early_member: 'Gold Early Member',
  silver_early_member: 'Silver Early Member',
  bronze_early_member: 'Bronze Early Member',
  beta_tester: 'Beta Tester',
  bug_hunter: 'Bug Hunter',
};

export const BADGE_DESCRIPTIONS: Record<BadgeType, string> = {
  gold_early_member: 'Gold tier early member of the platform',
  silver_early_member: 'Silver tier early member of the platform',
  bronze_early_member: 'Bronze tier early member of the platform',
  beta_tester: 'Participated in platform beta testing',
  bug_hunter: 'Found and reported platform bugs',
};

export const BADGE_COLORS: Record<BadgeType, string> = {
  gold_early_member: 'text-yellow-400',
  silver_early_member: 'text-slate-300',
  bronze_early_member: 'text-orange-600',
  beta_tester: 'text-purple-500',
  bug_hunter: 'text-green-500',
};
