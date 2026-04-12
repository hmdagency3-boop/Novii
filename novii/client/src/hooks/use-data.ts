import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Profile, Post, Story, Message, Notification, Comment, Reel, UserDevice } from '@/lib/api';
import { useToast } from './use-toast';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Profile hooks
export function useCurrentProfile() {
  return useQuery({
    queryKey: ['profile', 'current'],
    queryFn: () => api.getCurrentProfile(),
    refetchInterval: false, // تحديث فوري عند الحاجة فقط
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['profile', 'current'],
    queryFn: () => api.getCurrentProfile(),
    refetchInterval: false, // تحديث فوري عند الحاجة فقط
  });
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.getProfile(username),
    enabled: !!username,
    refetchInterval: false, // تحديث فوري عند الحاجة فقط
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (updates: Partial<Profile>) => api.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الملف الشخصي بنجاح',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تحديث الملف الشخصي',
      });
    },
  });
}

// Feed hooks
export function useFeed(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['feed', limit, offset],
    queryFn: () => api.getFeed(limit, offset),
  });
}

export function useExplorePosts(limit = 30) {
  return useQuery({
    queryKey: ['explore', limit],
    queryFn: () => api.getExplorePosts(limit),
  });
}

export function useUserPosts(userId: string) {
  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: () => api.getUserPosts(userId),
    enabled: !!userId,
  });
}

export function useUserStatistics() {
  return useQuery({
    queryKey: ['statistics', 'user'],
    queryFn: () => api.getUserStatistics(),
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.getPost(postId),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ caption, imageUrl, location }: { caption: string; imageUrl: string; location?: string }) =>
      api.createPost(caption, imageUrl, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'تم النشر',
        description: 'تم نشر المنشور بنجاح',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل نشر المنشور',
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (postId: string) => api.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنشور بنجاح',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف المنشور',
      });
    },
  });
}

// Like hooks
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.toggleLike(postId),
    onMutate: async (postId) => {
      // Update UI immediately with optimistic like state toggle
      const updatePost = (post: Post) => ({
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.is_liked
          ? Math.max(0, (post.likes_count ?? 0) - 1)
          : (post.likes_count ?? 0) + 1,
      });

      // Update feed queries
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) 
          ? old.map((post: Post) => post.id === postId ? updatePost(post) : post)
          : old;
      });

      // Update individual post
      queryClient.setQueriesData({ queryKey: ['post'] }, (old: any) => {
        if (!old) return old;
        if (old.id === postId) {
          return updatePost(old);
        }
        return old;
      });

      // Update explore queries
      queryClient.setQueriesData({ queryKey: ['explore'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old)
          ? old.map((post: Post) => post.id === postId ? updatePost(post) : post)
          : old;
      });
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      queryClient.refetchQueries({ queryKey: ['post', postId] });
    },
    onError: (error: any) => {
      console.error('Like toggle error:', error);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
    },
  });
}

export function useToggleReelLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reelId: string) => api.toggleReelLike(reelId),
    onMutate: async (reelId) => {
      const updateReel = (reel: any) =>
        reel.id === reelId
          ? {
              ...reel,
              is_liked: !reel.is_liked,
              likes_count: reel.is_liked
                ? Math.max(0, reel.likes_count - 1)
                : reel.likes_count + 1,
            }
          : reel;

      const applyUpdate = (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updateReel) : old;
      };

      // Update the main reels feed (useReels uses ['reels', limit, offset])
      queryClient.setQueriesData({ queryKey: ['reels'] }, applyUpdate);
      // Update profile reels
      queryClient.setQueriesData({ queryKey: ['userReels'] }, applyUpdate);
      // Update single reel
      queryClient.setQueriesData({ queryKey: ['reel', reelId] }, (old: any) =>
        old ? updateReel(old) : old
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['userReels'] });
    },
    onError: (error: any) => {
      console.error('Reel like toggle error:', error);
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['userReels'] });
      queryClient.invalidateQueries({ queryKey: ['reel'] });
    },
  });
}

// Comment hooks
export function useComments(postId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.getComments(postId),
    enabled: !!postId,
  });

  // Single realtime channel for all comment changes
  useEffect(() => {
    if (!postId) return;

    const subscription = supabase
      .channel(`comments:${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [postId, queryClient]);

  return query;
}

// Typing indicator hook
export function useTypingIndicator(postId: string, userId: string) {
  const [typingUsers, setTypingUsers] = useState<Record<string, { username: string; avatar_url?: string; timestamp: number }>>({});

  useEffect(() => {
    if (!postId || !userId) return;

    console.log('🎹 Setting up typing indicator subscription for post:', postId);

    const channel = supabase.channel(`typing:${postId}`);

    // Subscribe to typing events
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Array<any>>;
      const typing: Record<string, { username: string; avatar_url?: string; timestamp: number }> = {};
      
      Object.entries(state).forEach(([key, users]) => {
        users.forEach((user: any) => {
          if (user.typing && user.user_id !== userId) {
            typing[user.user_id] = {
              username: user.username,
              avatar_url: user.avatar_url,
              timestamp: Date.now()
            };
          }
        });
      });

      setTypingUsers(typing);
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Typing indicator subscribed');
      }
    });

    return () => {
      console.log('🔌 Cleaning up typing indicator for post:', postId);
      channel.unsubscribe();
    };
  }, [postId, userId]);

  const startTyping = async () => {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    supabase.channel(`typing:${postId}`).track({
      user_id: userId,
      username: currentProfile?.username || 'User',
      avatar_url: currentProfile?.avatar_url,
      typing: true,
      timestamp: Date.now()
    });
  };

  const stopTyping = () => {
    supabase.channel(`typing:${postId}`).track({
      user_id: userId,
      typing: false,
      timestamp: Date.now()
    });
  };

  return { typingUsers, startTyping, stopTyping };
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ postId, content, parentCommentId, gifUrl }: { postId: string; content: string; parentCommentId?: string; gifUrl?: string }) =>
      api.createComment(postId, content, parentCommentId, gifUrl),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.refetchQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('Comment creation error:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error?.message || 'فشل إضافة التعليق',
      });
    },
  });
}

export function useToggleCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => api.toggleCommentLike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (commentId: string) => api.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      toast({
        title: 'تم',
        description: 'تم حذف التعليق بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل حذف التعليق',
      });
    },
  });
}

// Stories hooks
export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: () => api.getStories(),
    staleTime: 3 * 60 * 1000,      // treat as fresh for 3 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}

export function useUserStories(userId: string) {
  return useQuery({
    queryKey: ['userStories', userId],
    queryFn: () => api.getUserStories(userId),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: currentProfile } = useCurrentProfile();

  return useMutation({
    mutationFn: ({ mediaUrl, mediaType, music, filterName }: {
      mediaUrl: string;
      mediaType: 'image' | 'video';
      trimStart?: number;
      trimEnd?: number;
      music?: { url: string; title: string; artist: string; artwork_url: string };
      filterName?: string;
    }) =>
      api.createStory(mediaUrl, mediaType, music, filterName),
    onSuccess: () => {
      // Immediately refetch stories for real-time updates
      queryClient.refetchQueries({ queryKey: ['stories'], type: 'active' });
      
      // Refetch user's own stories
      if (currentProfile?.id) {
        queryClient.refetchQueries({ queryKey: ['userStories', currentProfile.id], type: 'active' });
      }
      
      toast({
        title: 'تم النشر',
        description: 'تم نشر القصة بنجاح',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل نشر القصة',
      });
    },
  });
}

// Follow hooks
type ToggleFollowArgs = {
  targetUserId: string;
  isPrivate?: boolean;
  hasPending?: boolean;
  isFollowingNow?: boolean;
};

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetUserId }: ToggleFollowArgs) => api.toggleFollow(targetUserId),
    onMutate: async ({ targetUserId, isPrivate, hasPending, isFollowingNow }) => {
      await queryClient.cancelQueries({ queryKey: ['isFollowing', targetUserId] });
      await queryClient.cancelQueries({ queryKey: ['hasFollowRequest', targetUserId] });

      const prevIsFollowing = queryClient.getQueryData(['isFollowing', targetUserId]) as boolean | undefined;
      const prevHasRequest  = queryClient.getQueryData(['hasFollowRequest', targetUserId]) as boolean | undefined;
      const prevCurrentProfile = queryClient.getQueryData(['profile', 'current']) as any;
      const prevTargetProfile  = queryClient.getQueryData(['profile', targetUserId]) as any;

      // Use passed-in state or fall back to cached values
      const currentlyFollowing = isFollowingNow ?? prevIsFollowing ?? false;
      const currentlyPending   = hasPending ?? prevHasRequest ?? false;

      if (currentlyFollowing) {
        // ── Unfollow: instant UI update ──
        queryClient.setQueryData(['isFollowing', targetUserId], false);
        if (prevCurrentProfile) {
          queryClient.setQueryData(['profile', 'current'], { ...prevCurrentProfile, following_count: Math.max(0, (prevCurrentProfile.following_count || 1) - 1) });
        }
        if (prevTargetProfile) {
          queryClient.setQueryData(['profile', targetUserId], { ...prevTargetProfile, followers_count: Math.max(0, (prevTargetProfile.followers_count || 1) - 1) });
        }
      } else if (currentlyPending) {
        // ── Cancel pending request: instant UI update ──
        queryClient.setQueryData(['hasFollowRequest', targetUserId], false);
      } else if (isPrivate) {
        // ── Send follow request to private account: instant UI update ──
        queryClient.setQueryData(['hasFollowRequest', targetUserId], true);
      } else {
        // ── Follow public account: instant UI update ──
        queryClient.setQueryData(['isFollowing', targetUserId], true);
        if (prevCurrentProfile) {
          queryClient.setQueryData(['profile', 'current'], { ...prevCurrentProfile, following_count: (prevCurrentProfile.following_count || 0) + 1 });
        }
        if (prevTargetProfile) {
          queryClient.setQueryData(['profile', targetUserId], { ...prevTargetProfile, followers_count: (prevTargetProfile.followers_count || 0) + 1 });
        }
      }

      return { prevIsFollowing, prevHasRequest, prevCurrentProfile, prevTargetProfile };
    },
    onError: (_err, { targetUserId }, context) => {
      if (context) {
        queryClient.setQueryData(['isFollowing', targetUserId], context.prevIsFollowing);
        queryClient.setQueryData(['hasFollowRequest', targetUserId], context.prevHasRequest);
        queryClient.setQueryData(['profile', 'current'], context.prevCurrentProfile);
        queryClient.setQueryData(['profile', targetUserId], context.prevTargetProfile);
      }
    },
    onSuccess: (result, { targetUserId }) => {
      // Sync final truth from server
      if (result.isPending) {
        queryClient.setQueryData(['hasFollowRequest', targetUserId], true);
        queryClient.setQueryData(['isFollowing', targetUserId], false);
      } else if (result.wasCancelled) {
        queryClient.setQueryData(['hasFollowRequest', targetUserId], false);
        queryClient.setQueryData(['isFollowing', targetUserId], false);
      } else if (result.isFollowing) {
        queryClient.setQueryData(['isFollowing', targetUserId], true);
        queryClient.setQueryData(['hasFollowRequest', targetUserId], false);
      } else {
        queryClient.setQueryData(['isFollowing', targetUserId], false);
      }

      // Refresh related queries (background)
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['hasFollowRequest', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useIsFollowing(targetUserId: string) {
  return useQuery({
    queryKey: ['following', targetUserId],
    queryFn: () => api.isFollowing(targetUserId),
    enabled: !!targetUserId,
  });
}

// Messages hooks
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
  });
}

export function useMessages(userId: string) {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: () => api.getMessages(userId),
    enabled: !!userId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: string; content: string }) =>
      api.sendMessage(receiverId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Notifications hooks
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => api.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.markAllMessageNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Followers and Following hooks
export function useFollowers(userId: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => api.getFollowers(userId),
    enabled: !!userId,
  });
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => api.getFollowing(userId),
    enabled: !!userId,
  });
}

// Saved Posts hooks
export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.toggleSave(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      
      const previousData = queryClient.getQueryData(['feed']);
      
      queryClient.setQueryData(['feed'], (old: any) => {
        if (!old) return old;
        return old.map((post: Post) => {
          if (post.id === postId) {
            return {
              ...post,
              is_saved: !post.is_saved,
            };
          }
          return post;
        });
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['feed'], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}

export function useSavedPosts() {
  return useQuery({
    queryKey: ['saved'],
    queryFn: () => api.getSavedPosts(),
  });
}

// Post Settings hooks
export function useTogglePinPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.togglePinPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      console.error('Pin toggle error:', error);
    },
  });
}

export function useToggleHideLikes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.toggleHideLikes(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      console.error('Hide likes toggle error:', error);
    },
  });
}

export function useToggleRepliesDisabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.toggleRepliesDisabled(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      console.error('Replies disabled toggle error:', error);
    },
  });
}

export function useRecordPostView() {
  return useMutation({
    mutationFn: (postId: string) => api.recordPostView(postId),
    onError: (error: any) => {
      console.log('View recording skipped:', error);
    },
  });
}

export function usePostInsights(postId: string) {
  return useQuery({
    queryKey: ['insights', postId],
    queryFn: () => api.getPostInsights(postId),
    enabled: !!postId,
  });
}

// Reels hooks
export function useReels(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['reels', limit, offset],
    queryFn: () => api.getReels(limit, offset),
  });
}

// Suggestions
export function useSuggestedUsers(limit = 5) {
  return useQuery({
    queryKey: ['suggestions', limit],
    queryFn: () => api.getSuggestedUsers(limit),
  });
}

// Device Tracking hooks
export function useTrackDevice() {
  return useMutation({
    mutationFn: (userId: string) => api.trackDevice(userId),
    onError: (error: any) => {
      console.error('Device tracking error:', error);
    },
  });
}

export function useUserDevices(userId: string) {
  return useQuery({
    queryKey: ['devices', userId],
    queryFn: () => api.getUserDevices(userId),
    enabled: !!userId,
  });
}

export function useRemoveDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => api.removeDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (error: any) => {
      console.error('Remove device error:', error);
    },
  });
}

export function useCurrentDeviceInfo() {
  return useQuery({
    queryKey: ['device', 'current'],
    queryFn: () => api.getCurrentDeviceInfo(),
  });
}
