import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserBadge, BadgeType } from '@/lib/badges';
import { toast } from 'sonner';

export function useBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ['badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserBadge[];
    },
    enabled: !!userId,
  });
}

export function useAwardBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, badgeType, reason }: { userId: string; badgeType: BadgeType; reason?: string }) => {
      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_type: badgeType,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserBadge;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['badges', userId] });
      toast.success('Badge awarded successfully');
    },
    onError: () => {
      toast.error('Failed to award badge');
    },
  });
}

export function useRemoveBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ badgeId, userId }: { badgeId: string; userId: string }) => {
      const { error } = await supabase
        .from('user_badges')
        .delete()
        .eq('id', badgeId);

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['badges', userId] });
      toast.success('Badge removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove badge');
    },
  });
}
