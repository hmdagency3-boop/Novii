import { useMutation, useQueryClient } from '@tanstack/react-query';
import { awardBadge, removeBadge, BadgeType } from '@/lib/badge-utils';
import { toast } from 'sonner';

export function useAwardBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, badgeType }: { userId: string; badgeType: BadgeType }) => {
      return await awardBadge(userId, badgeType);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('ميدالية تم منحها بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'فشل منح الميدالية');
    },
  });
}

export function useRemoveBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, badgeType }: { userId: string; badgeType: BadgeType }) => {
      return await removeBadge(userId, badgeType);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('تم إزالة الميدالية بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'فشل إزالة الميدالية');
    },
  });
}
