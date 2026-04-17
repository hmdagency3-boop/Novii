import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Profile, Post, Story, Message, Notification, Comment, Reel, UserDevice } from '@/lib/api';
import { useToast } from './use-toast';
import { useEffect, useState, useRef } from 'react';
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

const FEED_PAGE_SIZE = 10;

export function useInfiniteFeed(seed: number = 0) {
  return useInfiniteQuery({
    queryKey: ['feed-infinite', seed],
    queryFn: ({ pageParam }: { pageParam: number }) => {
      return api.getPersonalizedFeed(pageParam, FEED_PAGE_SIZE);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any[], allPages: any[][]) => {
      if (lastPage.length < FEED_PAGE_SIZE) return undefined;
      return allPages.length;
    },
    staleTime: 0,
    gcTime: 1000 * 30,
  });
}

export function useExplorePosts(limit = 30) {
  return useQuery({
    queryKey: ['explore', limit],
    queryFn: () => api.getPersonalizedExplore(limit),
    staleTime: 0,
    gcTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

export function useExploreReels(limit = 20) {
  return useQuery({
    queryKey: ['explore-reels', limit],
    queryFn: () => api.getPersonalizedExploreReels(limit),
    staleTime: 0,
    gcTime: 1000 * 30,
    refetchOnWindowFocus: true,
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

  const removePostFromCaches = (postId: string) => {
    const prefixes = [['feed'], ['posts'], ['profile'], ['explore'], ['reels'], ['user-posts'], ['saved-posts']];
    for (const prefix of prefixes) {
      const queries = queryClient.getQueriesData({ queryKey: prefix });
      for (const [key, data] of queries) {
        if (!data) continue;
        // Infinite query shape: { pages: [...] }
        if ((data as any).pages && Array.isArray((data as any).pages)) {
          const next = {
            ...(data as any),
            pages: (data as any).pages.map((page: any) => {
              if (Array.isArray(page)) return page.filter((p: any) => p?.id !== postId);
              if (Array.isArray(page?.posts)) return { ...page, posts: page.posts.filter((p: any) => p?.id !== postId) };
              if (Array.isArray(page?.items)) return { ...page, items: page.items.filter((p: any) => p?.id !== postId) };
              return page;
            }),
          };
          queryClient.setQueryData(key, next);
          continue;
        }
        // Plain array
        if (Array.isArray(data)) {
          queryClient.setQueryData(key, (data as any[]).filter((p: any) => p?.id !== postId));
          continue;
        }
        // Object with posts/items
        if (Array.isArray((data as any).posts)) {
          queryClient.setQueryData(key, { ...(data as any), posts: (data as any).posts.filter((p: any) => p?.id !== postId) });
        } else if (Array.isArray((data as any).items)) {
          queryClient.setQueryData(key, { ...(data as any), items: (data as any).items.filter((p: any) => p?.id !== postId) });
        }
      }
    }
  };

  return useMutation({
    mutationFn: (postId: string) => api.deletePost(postId),
    onMutate: async (postId: string) => {
      // Optimistically remove the post from every cached list right away
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      removePostFromCaches(postId);
    },
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
      // Revert by refetching so the removed post reappears if delete actually failed
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف المنشور',
      });
    },
  });
}

export function useDeleteReel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (reelId: string) => api.deleteReel(reelId),
    onSuccess: (_data, reelId) => {
      queryClient.setQueriesData({ queryKey: ['reels-infinite'] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) => page.filter((r: any) => r.id !== reelId)),
        };
      });
      queryClient.setQueriesData({ queryKey: ['userReels'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.filter((r: any) => r.id !== reelId);
        if (old?.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any[]) => page.filter((r: any) => r.id !== reelId)),
          };
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['reels-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['userReels'] });
      queryClient.invalidateQueries({ queryKey: ['explore-reels'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'تم الحذف', description: 'تم حذف الريلز بنجاح' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الريلز' });
    },
  });
}

// Like hooks
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.toggleLike(postId),
    onMutate: async (postId) => {
      const updatePost = (post: Post) =>
        post.id === postId
          ? {
              ...post,
              is_liked: !post.is_liked,
              likes_count: post.is_liked
                ? Math.max(0, (post.likes_count ?? 0) - 1)
                : (post.likes_count ?? 0) + 1,
            }
          : post;

      // ── Infinite feed (primary feed source) ──
      queryClient.setQueriesData({ queryKey: ['feed-infinite'] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: Post[]) =>
            Array.isArray(page) ? page.map(updatePost) : page
          ),
        };
      });

      // ── Flat feed (legacy / profile posts) ──
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updatePost) : old;
      });

      // ── Individual post ──
      queryClient.setQueriesData({ queryKey: ['post'] }, (old: any) => {
        if (!old) return old;
        return old.id === postId ? updatePost(old) : old;
      });

      // ── Explore posts ──
      queryClient.setQueriesData({ queryKey: ['explore'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updatePost) : old;
      });

      // ── User posts ──
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updatePost) : old;
      });

      // ── Hashtag posts ──
      queryClient.setQueriesData({ queryKey: ['hashtag-posts'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updatePost) : old;
      });
    },
    onSuccess: (_, postId) => {
      queryClient.refetchQueries({ queryKey: ['post', postId] });
    },
    onError: (error: any) => {
      console.error('Like toggle error:', error);
      queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-posts'] });
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

      queryClient.setQueriesData({ queryKey: ['userReels'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updateReel) : old;
      });
      queryClient.setQueriesData({ queryKey: ['reel', reelId] }, (old: any) =>
        old ? updateReel(old) : old
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userReels'] });
    },
    onError: (error: any) => {
      console.error('Reel like toggle error:', error);
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

  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!postId || !userId) return;

    const channel = supabase.channel(`typing:${postId}`);
    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Array<any>>;
      const typing: Record<string, { username: string; avatar_url?: string; timestamp: number }> = {};
      
      Object.entries(state).forEach(([, users]) => {
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
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [postId, userId]);

  const startTyping = async () => {
    if (!channelRef.current) return;
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    channelRef.current.track({
      user_id: userId,
      username: currentProfile?.username || 'User',
      avatar_url: currentProfile?.avatar_url,
      typing: true,
      timestamp: Date.now()
    });
  };

  const stopTyping = () => {
    if (!channelRef.current) return;
    channelRef.current.track({
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
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
}

export function useUserStories(userId: string, profileForInjection?: any) {
  return useQuery({
    queryKey: ['userStories', userId],
    queryFn: async () => {
      if (profileForInjection) {
        const { data, error } = await supabase
          .from('stories')
          .select('id, user_id, media_url, media_type, views_count, expires_at, created_at, music_url, music_title, music_artist, music_artwork_url, filter_name')
          .eq('user_id', userId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map((s: any) => ({ ...s, profile: profileForInjection }));
      }
      return api.getUserStories(userId);
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}

export function useHasUserStories(userId: string) {
  return useQuery({
    queryKey: ['hasUserStories', userId],
    queryFn: async () => {
      if (!userId) return false;
      const { count } = await supabase
        .from('stories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString());
      return (count || 0) > 0;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
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
    onSuccess: (newStory) => {
      if (currentProfile?.id) {
        queryClient.setQueryData(['userStories', currentProfile.id], (old: any[] = []) => {
          const exists = old.some((s: any) => s.id === (newStory as any)?.id);
          return exists ? old : [newStory, ...old];
        });
      }

      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.refetchQueries({ queryKey: ['stories'] });

      if (currentProfile?.id) {
        queryClient.invalidateQueries({ queryKey: ['userStories', currentProfile.id] });
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
      const updatePost = (post: Post) =>
        post.id === postId ? { ...post, is_saved: !post.is_saved } : post;

      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updatePost) : old;
      });

      queryClient.setQueriesData({ queryKey: ['feed-infinite'] }, (old: any) => {
        if (!old?.pages) return old;
        return { ...old, pages: old.pages.map((page: Post[]) => Array.isArray(page) ? page.map(updatePost) : page) };
      });

      queryClient.setQueriesData({ queryKey: ['hashtag-posts'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updatePost) : old;
      });

      queryClient.setQueriesData({ queryKey: ['explore'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updatePost) : old;
      });

      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(updatePost) : old;
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-posts'] });
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
    onSettled: () => {
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

export function useSavedReels() {
  return useQuery({
    queryKey: ['saved-reels'],
    queryFn: () => api.getSavedReels(),
  });
}

export function useToggleSaveReel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reelId: string) => api.toggleSaveReel(reelId),
    onMutate: async (reelId) => {
      const updateReel = (r: any) => {
        if (r?.id !== reelId) return r;
        const wasSaved = !!r.is_saved;
        return {
          ...r,
          is_saved: !wasSaved,
          saves_count: Math.max(0, (r.saves_count ?? 0) + (wasSaved ? -1 : 1)),
        };
      };

      const patch = (old: any) => {
        if (!old) return old;
        if (old.pages) {
          return { ...old, pages: old.pages.map((p: any[]) => Array.isArray(p) ? p.map(updateReel) : p) };
        }
        return Array.isArray(old) ? old.map(updateReel) : old;
      };
      queryClient.setQueriesData({ queryKey: ['reels'] }, patch);
      queryClient.setQueriesData({ queryKey: ['reels-infinite'] }, patch);
      queryClient.setQueriesData({ queryKey: ['explore-reels'] }, patch);
      queryClient.setQueriesData({ queryKey: ['userReels'] }, patch);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['reels-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['explore-reels'] });
      queryClient.invalidateQueries({ queryKey: ['saved-reels'] });
      queryClient.invalidateQueries({ queryKey: ['savedReels'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reels'] });
      queryClient.invalidateQueries({ queryKey: ['savedReels'] });
    },
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

const REELS_PAGE_SIZE = 5;

export function useInfiniteReels() {
  return useInfiniteQuery({
    queryKey: ['reels-infinite'],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      api.getReels(REELS_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any[], allPages: any[][]) => {
      if (lastPage.length < REELS_PAGE_SIZE) return undefined;
      return allPages.length * REELS_PAGE_SIZE;
    },
    staleTime: 1000 * 60 * 2,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.trackDevice(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
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

export function useTrustDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, trusted }: { deviceId: string; trusted: boolean }) =>
      api.trustDevice(deviceId, trusted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useRevokeAllDevices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, exceptDeviceId }: { userId: string; exceptDeviceId?: string }) =>
      api.revokeAllDevices(userId, exceptDeviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useDeviceHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      api.sendHeartbeat().catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [enabled]);
}

export function useCurrentDeviceInfo() {
  return useQuery({
    queryKey: ['device', 'current'],
    queryFn: () => api.getCurrentDeviceInfo(),
  });
}
