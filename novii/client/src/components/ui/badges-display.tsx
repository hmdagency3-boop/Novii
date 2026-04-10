import { GoldMemberBadge } from './gold-member-badge';
import { SilverMemberBadge } from './silver-member-badge';
import { BronzeMemberBadge } from './bronze-member-badge';
import { BetaTesterBadge } from './beta-tester-badge';
import { BadgeType } from '@/lib/badges';
import { cn } from '@/lib/utils';

interface UserBadgesDisplayProps {
  badges: string[]; // array of badge types
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function BadgesDisplay({ 
  badges, 
  size = 'md', 
  showText = false,
  className 
}: UserBadgesDisplayProps) {
  if (!badges || badges.length === 0) return null;

  const badgeComponents: Record<BadgeType, React.ComponentType<any>> = {
    gold_early_member: GoldMemberBadge,
    silver_early_member: SilverMemberBadge,
    bronze_early_member: BronzeMemberBadge,
    beta_tester: BetaTesterBadge,
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {badges.map((badgeType) => {
        const BadgeComponent = badgeComponents[badgeType as BadgeType];
        if (!BadgeComponent) return null;
        return <BadgeComponent key={badgeType} size={size} showText={showText} />;
      })}
    </div>
  );
}
