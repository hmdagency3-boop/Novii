import Layout from "@/components/layout";
import {
  Heart, MessageCircle, UserPlus, Loader2, Bell,
  CheckCheck, RefreshCw, Check, X, AtSign, Film,
  BookmarkIcon, Repeat2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { Link } from "wouter";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useIsFollowing, useToggleFollow } from "@/hooks/use-data";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow, isToday, isThisWeek, isThisMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

type FilterType = 'all' | 'like' | 'comment' | 'follow' | 'follow_request' | 'mention';

const FILTERS: { key: FilterType; labelAr: string; labelEn: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all',            labelAr: 'الكل',       labelEn: 'All',      icon: <Bell className="w-3.5 h-3.5" />,          color: 'bg-foreground text-background' },
  { key: 'like',           labelAr: 'إعجابات',    labelEn: 'Likes',    icon: <Heart className="w-3.5 h-3.5" />,         color: 'bg-red-500 text-white' },
  { key: 'comment',        labelAr: 'تعليقات',    labelEn: 'Comments', icon: <MessageCircle className="w-3.5 h-3.5" />, color: 'bg-blue-500 text-white' },
  { key: 'follow',         labelAr: 'متابعون',    labelEn: 'Follows',  icon: <UserPlus className="w-3.5 h-3.5" />,      color: 'bg-purple-500 text-white' },
  { key: 'follow_request', labelAr: 'طلبات',      labelEn: 'Requests', icon: <UserPlus className="w-3.5 h-3.5" />,      color: 'bg-orange-500 text-white' },
  { key: 'mention',        labelAr: 'إشارات',     labelEn: 'Mentions', icon: <AtSign className="w-3.5 h-3.5" />,        color: 'bg-green-500 text-white' },
];

function getGroupLabel(date: Date, isAr: boolean) {
  if (isToday(date))          return isAr ? 'اليوم'       : 'Today';
  if (isThisWeek(date))       return isAr ? 'هذا الأسبوع' : 'This week';
  if (isThisMonth(date))      return isAr ? 'هذا الشهر'   : 'This month';
  return isAr ? 'قبل ذلك' : 'Earlier';
}

function getGroupOrder(date: Date) {
  if (isToday(date))     return 0;
  if (isThisWeek(date))  return 1;
  if (isThisMonth(date)) return 2;
  return 3;
}

export default function Notifications() {
  const { language } = useLanguage();
  const isAr = language.code === 'ar';
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    await refetch();
    setIsRefreshing(false);
  };

  const filtered = useMemo(() =>
    filter === 'all' ? notifications : notifications.filter(n => n.type === filter),
    [notifications, filter]
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Group by time
  const grouped = useMemo(() => {
    const map: Record<string, { label: string; order: number; items: typeof filtered }> = {};
    filtered.forEach(n => {
      const d = new Date(n.created_at);
      const label = getGroupLabel(d, isAr);
      const order = getGroupOrder(d);
      if (!map[label]) map[label] = { label, order, items: [] };
      map[label].items.push(n);
    });
    return Object.values(map).sort((a, b) => a.order - b.order);
  }, [filtered, isAr]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={cn("w-full min-h-screen bg-background", isAr && "rtl")}>

        {/* ── Header ── */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="max-w-2xl mx-auto px-4 pt-4 pb-3 space-y-3">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <h1 className="text-[22px] font-bold tracking-tight">
                {isAr ? 'الإشعارات' : 'Notifications'}
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                    className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                    title={isAr ? 'قراءة الكل' : 'Mark all read'}
                  >
                    <CheckCheck className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                    filter === f.key
                      ? f.color
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {f.icon}
                  {isAr ? f.labelAr : f.labelEn}
                  {f.key === 'all' && unreadCount > 0 && (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none",
                      filter === 'all' ? "bg-white/20" : "bg-primary text-primary-foreground"
                    )}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-2xl mx-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
              <div className="w-20 h-20 rounded-full border-2 border-border flex items-center justify-center">
                <Bell className="w-9 h-9 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-semibold text-base">{isAr ? 'لا توجد إشعارات' : 'No notifications yet'}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? 'ستظهر هنا عندما يتفاعل أحد مع منشوراتك' : "When someone interacts with you, it'll appear here"}
                </p>
              </div>
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.label}>
                {/* Group header */}
                <div className="px-4 py-2 mt-2">
                  <span className="text-[13px] font-semibold text-foreground">{group.label}</span>
                </div>
                {/* Notifications */}
                {group.items.map(notif => (
                  <NotificationRow
                    key={notif.id}
                    notif={notif}
                    isAr={isAr}
                    onRead={() => { if (!notif.is_read) markAsRead.mutate(notif.id); }}
                  />
                ))}
              </div>
            ))
          )}
          <div className="h-24" />
        </div>
      </div>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════
   Notification Row — Instagram style
═══════════════════════════════════════════════ */
function NotificationRow({ notif, isAr, onRead }: { notif: any; isAr: boolean; onRead: () => void }) {
  const actor = notif.actor;
  const post = (notif as any).post;
  const actorId = actor?.id;
  const queryClient = useQueryClient();

  const { data: isFollowing = false } = useIsFollowing(actorId || '');
  const toggleFollow = useToggleFollow();

  const approveMutation = useMutation({
    mutationFn: () => api.approveFollowRequest(actorId || ''),
    onSuccess: () => {
      toast.success(isAr ? 'تمت الموافقة' : 'Request approved');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.rejectFollowRequest(actorId || ''),
    onSuccess: () => {
      toast.success(isAr ? 'تم الرفض' : 'Request rejected');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const timeAgo = formatDistanceToNow(new Date(notif.created_at), {
    addSuffix: false,
    locale: isAr ? ar : undefined,
  });

  /* ── Icon badge ── */
  const iconMap: Record<string, { icon: React.ReactNode; bg: string }> = {
    like:           { icon: <Heart className="w-3 h-3 fill-white text-white" />,           bg: 'bg-red-500' },
    comment:        { icon: <MessageCircle className="w-3 h-3 fill-white text-white" />,   bg: 'bg-blue-500' },
    follow:         { icon: <UserPlus className="w-3 h-3 text-white" />,                   bg: 'bg-purple-500' },
    follow_request: { icon: <UserPlus className="w-3 h-3 text-white" />,                   bg: 'bg-orange-500' },
    mention:        { icon: <AtSign className="w-3 h-3 text-white" />,                     bg: 'bg-emerald-500' },
    reel_like:      { icon: <Film className="w-3 h-3 text-white" />,                       bg: 'bg-pink-500' },
    save:           { icon: <BookmarkIcon className="w-3 h-3 text-white" />,               bg: 'bg-indigo-500' },
    repost:         { icon: <Repeat2 className="w-3 h-3 text-white" />,                    bg: 'bg-teal-500' },
  };
  const iconInfo = iconMap[notif.type] || { icon: <Bell className="w-3 h-3 text-white" />, bg: 'bg-primary' };

  /* ── Notification text ── */
  const getActionText = () => {
    switch (notif.type) {
      case 'like':           return isAr ? 'أعجب بمنشورك.' : 'liked your post.';
      case 'comment':        return isAr ? 'علّق على منشورك.' : 'commented on your post.';
      case 'follow':         return isAr ? 'بدأ يتابعك.' : 'started following you.';
      case 'follow_request': return isAr ? 'طلب متابعتك.' : 'sent you a follow request.';
      case 'mention':        return isAr ? 'أشار إليك في تعليق.' : 'mentioned you in a comment.';
      case 'reel_like':      return isAr ? 'أعجب بريلز.' : 'liked your reel.';
      case 'story_reply':    return isAr ? 'رد على استوريك.' : 'replied to your story.';
      case 'save':           return isAr ? 'حفظ منشورك.' : 'saved your post.';
      default:               return notif.content || '';
    }
  };

  /* ── Link destination ── */
  const getHref = () => {
    if (notif.type === 'follow' || notif.type === 'follow_request') return `/user?id=${actorId}`;
    if (notif.post_id) {
      if (notif.comment_id) return `/post/${notif.post_id}?commentId=${notif.comment_id}`;
      return `/post/${notif.post_id}`;
    }
    return null;
  };

  const href = getHref();
  const showFollowBack = notif.type === 'follow' && actorId && !isFollowing;
  const showFollowRequest = notif.type === 'follow_request' && actorId;
  const showThumbnail = !showFollowBack && !showFollowRequest && post?.image_url;

  const rowContent = (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer",
        !notif.is_read ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-muted/40"
      )}
      onClick={onRead}
    >
      {/* Unread dot */}
      <div className="w-2 flex-shrink-0 flex justify-center">
        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>

      {/* Avatar + icon badge */}
      <Link href={`/user?id=${actorId}`} onClick={e => e.stopPropagation()} className="relative flex-shrink-0">
        <Avatar className="w-11 h-11">
          <AvatarImage src={actor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${actor?.username}`} />
          <AvatarFallback className="text-xs font-bold">{actor?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background",
          iconInfo.bg
        )}>
          {iconInfo.icon}
        </span>
      </Link>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] leading-snug text-foreground">
          <Link
            href={`/user?id=${actorId}`}
            className="font-bold hover:underline"
            onClick={e => e.stopPropagation()}
          >
            {actor?.username || (isAr ? 'مستخدم' : 'user')}
          </Link>
          {' '}
          <span className="font-normal text-foreground/90">{getActionText()}</span>
        </p>
        {/* Comment preview */}
        {(notif.type === 'comment' || notif.type === 'mention' || notif.type === 'story_reply') && notif.content && (
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
            {notif.content}
          </p>
        )}
        <span className="text-[11px] text-muted-foreground mt-0.5 block">{timeAgo}</span>
      </div>

      {/* Right side: thumbnail or action buttons */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {showFollowRequest && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); approveMutation.mutate(); }}
              disabled={approveMutation.isPending}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-1"
            >
              {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isAr ? 'قبول' : 'Confirm'}
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); rejectMutation.mutate(); }}
              disabled={rejectMutation.isPending}
              className="h-8 px-3 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/70 transition-colors disabled:opacity-60 flex items-center gap-1"
            >
              {rejectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              {isAr ? 'رفض' : 'Delete'}
            </button>
          </div>
        )}
        {showFollowBack && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); if (actorId) toggleFollow.mutate({ targetUserId: actorId }); }}
            disabled={toggleFollow.isPending}
            className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {toggleFollow.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isAr ? 'متابعة' : 'Follow')}
          </button>
        )}
        {showThumbnail && (
          <div className="w-11 h-11 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border/30">
            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {!showFollowRequest && !showFollowBack && !showThumbnail && notif.post_id && (
          <div className="w-11 h-11 rounded-md bg-muted flex-shrink-0 flex items-center justify-center border border-border/30">
            <Film className="w-4 h-4 text-muted-foreground/40" />
          </div>
        )}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {rowContent}
    </Link>
  ) : rowContent;
}
