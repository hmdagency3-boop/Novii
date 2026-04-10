import Layout from "@/components/layout";
import { Heart, MessageCircle, UserPlus, Loader2, Bell, Trash2, Filter, CheckCheck, RefreshCw, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { Link } from "wouter";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useIsFollowing, useToggleFollow } from "@/hooks/use-data";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Notifications() {
  const { language } = useLanguage();
  const isRTL = language.code === 'ar';
  const t = getTranslation(language.code).notifications;
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'like' | 'comment' | 'follow' | 'mention' | 'follow_request'>('all');
  
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    await refetch();
  };

  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh(handleRefresh);

  const handleNotificationClick = (notificationId: string, isRead: boolean, postId: string, commentId?: string) => {
    if (!isRead) {
      markAsRead.mutate(notificationId);
    }
    // المتابعة للمنشور سيتم من خلال الرابط
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedFilter === 'all') return true;
    return n.type === selectedFilter;
  });

  const unreadNotifications = filteredNotifications.filter(n => !n.is_read);
  const readNotifications = filteredNotifications.filter(n => n.is_read);

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div 
        ref={containerRef}
        className={cn("w-full min-h-screen bg-background overflow-y-auto relative", isRTL && "rtl")}
        style={{ height: '100vh' }}
      >
        {/* Pull to Refresh Indicator */}
        <div 
          className={cn(
            "fixed top-0 left-0 right-0 flex items-center justify-center transition-all duration-300 z-50",
            pullDistance > 0 && "bg-gradient-to-b from-primary/10 to-transparent"
          )}
          style={{
            height: `${Math.min(pullDistance, 100)}px`,
            opacity: pullDistance / 100,
          }}
        >
          <div
            className={cn(
              "transition-transform duration-300",
              pullDistance > 50 && "rotate-180",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2.5">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                      {isRTL 
                        ? `${unreadNotifications.length} إشعار${unreadNotifications.length > 0 ? ' جديد' : 's'}` 
                        : `${unreadNotifications.length} new notification${unreadNotifications.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                
                {(unreadNotifications.length > 0 || notifications.length > 0) && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className={cn("gap-2", isRefreshing && "opacity-70")}
                    >
                      <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                      <span className="hidden md:inline">{language.code === 'ar' ? 'تحديث' : 'Refresh'}</span>
                    </Button>
                    {unreadNotifications.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => markAllAsRead.mutate()}
                        className="gap-2"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span className="hidden md:inline">{t.read_all}</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 -mx-4 md:-mx-6 px-4 md:px-6 pb-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    selectedFilter === 'all'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  {t.filter_all}
                </button>
                <button
                  onClick={() => setSelectedFilter('like')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1",
                    selectedFilter === 'like'
                      ? "bg-red-500/20 text-red-600 dark:text-red-400"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  <Heart className="w-4 h-4" /> {t.filter_likes}
                </button>
                <button
                  onClick={() => setSelectedFilter('comment')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1",
                    selectedFilter === 'comment'
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  <MessageCircle className="w-4 h-4" /> {t.filter_comments}
                </button>
                <button
                  onClick={() => setSelectedFilter('follow')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1",
                    selectedFilter === 'follow'
                      ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  <UserPlus className="w-4 h-4" /> {t.filter_follows}
                </button>
                <button
                  onClick={() => setSelectedFilter('mention')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1",
                    selectedFilter === 'mention'
                      ? "bg-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  <MessageCircle className="w-4 h-4" /> {t.filter_mentions}
                </button>
                <button
                  onClick={() => setSelectedFilter('follow_request')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1",
                    selectedFilter === 'follow_request'
                      ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  <UserPlus className="w-4 h-4" /> {isRTL ? 'طلبات' : 'Requests'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-primary/5 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Bell className="w-12 h-12 text-primary/40" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-2">
                {t.no_notifications}
              </p>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {t.no_notifications_desc}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <h2 className="font-bold text-sm uppercase tracking-wide text-primary">
                      {t.unread}
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {unreadNotifications.map((notif) => {
                      const queryParam = notif.comment_id ? `?commentId=${notif.comment_id}` : '';
                      return notif.post_id ? (
                        <Link 
                          key={notif.id} 
                          href={`/post/${notif.post_id}${queryParam}`}
                          onClick={() => handleNotificationClick(notif.id, notif.is_read, notif.post_id || '', notif.comment_id || undefined)}
                        >
                          <NotificationItem 
                            notif={notif} 
                            t={t} 
                            language={language.code}
                            isRTL={isRTL}
                            actorId={notif.actor?.id}
                          />
                        </Link>
                      ) : (
                        <NotificationItem 
                          key={notif.id}
                          notif={notif} 
                          t={t} 
                          language={language.code}
                          isRTL={isRTL}
                          actorId={notif.actor?.id}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Divider */}
              {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/30" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-3 text-muted-foreground">
                      {t.earlier}
                    </span>
                  </div>
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div className="space-y-2">
                  <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                    📋 {isRTL ? 'الأرشيف' : 'Archive'}
                  </h2>
                  <div className="space-y-2">
                    {readNotifications.map((notif) => {
                      const queryParam = notif.comment_id ? `?commentId=${notif.comment_id}` : '';
                      return notif.post_id ? (
                        <Link 
                          key={notif.id} 
                          href={`/post/${notif.post_id}${queryParam}`}
                        >
                          <NotificationItem 
                            notif={notif} 
                            t={t} 
                            language={language.code}
                            isRTL={isRTL}
                            actorId={notif.actor?.id}
                          />
                        </Link>
                      ) : (
                        <NotificationItem 
                          key={notif.id}
                          notif={notif} 
                          t={t} 
                          language={language.code}
                          isRTL={isRTL}
                          actorId={notif.actor?.id}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function NotificationItem({ 
  notif, 
  t, 
  language, 
  isRTL,
  actorId
}: { 
  notif: any; 
  t: any; 
  language: string;
  isRTL: boolean;
  actorId?: string;
}) {
  const actor = notif.actor;
  const timeAgo = formatDistanceToNow(new Date(notif.created_at), { 
    addSuffix: true, 
    locale: language === 'ar' ? ar : undefined 
  });
  
  // Check if current user is following the actor (only if actorId exists)
  const { data: isFollowing = false } = useIsFollowing(actorId || '');
  const toggleFollow = useToggleFollow();
  
  // Show follow button only if: 1) is a follow notification, 2) we have actorId, 3) not already following
  const shouldShowFollowButton = notif.type === 'follow' && actorId && !isFollowing;
  
  // Follow request handling
  const queryClient = useQueryClient();
  
  const approveMutation = useMutation({
    mutationFn: () => api.approveFollowRequest(actorId || ''),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تمت الموافقة على الطلب' : 'Follow request approved');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('Approve error:', error);
      toast.error(language === 'ar' ? 'فشل الموافقة' : 'Failed to approve');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.rejectFollowRequest(actorId || ''),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم رفض الطلب' : 'Follow request rejected');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('Reject error:', error);
      toast.error(language === 'ar' ? 'فشل الرفض' : 'Failed to reject');
    }
  });

  const getNotificationIcon = (type: string) => {
    const iconProps = "w-5 h-5 text-white fill-white";
    switch (type) {
      case 'like':
        return <Heart className={iconProps} />;
      case 'comment':
        return <MessageCircle className={iconProps} />;
      case 'follow':
        return <UserPlus className={iconProps} />;
      case 'follow_request':
        return <UserPlus className={iconProps} />;
      case 'mention':
        return <MessageCircle className={iconProps} />;
      default:
        return <Bell className={iconProps} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-red-500';
      case 'comment':
        return 'bg-blue-500';
      case 'follow':
        return 'bg-purple-500';
      case 'follow_request':
        return 'bg-orange-500';
      case 'mention':
        return 'bg-green-500';
      default:
        return 'bg-primary';
    }
  };

  const getNotificationContent = () => {
    switch (notif.type) {
      case 'like':
        return language === 'ar' ? 'أعجب بمنشورك' : 'liked your post';
      case 'comment':
        return language === 'ar' ? 'علق على منشورك' : 'commented on your post';
      case 'follow':
        return language === 'ar' ? 'بدأ في متابعتك' : 'started following you';
      case 'follow_request':
        return language === 'ar' ? 'طلب متابعتك' : 'sent you a follow request';
      case 'mention':
        return language === 'ar' ? 'ذكرك في تعليق' : 'mentioned you in a comment';
      default:
        return notif.content || '';
    }
  };

  return (
    <div 
      className={cn(
        "group relative flex items-center justify-between p-3 md:p-4 rounded-2xl transition-all duration-300",
        "hover:shadow-md hover:scale-[1.01]",
        !notif.is_read && "bg-primary/8 border border-primary/20 hover:bg-primary/12",
        notif.is_read && "bg-muted/40 border border-transparent hover:bg-muted/60 hover:border-border/50"
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        {/* Unread indicator */}
        {!notif.is_read && (
          <div className="flex-shrink-0 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
        )}
        
        {/* Avatar with Icon */}
        <Link href={`/user?id=${actor?.id}`} className="relative flex-shrink-0 hover:opacity-80 transition-opacity group/avatar">
          <Avatar className="w-12 h-12 md:w-14 md:h-14 border-2 border-background ring-2 ring-primary/10 group-hover/avatar:ring-primary/30 transition-all">
            <AvatarImage src={actor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${actor?.username}`} />
            <AvatarFallback>{actor?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute -bottom-1.5 -right-1.5 rounded-full p-1.5 border-2 border-background shadow-sm",
            getNotificationColor(notif.type)
          )}>
            {getNotificationIcon(notif.type)}
          </div>
        </Link>

        {/* Content */}
        <div className={cn("flex-1 min-w-0 pr-2", isRTL && "text-right")}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <Link href={`/user?id=${actor?.id}`} className="font-bold text-sm md:text-base hover:text-primary transition-colors truncate">
                {actor?.username || (language === 'ar' ? 'مستخدم' : 'User')}
              </Link>
              <span className="text-foreground/70 text-sm md:text-base leading-tight flex-shrink-0">
                {getNotificationContent()}
              </span>
            </div>
            <span className="text-xs md:text-sm text-muted-foreground">
              {timeAgo}
            </span>
            {notif.type === 'comment' && notif.content && (
              <p className="text-xs md:text-sm text-muted-foreground mt-1 italic line-clamp-2 opacity-75">
                "{notif.content.substring(0, 80)}{notif.content.length > 80 ? '...' : ''}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3 ml-3 md:ml-4 flex-shrink-0">
        {notif.type === 'follow_request' && actorId && (
          <div className="flex gap-1">
            <Button 
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                approveMutation.mutate();
              }}
              disabled={approveMutation.isPending}
              className="h-7 px-2 text-xs rounded-md bg-green-500 hover:bg-green-600"
            >
              {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </Button>
            <Button 
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                rejectMutation.mutate();
              }}
              disabled={rejectMutation.isPending}
              variant="destructive"
              className="h-7 px-2 text-xs rounded-md"
            >
              {rejectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            </Button>
          </div>
        )}
        {shouldShowFollowButton && (
          <Button 
            size="sm" 
            className="h-8 px-3 text-xs font-bold"
            onClick={(e) => {
              e.stopPropagation();
              if (actorId) {
                toggleFollow.mutate(actorId);
              }
            }}
            disabled={toggleFollow.isPending}
          >
            {toggleFollow.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              language === 'ar' ? 'متابعة' : 'Follow Back'
            )}
          </Button>
        )}
        {!shouldShowFollowButton && notif.post_id && notif.type !== 'follow_request' ? (
          <Link href={`/post/${notif.post_id}`} className="block">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg overflow-hidden flex-shrink-0 hover:shadow-lg hover:scale-105 transition-all cursor-pointer" />
          </Link>
        ) : null}
        
        {!notif.is_read && notif.type !== 'follow_request' && (
          <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0 shadow-lg" />
        )}
      </div>
    </div>
  );
}
