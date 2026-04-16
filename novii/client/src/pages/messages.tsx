import Layout from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OfficialBadge } from "@/components/ui/official-badge";
import { VerifiedUsername } from "@/components/ui/verified-username";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { PopularBadge } from "@/components/ui/popular-badge";
import { ActiveBadge } from "@/components/ui/active-badge";
import { BugSwarmAnimation } from "@/components/bug-swarm-animation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Edit, 
  Search, 
  Camera, 
  Phone, 
  Video, 
  Info, 
  Image as ImageIcon, 
  Heart, 
  Smile, 
  Mic, 
  MessageCircle,
  Send,
  MoreVertical,
  ChevronLeft,
  ChevronDown,
  UserPlus,
  CheckCircle2,
  Crown,
  Users,
  Volume2,
  VolumeX,
  Clock,
  Trash2,
  RotateCcw,
  X
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { MessageBubble } from "@/components/message-bubble";
import { StoryViewerModal } from "@/components/story-viewer-modal";
import { useStories } from "@/hooks/use-data";
import { toast } from "sonner";
import Cropper, { type Area } from "react-easy-crop";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

function formatConvTime(dateStr: string | undefined | null, isRTL: boolean): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) {
    return date.toLocaleTimeString(isRTL ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' });
  }
  if (isYesterday) {
    return isRTL ? 'أمس' : 'Yesterday';
  }
  return date.toLocaleDateString(isRTL ? 'ar' : 'en', { month: 'short', day: 'numeric' });
}

export default function Messages() {
  const { language, direction } = useLanguage();
  const t = getTranslation(language.code).messages;
  const { user: currentUser } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatChannelRef = useRef<any>(null);
  const isRTL = direction === "rtl";
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [showNewMessagePopover, setShowNewMessagePopover] = useState(false);
  const [searchFollowingQuery, setSearchFollowingQuery] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'chats' | 'communities'>('chats');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [communityMessageInput, setCommunityMessageInput] = useState("");
  const [popoverTab, setPopoverTab] = useState<'chat' | 'community' | 'join'>('chat');
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDescription, setNewCommunityDescription] = useState("");
  const [joinInviteCode, setJoinInviteCode] = useState("");
  const [communityTypingUsers, setCommunityTypingUsers] = useState<any[]>([]);
  const communityTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersModalTab, setMembersModalTab] = useState<'active' | 'kicked'>('active');
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<any>(null);
  const [showModerationMenu, setShowModerationMenu] = useState(false);
  const [tempMuteDuration, setTempMuteDuration] = useState(60);
  const [userMuteStatus, setUserMuteStatus] = useState<{ isMuted: boolean; mutedUntil?: string } | null>(null);
  const [muteTimeRemaining, setMuteTimeRemaining] = useState<number | null>(null);
  const muteCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const selectedUserIdRef = useRef<string | null>(null);
  const selectedCommunityIdRef = useRef<string | null>(null);
  const [userKickedStatus, setUserKickedStatus] = useState<{ isKicked: boolean; isMember: boolean }>({ isKicked: false, isMember: false });
  const communitiesSubscriptionRef = useRef<any>(null);
  const membersSubscriptionRef = useRef<any>(null);
  const { data: allStories = [] } = useStories();
  
  // Edit community info states
  const [showEditCommunityModal, setShowEditCommunityModal] = useState(false);
  const [editCommunityName, setEditCommunityName] = useState("");
  const [editCommunityDescription, setEditCommunityDescription] = useState("");
  const [editCommunityImageFile, setEditCommunityImageFile] = useState<File | null>(null);
  const [editCommunityImagePreview, setEditCommunityImagePreview] = useState<string | null>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  
  // Crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Community image preview
  const [showCommunityImagePreview, setShowCommunityImagePreview] = useState(false);
  
  // Community info modal
  const [showCommunityInfoModal, setShowCommunityInfoModal] = useState(false);

  // --- New chat features ---
  const [replyingTo, setReplyingTo] = useState<import("@/lib/api").Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mute conversation (persisted in localStorage)
  const mutedConvsKey = `novii_muted_${currentUser?.id}`;
  const [mutedConvIds, setMutedConvIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`novii_muted_${currentUser?.id || ''}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const isMutedConv = selectedUserId ? mutedConvIds.has(selectedUserId) : false;

  const toggleMuteConv = () => {
    if (!selectedUserId) return;
    setMutedConvIds(prev => {
      const next = new Set(prev);
      if (next.has(selectedUserId)) { next.delete(selectedUserId); }
      else { next.add(selectedUserId); }
      localStorage.setItem(mutedConvsKey, JSON.stringify(Array.from(next)));
      toast.success(next.has(selectedUserId)
        ? (isRTL ? "تم كتم المحادثة" : "Conversation muted")
        : (isRTL ? "تم إلغاء الكتم" : "Conversation unmuted"));
      return next;
    });
  };

  const EMOJI_LIST = ['😀','😂','🥰','😍','😎','🥳','😢','😡','🤔','😴','👍','👎','❤️','🔥','🎉','🙏','💯','✅','⭐','🎵','😅','🤣','😊','😇','😋','🤩','😏','😒','🙄','😤','🥺','🥹','😱','😨','🤯','😳','🤗','😶','🤐','🫡','💪','🙌','👏','🫶','✌️','🤙','👌','🫰','🤌','💀','🫠','🤡','💩','👻','🤖','💘','💔','💫','⚡','🌟','✨','🎊','🎈','🏆','🥇'];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      toast.error(isRTL ? "لا يمكن الوصول للميكروفون" : "Microphone access denied");
    }
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) { resolve(null); return; }
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
        resolve(blob);
      };
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingSeconds(0);
    });
  };

  const handleSendVoice = async () => {
    if (!isRecording || !selectedUserId) return;
    const blob = await stopRecording();
    if (!blob) return;
    try {
      const audioUrl = await api.uploadAudio(blob);
      sendMessageMutation.mutate({ receiverId: selectedUserId, content: '', audioUrl });
    } catch {
      toast.error(isRTL ? "فشل إرسال الرسالة الصوتية" : "Failed to send voice message");
    }
  };

  const cancelRecording = async () => {
    await stopRecording();
  };

  // Keep selectedUserIdRef in sync with state (for use in realtime closures)
  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  // Keep selectedCommunityIdRef in sync (for community notification closures)
  useEffect(() => {
    selectedCommunityIdRef.current = selectedCommunityId;
  }, [selectedCommunityId]);

  // Hide bottom nav in mobile when chat/community is selected.
  // Always reset to 'false' on unmount so navigating away re-shows the nav.
  useEffect(() => {
    localStorage.setItem('chatActive', selectedUserId || selectedCommunityId ? 'true' : 'false');
    window.dispatchEvent(new Event('chatActiveChange'));
    return () => {
      localStorage.setItem('chatActive', 'false');
      window.dispatchEvent(new Event('chatActiveChange'));
    };
  }, [selectedUserId, selectedCommunityId]);

  // Fetch communities
  const { data: communities = [], isLoading: communitiesLoading, refetch: refetchCommunities } = useQuery({
    queryKey: ['communities', currentUser?.id],
    queryFn: async () => {
      try {
        const result = await api.getCommunities();
        return result || [];
      } catch (error) {
        console.error("❌ [QUERY] Error:", error);
        return [];
      }
    },
    enabled: !!currentUser,
    staleTime: 0,
    gcTime: 0,
    retry: 3,
  });

  // Current community (defined after communities query)
  const currentCommunity = communities.find(c => c.id === selectedCommunityId);

  // Real-time subscription for communities changes
  useEffect(() => {
    if (!currentUser) return;


    // Subscribe to community_members changes to detect when user is removed from a community
    communitiesSubscriptionRef.current = supabase
      .channel(`communities-changes-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          refetchCommunities();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communities'
        },
        (payload) => {
          // Refetch communities to reflect any changes/deletions
          refetchCommunities();
        }
      )
      .subscribe((status) => {
      });

    return () => {
      if (communitiesSubscriptionRef.current) {
        supabase.removeChannel(communitiesSubscriptionRef.current);
      }
    };
  }, [currentUser, refetchCommunities]);

  // Fetch community messages
  const { data: communityMessages = [], isLoading: communityMessagesLoading } = useQuery({
    queryKey: ['communityMessages', selectedCommunityId, currentUser?.id],
    queryFn: () => selectedCommunityId ? api.getCommunityMessages(selectedCommunityId) : Promise.resolve([]),
    enabled: !!selectedCommunityId,
  });

  // Fetch community members
  const { data: communityMembers = [], refetch: refetchMembers } = useQuery({
    queryKey: ['communityMembers', selectedCommunityId],
    queryFn: () => selectedCommunityId ? api.getCommunityMembers(selectedCommunityId) : Promise.resolve([]),
    enabled: !!selectedCommunityId,
  });

  // Fetch kicked members 👢📋
  const { data: kickedMembers = [], refetch: refetchKickedMembers } = useQuery({
    queryKey: ['kickedMembers', selectedCommunityId],
    queryFn: () => selectedCommunityId ? api.getKickedMembers(selectedCommunityId) : Promise.resolve([]),
    enabled: !!selectedCommunityId && showMembersModal,
  });

  // Helper function to update mute status from members data
  const updateMuteStatusFromMembers = (members: any[]) => {
    if (!currentUser) return;
    
    const currentUserMember = members.find((m: any) => m.user_id === currentUser.id);
    
    if (currentUserMember?.is_muted) {
      setUserMuteStatus({
        isMuted: true,
        mutedUntil: currentUserMember.muted_until
      });
    } else {
      setUserMuteStatus({ isMuted: false });
    }
  };

  // Real-time subscription for community members changes
  useEffect(() => {
    if (!selectedCommunityId) return;


    membersSubscriptionRef.current = supabase
      .channel(`community-members-${selectedCommunityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
          filter: `community_id=eq.${selectedCommunityId}`
        },
        (payload) => {
          // Update mute status for current user if it's about them
          if (currentUser && payload.new && ((payload.new as any).user_id === currentUser.id || (payload.old as any)?.user_id === currentUser.id)) {
            updateMuteStatusFromMembers([payload.new]);
          }
          refetchMembers();
        }
      )
      .subscribe((status) => {
      });

    return () => {
      if (membersSubscriptionRef.current) {
        supabase.removeChannel(membersSubscriptionRef.current);
      }
    };
  }, [selectedCommunityId, currentUser]);

  // Check initial mute status when community members load
  useEffect(() => {
    if (!selectedCommunityId || !currentUser || communityMembers.length === 0) return;
    updateMuteStatusFromMembers(communityMembers);
  }, [selectedCommunityId, currentUser, communityMembers.length]);

  // Check if user is kicked from the community
  useEffect(() => {
    if (!selectedCommunityId || !currentUser) {
      setUserKickedStatus({ isKicked: false, isMember: false });
      return;
    }

    const checkKickStatus = async () => {
      try {
        const status = await api.checkCommunityKickStatus(selectedCommunityId);
        if (status && typeof status === 'object') {
          setUserKickedStatus(status);
        }
      } catch (error) {
        console.error("Error checking kick status:", error);
        // Default to not kicked if error occurs
        setUserKickedStatus({ isKicked: false, isMember: false });
      }
    };

    checkKickStatus();
  }, [selectedCommunityId, currentUser]);

  // Countdown timer for temporary mutes
  useEffect(() => {
    if (!userMuteStatus?.isMuted || !userMuteStatus?.mutedUntil) {
      setMuteTimeRemaining(null);
      if (muteCountdownRef.current) clearTimeout(muteCountdownRef.current);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const mutedUntil = new Date(userMuteStatus.mutedUntil!).getTime();
      const remaining = mutedUntil - now;

      if (remaining <= 0) {
        setUserMuteStatus({ isMuted: false });
        setMuteTimeRemaining(null);
      } else {
        setMuteTimeRemaining(Math.ceil(remaining / 1000));
        muteCountdownRef.current = setTimeout(updateCountdown, 1000);
      }
    };

    updateCountdown();
    
    return () => {
      if (muteCountdownRef.current) clearTimeout(muteCountdownRef.current);
    };
  }, [userMuteStatus]);

  // Mute member mutation
  const muteMemberMutation = useMutation({
    mutationFn: ({ targetUserId, reason }: { targetUserId: string; reason?: string }) =>
      selectedCommunityId ? api.muteCommunityMember(selectedCommunityId, targetUserId, reason) : Promise.reject(),
    onSuccess: () => {
      toast.success(isRTL ? 'تم كتم الصوت بنجاح' : 'Member muted successfully');
      refetchMembers();
      setShowModerationMenu(false);
      setSelectedMemberForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل كتم الصوت' : 'Failed to mute member'));
    }
  });

  // Unmute member mutation
  const unmuteMemberMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      selectedCommunityId ? api.unmuteCommunityMember(selectedCommunityId, targetUserId) : Promise.reject(),
    onSuccess: () => {
      toast.success(isRTL ? 'تم رفع الكتم بنجاح' : 'Member unmuted successfully');
      refetchMembers();
      setShowModerationMenu(false);
      setSelectedMemberForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل رفع الكتم' : 'Failed to unmute member'));
    }
  });

  // Temporary mute member mutation
  const tempMuteMemberMutation = useMutation({
    mutationFn: ({ targetUserId, durationMinutes }: { targetUserId: string; durationMinutes: number }) =>
      selectedCommunityId ? api.temporarilyMuteCommunityMember(selectedCommunityId, targetUserId, durationMinutes) : Promise.reject(),
    onSuccess: () => {
      toast.success(isRTL ? `تم كتم الصوت لمدة ${tempMuteDuration} دقيقة` : `Member muted for ${tempMuteDuration} minutes`);
      refetchMembers();
      setShowModerationMenu(false);
      setSelectedMemberForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل كتم الصوت' : 'Failed to mute member'));
    }
  });

  // Kick member mutation
  const kickMemberMutation = useMutation({
    mutationFn: ({ targetUserId, reason }: { targetUserId: string; reason?: string }) =>
      selectedCommunityId ? api.kickCommunityMember(selectedCommunityId, targetUserId, reason) : Promise.reject(),
    onSuccess: () => {
      toast.success(isRTL ? 'تم طرد العضو بنجاح' : 'Member kicked successfully');
      refetchMembers();
      setShowModerationMenu(false);
      setSelectedMemberForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل طرد العضو' : 'Failed to kick member'));
    }
  });

  // Make admin mutation
  const makeAdminMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      selectedCommunityId ? api.makeAdminCommunityMember(selectedCommunityId, targetUserId) : Promise.reject(),
    onSuccess: () => {
      toast.success(isRTL ? 'تم تعيين كأدمن بنجاح' : 'Member promoted to admin successfully');
      refetchMembers();
      setShowModerationMenu(false);
      setSelectedMemberForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل تعيين كأدمن' : 'Failed to make admin'));
    }
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      selectedCommunityId ? api.removeAdminCommunityMember(selectedCommunityId, targetUserId) : Promise.reject(),
    onSuccess: () => {
      toast.success(isRTL ? 'تم إزالة الأدمن بنجاح' : 'Admin privileges removed successfully');
      refetchMembers();
      setShowModerationMenu(false);
      setSelectedMemberForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل إزالة الأدمن' : 'Failed to remove admin'));
    }
  });

  // Unkick member mutation 🔄👢
  const unkickMemberMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      selectedCommunityId ? api.unkickCommunityMember(selectedCommunityId, targetUserId) : Promise.reject(),
    onSuccess: () => {
      toast.success(isRTL ? 'تم فك الطرد بنجاح' : 'Member unkicked successfully');
      refetchKickedMembers();
      setShowModerationMenu(false);
      setSelectedMemberForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل فك الطرد' : 'Failed to unkick member'));
    }
  });

  // Send community message mutation (with optimistic update)
  const sendCommunityMessageMutation = useMutation({
    mutationFn: async ({ communityId, content }: { communityId: string; content: string }) =>
      api.sendCommunityMessage(communityId, content),
    onMutate: async ({ communityId, content }) => {
      const queryKey = ['communityMessages', selectedCommunityId, currentUser?.id];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<any[]>(queryKey) || [];
      // Pull live profile data from current member list (has username + avatar)
      const me = communityMembers.find((m: any) => m.user_id === currentUser?.id);
      const meta: any = (currentUser as any)?.user_metadata || {};
      const optimistic = {
        id: `temp-${Date.now()}`,
        community_id: communityId,
        sender_id: currentUser?.id,
        content,
        image_url: null,
        created_at: new Date().toISOString(),
        is_deleted: false,
        is_system_message: false,
        username: me?.profiles?.username || meta.username || meta.user_name || 'You',
        full_name: me?.profiles?.full_name || meta.full_name || null,
        avatar_url: me?.profiles?.avatar_url || meta.avatar_url || null,
        is_verified: !!me?.profiles?.is_verified,
        is_official: !!me?.profiles?.is_official,
        _optimistic: true,
      };
      queryClient.setQueryData(queryKey, [...previous, optimistic]);
      setCommunityMessageInput("");
      return { previous, queryKey };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.queryKey) queryClient.setQueryData(ctx.queryKey, ctx.previous);
      toast.error(err?.message || (isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['communityMessages', selectedCommunityId, currentUser?.id] });
    },
  });

  // Delete community message mutation (admin only)
  const deleteMessageMutation = useMutation({
    mutationFn: async ({ communityId, messageId }: { communityId: string; messageId: string }) =>
      api.deleteCommunityMessage(communityId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityMessages', selectedCommunityId, currentUser?.id] });
      toast.success(isRTL ? 'تم حذف الرسالة' : 'Message deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل حذف الرسالة' : 'Failed to delete message'));
    }
  });

  // Delete own community message mutation (sender)
  const deleteOwnMessageMutation = useMutation({
    mutationFn: async ({ communityId, messageId }: { communityId: string; messageId: string }) =>
      api.deleteOwnCommunityMessage(communityId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityMessages', selectedCommunityId, currentUser?.id] });
      toast.success(isRTL ? 'تم حذف رسالتك' : 'Your message was deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل حذف الرسالة' : 'Failed to delete message'));
    }
  });

  // Leave community mutation (member only, not owner)
  const leaveCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => api.leaveCommunity(communityId),
    onSuccess: () => {
      toast.success(isRTL ? 'لقد غادرت المجتمع' : 'You left the community');
      queryClient.invalidateQueries({ queryKey: ['communities', currentUser?.id] });
      setSelectedCommunityId(null);
      setShowCommunityInfoModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل المغادرة' : 'Failed to leave community'));
    },
  });

  // Delete community mutation (owner only)
  const deleteCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => api.deleteCommunity(communityId),
    onSuccess: () => {
      toast.success(isRTL ? 'تم حذف المجتمع' : 'Community deleted');
      queryClient.invalidateQueries({ queryKey: ['communities', currentUser?.id] });
      setSelectedCommunityId(null);
      setShowCommunityInfoModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل الحذف' : 'Failed to delete community'));
    },
  });

  // Toggle community notifications mute
  const myMembership = communityMembers.find((m: any) => m.user_id === currentUser?.id);
  const notificationsMuted = !!myMembership?.notifications_muted;
  const toggleNotificationsMutation = useMutation({
    mutationFn: async ({ communityId, muted }: { communityId: string; muted: boolean }) =>
      api.setCommunityNotifications(communityId, muted),
    onSuccess: (_, { muted }) => {
      toast.success(muted
        ? (isRTL ? 'تم كتم إشعارات المجتمع' : 'Community notifications muted')
        : (isRTL ? 'تم تفعيل الإشعارات' : 'Community notifications enabled'));
      refetchMembers();
    },
    onError: (error: any) => {
      toast.error(error.message || (isRTL ? 'فشل تحديث الإشعارات' : 'Failed to update notifications'));
    },
  });

  // Update community info mutation (owner only) ✏️
  const updateCommunityMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCommunityId) throw new Error('No community selected');

      let avatarUrl = editCommunityImagePreview;

      // Upload image if a new file is selected
      if (editCommunityImageFile) {
        avatarUrl = await api.uploadCommunityAvatar(editCommunityImageFile, (progress) => {
        });
      }

      const response = await api.updateCommunity(selectedCommunityId, {
        name: editCommunityName || undefined,
        description: editCommunityDescription || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      // Return the avatar URL for cache update
      return { ...response, avatarUrl };
    },
    onSuccess: (data) => {
      // 🚀 تحديث فوري للـ cache محلياً باستخدام الرابط الحقيقي من الخادم
      const currentCommunities = queryClient.getQueryData(['communities', currentUser?.id]) || [];
      const updatedCommunities = (currentCommunities as any[]).map(comm => 
        comm.id === selectedCommunityId 
          ? {
              ...comm,
              name: editCommunityName || comm.name,
              description: editCommunityDescription || comm.description,
              avatar_url: data.avatarUrl || comm.avatar_url,
            }
          : comm
      );
      queryClient.setQueryData(['communities', currentUser?.id], updatedCommunities);

      toast.success(isRTL ? "✅ تم تحديث المجتمع بنجاح" : "✅ Community updated successfully");
      setShowEditCommunityModal(false);
      setEditCommunityName("");
      setEditCommunityDescription("");
      setEditCommunityImageFile(null);
      setEditCommunityImagePreview(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || (isRTL ? "❌ فشل التحديث" : "❌ Failed to update"));
    },
  });

  // Handle opening edit modal with current community data
  const handleOpenEditModal = () => {
    const community = communities.find(c => c.id === selectedCommunityId);
    if (community) {
      setEditCommunityName(community.name || "");
      setEditCommunityDescription(community.description || "");
      setEditCommunityImagePreview(community.avatar_url || null);
      setEditCommunityImageFile(null);
      setShowEditCommunityModal(true);
    }
  };

  // Handle image selection for community edit - show crop modal
  const handleEditCommunityImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageToCrop(event.target?.result as string);
        setShowCropModal(true);
        // Store file for later if user cancels crop
        setEditCommunityImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle crop completion
  const handleCropComplete = async () => {
    if (!imageToCrop || !croppedAreaPixels) {
      toast.error(isRTL ? "اختر منطقة للقص" : "Select area to crop");
      return;
    }

    try {
      // Create canvas and crop the image
      const image = new Image();
      image.src = imageToCrop;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        // Convert canvas to blob and create file
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], 'community-avatar.jpg', { type: 'image/jpeg' });
            setEditCommunityImageFile(croppedFile);
            setEditCommunityImagePreview(canvas.toDataURL('image/jpeg'));
            setShowCropModal(false);
            toast.success(isRTL ? "✅ تم قص الصورة بنجاح" : "✅ Image cropped successfully");
          }
        }, 'image/jpeg', 0.9);
      };
    } catch (error) {
      console.error("Crop error:", error);
      toast.error(isRTL ? "❌ خطأ في قص الصورة" : "❌ Error cropping image");
    }
  };

  // Create community mutation
  const createCommunityMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) =>
      api.createCommunity(name, description),
    onSuccess: () => {
      // Refetch communities to get the newly created community
      queryClient.invalidateQueries({ queryKey: ['communities', currentUser?.id] });
      queryClient.refetchQueries({ queryKey: ['communities', currentUser?.id] });
    },
  });

  // Join community with invite code mutation
  const joinCommunityMutation = useMutation({
    mutationFn: async (inviteCode: string) =>
      api.joinCommunityWithCode(inviteCode),
    onSuccess: (data) => {
      // Refetch communities to get the newly joined community
      queryClient.invalidateQueries({ queryKey: ['communities', currentUser?.id] });
      queryClient.refetchQueries({ queryKey: ['communities', currentUser?.id] });
      // Show success message
      toast.success(isRTL ? `تم الانضمام إلى "${data.communityName}"` : `Joined "${data.communityName}"`);
    },
    onError: (error: any) => {
      const errorMsg = error.message || (isRTL ? 'فشل الانضمام إلى المجتمع' : 'Failed to join community');
      console.error("❌ Failed to join community:", errorMsg);
      // Check if it's a kicked error
      if (errorMsg.includes('kicked') || errorMsg.includes('طرد')) {
        toast.error(isRTL 
          ? '🚫 تم طردك من هذا المجتمع ولا يمكنك إعادة الانضمام' 
          : '🚫 You have been kicked from this community and cannot rejoin');
      } else {
        toast.error(errorMsg);
      }
    }
  });

  // Mark all notifications as read when entering messages page
  const markAllNotificationsAsRead = useMutation({
    mutationFn: () => api.markAllMessageNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all notifications as read on page mount
  useEffect(() => {
    if (currentUser) {
      markAllNotificationsAsRead.mutate();
    }
  }, [currentUser]);

  // Force refetch communities when user logs in
  useEffect(() => {
    if (currentUser) {
      queryClient.refetchQueries({ queryKey: ['communities', currentUser.id] });
    }
  }, [currentUser?.id, queryClient]);

  // Fetch conversations — staleTime + gcTime keep optimistic updates stable across navigation
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: () => api.getConversations(),
    enabled: !!currentUser,
    staleTime: 60_000,          // 1 min — don't background-refetch too aggressively
    gcTime: 10 * 60_000,        // keep cache 10 min after unmount (navigation away/back)
    refetchOnWindowFocus: false, // don't overwrite optimistic state on window focus
  });

  // Fetch following list
  const { data: followingListRaw, isLoading: followingLoading } = useQuery({
    queryKey: ['following', currentUser?.id],
    queryFn: () => currentUser ? api.getFollowing(currentUser.id) : Promise.resolve([]),
    enabled: !!currentUser && showNewMessagePopover,
  });
  const followingList = Array.isArray(followingListRaw) ? followingListRaw : [];

  // Filter following list based on search query
  const filteredFollowing = followingList.filter((user: any) => {
    const query = searchFollowingQuery.toLowerCase();
    return (
      (user.full_name?.toLowerCase() || "").includes(query) ||
      (user.username?.toLowerCase() || "").includes(query)
    );
  });

  // Fetch messages for selected user
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedUserId],
    queryFn: () => selectedUserId ? api.getMessages(selectedUserId) : Promise.resolve([]),
    enabled: !!selectedUserId && !!currentUser,
  });

  // Fetch selected user profile (for when starting a new conversation)
  const { data: selectedUserProfile } = useQuery({
    queryKey: ['profile', selectedUserId],
    queryFn: () => selectedUserId ? api.getProfileById(selectedUserId) : Promise.resolve(null),
    enabled: !!selectedUserId && !!currentUser,
  });

  // Send message mutation (with optimistic update so the sender's bubble shows instantly)
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content, imageUrl, replyToId, audioUrl }: { receiverId: string; content: string; imageUrl?: string; replyToId?: string; audioUrl?: string }) =>
      api.sendMessage(receiverId, content, imageUrl, replyToId, audioUrl),
    onMutate: async ({ receiverId, content, imageUrl, replyToId, audioUrl }) => {
      const queryKey = ['messages', receiverId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<any[]>(queryKey) || [];
      const meta: any = (currentUser as any)?.user_metadata || {};
      const optimistic: any = {
        id: `temp-${Date.now()}`,
        sender_id: currentUser?.id,
        receiver_id: receiverId,
        content,
        image_url: imageUrl || null,
        audio_url: audioUrl || null,
        reply_to_id: replyToId || null,
        created_at: new Date().toISOString(),
        is_read: false,
        is_deleted: false,
        username: meta.username || meta.user_name || 'You',
        full_name: meta.full_name || null,
        avatar_url: meta.avatar_url || null,
        _optimistic: true,
      };
      queryClient.setQueryData(queryKey, [...previous, optimistic]);
      setMessageInput("");
      setSelectedImage(null);
      setPreviewUrl(null);
      setReplyingTo(null);
      setShowEmojiPicker(false);
      return { previous, queryKey };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.queryKey) queryClient.setQueryData(ctx.queryKey, ctx.previous);
      toast.error(err?.message || (isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message'));
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    },
  });

  // Request notification permission and setup notification sound
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasNotificationPermission(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setHasNotificationPermission(permission === 'granted');
        });
      }
    }
    
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0OVqzn77BdGAg+lt7xwW0gBSuBzvLZjTYIGGS56+ijUQ4LTaXh8bllHAU2jdXyzn0pBSd+zPDckUAKE1qv5u+uWRYKQ5vd88GBJAUuhM/z1oU1Bx1qu+7mnEYMEFOo5O+0XhgIPZbZ8cJxHQUtgtDy2ow2BxhluevenEcMDlGn4/G2ZBkHN47V88x+KwUpe8vw3Y9AAAAFamvr6+vr6/Pz8/Pz8/Pz8AAAAAAAAAD/AP8A/wD/AP8A/wD/AP8A');
  }, []);

  // Real-time community messages subscription 🔴
  useEffect(() => {
    if (!selectedCommunityId) return;


    const subscription = supabase
      .channel(`community_messages:${selectedCommunityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${selectedCommunityId}`,
        },
        (payload: any) => {
          const newMessage = payload.new;
          const queryKey = ['communityMessages', selectedCommunityId, currentUser?.id];

          // Optimistically append the new message to the cache so it appears instantly
          queryClient.setQueryData(queryKey, (oldData: any) => {
            const existing = Array.isArray(oldData) ? oldData : [];

            // Skip if already present (e.g. from optimistic send)
            if (existing.some((m: any) => m.id === newMessage.id)) {
              return existing;
            }

            // Try to enrich with sender profile from cached community members
            const members: any[] = queryClient.getQueryData(['communityMembers', selectedCommunityId]) || [];
            const member = members.find((m: any) => m.user_id === newMessage.sender_id);
            const enriched = {
              ...newMessage,
              username: member?.username ?? newMessage.username,
              full_name: member?.full_name ?? newMessage.full_name,
              avatar_url: member?.avatar_url ?? newMessage.avatar_url,
              is_verified: member?.is_verified ?? newMessage.is_verified,
              is_official: member?.is_official ?? newMessage.is_official,
            };

            // Replace any pending optimistic message from same sender with same content
            const filtered = existing.filter((m: any) => !(
              typeof m.id === 'string' && m.id.startsWith('temp-') &&
              m.sender_id === newMessage.sender_id &&
              m.content === newMessage.content
            ));

            return [...filtered, enriched];
          });

          // Background refetch to ensure consistency (joins, server-side data)
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedCommunityId, queryClient, currentUser?.id]);

  // Typing indicator for community messages 🎹
  useEffect(() => {
    if (!selectedCommunityId) return;


    const subscription = supabase
      .channel(`community_typing:${selectedCommunityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `community_id=eq.${selectedCommunityId}`,
        },
        (payload) => {
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // User is typing - add to list
            const typingUser = payload.new;
            if (typingUser.user_id !== currentUser?.id) {
              setCommunityTypingUsers(prev => {
                const filtered = prev.filter(u => u.user_id !== typingUser.user_id);
                return [...filtered, typingUser];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // User stopped typing
            const typingUser = payload.old;
            setCommunityTypingUsers(prev => prev.filter(u => u.user_id !== typingUser.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedCommunityId, currentUser?.id]);

  // Check if user came from profile (URL param: ?user=userId)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const targetUserId = searchParams.get('user');
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (targetUserId && UUID_RE.test(targetUserId)) {
      setSelectedUserId(targetUserId);
    }
  }, [location]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscription for ALL new messages (to update conversations list)
  useEffect(() => {
    if (!currentUser) return;
    

    const channel = supabase
      .channel(`user-messages-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload: any) => {
          const newMessage = payload.new;
          
          // Message is already filtered to current user as receiver
          
          // Use ref to get latest selectedUserId (avoids stale closure)
          const isActiveChat = selectedUserIdRef.current === newMessage.sender_id;
          
          if (isActiveChat) {
            // Mark messages as read immediately if chat is open
            api.markMessagesAsRead(newMessage.sender_id)
              .then(() => {
                // Update messages only, keep unread count at 0
                queryClient.setQueryData(['conversations', currentUser.id], (oldData: any) => {
                  if (!oldData) return oldData;
                  return oldData.map((conv: any) => 
                    conv.user?.id === newMessage.sender_id 
                      ? { ...conv, unreadCount: 0 }
                      : conv
                  );
                });
                queryClient.invalidateQueries({ queryKey: ['messages', newMessage.sender_id] });
              })
              .catch(err => console.error('Failed to mark messages as read:', err));
          } else {
            // Increment unread count by 1 for this conversation (don't refetch all data)
            queryClient.setQueryData(['conversations', currentUser.id], (oldData: any) => {
              if (!oldData) return oldData;
              return oldData.map((conv: any) => 
                conv.user?.id === newMessage.sender_id 
                  ? { ...conv, unreadCount: conv.unreadCount + 1, lastMessage: newMessage }
                  : conv
              );
            });
            
            // Play notification sound (only if conversation not muted)
            const storedMuted = localStorage.getItem(`novii_muted_${currentUser?.id || ''}`);
            const mutedSet = storedMuted ? new Set(JSON.parse(storedMuted)) : new Set();
            const senderIsMuted = mutedSet.has(newMessage.sender_id);
            if (!senderIsMuted && notificationSoundRef.current) {
              notificationSoundRef.current.play();
            }
            
            // Show browser notification
            if (!senderIsMuted && hasNotificationPermission) {
              supabase
                .from('profiles')
                .select('username, full_name, avatar_url')
                .eq('id', newMessage.sender_id)
                .single()
                .then(({ data: senderProfile }) => {
                  if (senderProfile) {
                    const notification = new Notification(
                      senderProfile.full_name || senderProfile.username || 'رسالة جديدة',
                      {
                        body: newMessage.content,
                        icon: senderProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderProfile.username}`,
                        tag: 'message-notification',
                        requireInteraction: false
                      }
                    );
                    
                    notification.onclick = () => {
                      window.focus();
                      setSelectedUserId(newMessage.sender_id);
                      notification.close();
                    };
                  }
                });
            }
          }
        }
      )
      .subscribe((status: any) => {
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient]);

  // 🔔 Global community notifications: play sound + show browser notification
  // for new community messages (when the community isn't currently open).
  useEffect(() => {
    if (!currentUser || communities.length === 0) return;

    const myCommunityIds = communities.map((c: any) => c.id);
    const channel = supabase
      .channel(`community-notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=in.(${myCommunityIds.join(',')})`,
        },
        async (payload: any) => {
          const newMessage = payload.new;
          // Skip own messages
          if (newMessage.sender_id === currentUser.id) return;
          // Skip if user is currently viewing this community
          if (selectedCommunityIdRef.current === newMessage.community_id) return;
          // Skip system messages
          if (newMessage.is_system_message) return;

          const community = communities.find((c: any) => c.id === newMessage.community_id);
          if (!community) return;

          // Respect notifications mute preference
          if (community.notifications_muted) return;

          // Bump community list (so unread indicator / order updates)
          queryClient.invalidateQueries({ queryKey: ['communities', currentUser.id] });

          // Play notification sound
          if (notificationSoundRef.current) {
            notificationSoundRef.current.play().catch(() => {});
          }

          // Fetch sender info for the notification
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          const senderName = senderProfile?.full_name || senderProfile?.username || (isRTL ? 'عضو' : 'Member');

          // In-app toast (always works, even inside iframes / when browser perms are denied)
          toast(`${community.name} • ${senderName}`, {
            description: newMessage.content || (isRTL ? 'رسالة جديدة' : 'New message'),
            action: {
              label: isRTL ? 'فتح' : 'Open',
              onClick: () => {
                setSelectedTab('communities');
                setSelectedUserId(null);
                setSelectedCommunityId(newMessage.community_id);
              },
            },
          });

          // Native browser notification (only fires when granted & not in restricted iframe)
          if (hasNotificationPermission && typeof window !== 'undefined' && 'Notification' in window) {
            try {
              const notification = new Notification(`${community.name} • ${senderName}`, {
                body: newMessage.content || (isRTL ? 'رسالة جديدة' : 'New message'),
                icon: community.avatar_url || senderProfile?.avatar_url || undefined,
                tag: `community-${newMessage.community_id}`,
                requireInteraction: false,
              });

              notification.onclick = () => {
                window.focus();
                setSelectedTab('communities');
                setSelectedUserId(null);
                setSelectedCommunityId(newMessage.community_id);
                notification.close();
              };
            } catch (err) {
              // Silently ignore — toast already covers the user.
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, communities, hasNotificationPermission, queryClient, isRTL]);

  // Real-time subscription for new messages and typing indicators in active chat
  useEffect(() => {
    if (!currentUser || !selectedUserId) return;
    

    // Create unique channel name for this conversation
    const userIds = [currentUser.id, selectedUserId].sort();
    const channelName = `chat-${userIds[0]}-${userIds[1]}`;

    const channel = supabase.channel(channelName);
    chatChannelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload: any) => {
          const newMessage = payload.new;
          
          // Check if this message is relevant to current conversation
          const isRelevant = 
            (newMessage.sender_id === currentUser.id && newMessage.receiver_id === selectedUserId) ||
            (newMessage.sender_id === selectedUserId && newMessage.receiver_id === currentUser.id);
          
          if (isRelevant) {
            // Optimistically append the new message into the cache for instant display
            queryClient.setQueryData(['messages', selectedUserId], (oldData: any) => {
              const existing = Array.isArray(oldData) ? oldData : [];
              if (existing.some((m: any) => m.id === newMessage.id)) return existing;
              const filtered = existing.filter((m: any) => !(
                typeof m.id === 'string' && m.id.startsWith('temp-') &&
                m.sender_id === newMessage.sender_id &&
                m.content === newMessage.content
              ));
              return [...filtered, newMessage];
            });
            // Background refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
            queryClient.setQueryData(['conversations', currentUser?.id], (oldData: any) => {
              if (!oldData) return oldData;
              return oldData.map((conv: any) => 
                conv.user?.id === selectedUserId 
                  ? { ...conv, unreadCount: 0 }
                  : conv
              );
            });
          }
        }
      )
      // Listen for message updates (edit/delete)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload: any) => {
          const updatedMessage = payload.new;
          
          // Check if this message is relevant to current conversation
          const isRelevant = 
            (updatedMessage.sender_id === currentUser.id && updatedMessage.receiver_id === selectedUserId) ||
            (updatedMessage.sender_id === selectedUserId && updatedMessage.receiver_id === currentUser.id);
          
          if (isRelevant) {
            // Update messages query only, keep unread count at 0 for active chat
            queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
            queryClient.setQueryData(['conversations', currentUser?.id], (oldData: any) => {
              if (!oldData) return oldData;
              return oldData.map((conv: any) => 
                conv.user?.id === selectedUserId 
                  ? { ...conv, unreadCount: 0 }
                  : conv
              );
            });
          }
        }
      )
      // Listen for typing events
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const { userId, isTyping: typing } = payload.payload;
        
        // Only show typing if it's from the other person
        if (userId === selectedUserId) {
          setIsTyping(typing);
          
          // Auto-hide typing indicator after 3 seconds
          if (typing && typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          if (typing) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      })
      .subscribe((status: any) => {
      });

    // Cleanup subscription on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      chatChannelRef.current = null;
    };
  }, [currentUser, selectedUserId, queryClient]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (!selectedUserId || !currentUser) return;

    // Immediately zero out the unread count in the cache (optimistic)
    queryClient.setQueryData(['conversations', currentUser.id], (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.map((conv: any) =>
        conv.user?.id === selectedUserId ? { ...conv, unreadCount: 0 } : conv
      );
    });

    // Mark as read in DB, then do a single clean refetch to sync
    api.markMessagesAsRead(selectedUserId)
      .then(() => {
        // Refetch after DB confirms the write — now DB should return 0 unread
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
      })
      .catch(err => {
        console.error('Failed to mark messages as read:', err);
      });
  }, [selectedUserId, currentUser, queryClient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if ((messageInput.trim() || selectedImage) && selectedUserId) {
      sendTypingEvent(false);
      
      let imageUrl: string | undefined;
      if (selectedImage) {
        imageUrl = await api.uploadMessageImage(selectedImage);
      }
      
      sendMessageMutation.mutate({
        receiverId: selectedUserId,
        content: messageInput.trim(),
        imageUrl,
        replyToId: replyingTo?.id,
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sendTypingEvent = (typing: boolean) => {
    if (!currentUser || !selectedUserId || !chatChannelRef.current) return;
    
    chatChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUser.id, isTyping: typing }
    });
  };

  // Handle input change and send typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Send typing started event
    if (value.length > 0) {
      sendTypingEvent(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to send typing stopped after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingEvent(false);
      }, 2000);
    } else {
      sendTypingEvent(false);
    }
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv: any) => {
    if (!conversationSearch.trim()) return true;
    const q = conversationSearch.toLowerCase();
    return (
      (conv.user?.username?.toLowerCase() || '').includes(q) ||
      (conv.user?.full_name?.toLowerCase() || '').includes(q)
    );
  });

  // Find existing conversation or create temporary one from selected user profile
  const selectedConversation = selectedUserId 
    ? conversations.find(c => c.user?.id === selectedUserId) || (selectedUserProfile ? {
        user: selectedUserProfile,
        lastMessage: null
      } : null)
    : null;

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">{isRTL ? "يرجى تسجيل الدخول لعرض الرسائل" : "Please log in to view messages"}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] md:h-screen w-full bg-background text-foreground overflow-hidden border-t border-border md:border-0">
        
        {/* Conversations Sidebar */}
        <div className={cn(
          "w-full md:w-[360px] flex flex-col border-e border-border bg-background",
          (selectedUserId || selectedCommunityId) ? "hidden md:flex" : "flex"
        )}>
          
          {/* Header */}
          <div className="px-4 pt-5 pb-3 flex items-center justify-between">
            <span className={cn("font-bold text-xl text-foreground", isRTL && "text-right")}>{isRTL ? "الرسائل" : "Messages"}</span>
            
            <Popover open={showNewMessagePopover} onOpenChange={setShowNewMessagePopover}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-colors h-9 w-9">
                  <Edit className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align={isRTL ? "end" : "start"}>
                <div className="flex flex-col max-h-96">
                  {/* Tabs */}
                  <div className="flex gap-2 px-4 py-3 border-b border-border/30 overflow-x-auto">
                    <Button
                      variant={popoverTab === 'chat' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPopoverTab('chat')}
                      className="h-8 text-xs whitespace-nowrap"
                    >
                      {isRTL ? "محادثة" : "Chat"}
                    </Button>
                    <Button
                      variant={popoverTab === 'community' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPopoverTab('community')}
                      className="h-8 text-xs whitespace-nowrap"
                    >
                      {isRTL ? "إنشاء" : "Create"}
                    </Button>
                    <Button
                      variant={popoverTab === 'join' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPopoverTab('join')}
                      className="h-8 text-xs whitespace-nowrap"
                    >
                      {isRTL ? "انضم" : "Join"}
                    </Button>
                  </div>

                  {/* Chat Tab */}
                  {popoverTab === 'chat' && (
                    <>
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-border/30">
                        <h3 className={cn("font-semibold text-sm", isRTL && "text-right")}>
                          {isRTL ? "اختر شخصاً لبدء محادثة" : "Start a new message"}
                        </h3>
                      </div>

                      {/* Search Input */}
                      <div className="px-4 py-2 border-b border-border/30">
                        <div className="relative">
                          <Search className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4",
                            isRTL ? "right-3" : "left-3"
                          )} />
                          <Input
                            placeholder={isRTL ? "ابحث عن اسم..." : "Search by name..."}
                            value={searchFollowingQuery}
                            onChange={(e) => setSearchFollowingQuery(e.target.value)}
                            className={cn(
                              "bg-secondary/60 border border-border/30 rounded-lg h-9 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all text-sm",
                              isRTL ? "pr-9 text-right" : "pl-9"
                            )}
                          />
                        </div>
                      </div>

                      {/* Following List */}
                      <ScrollArea className="flex-1">
                        {followingLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Spinner className="w-5 h-5" />
                          </div>
                        ) : followingList.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <UserPlus className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? "لا توجد متابعات بعد" : "No followers yet"}
                            </p>
                          </div>
                        ) : filteredFollowing.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <Search className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? "لم يتم العثور على نتائج" : "No results found"}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            {filteredFollowing.map((user: any) => (
                              <button
                                key={user.id}
                                onClick={() => {
                                  setSelectedCommunityId(null);
                                  setSelectedUserId(user.id);
                                  setShowNewMessagePopover(false);
                                  setSearchFollowingQuery("");
                                }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/20 last:border-0 text-left"
                              >
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-sm font-bold">
                                    {user.username?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">
                                    {user.full_name || user.username}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    @{user.username}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </>
                  )}

                  {/* Community Tab */}
                  {popoverTab === 'community' && (
                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <label className={cn("text-xs font-semibold text-muted-foreground block mb-1.5", isRTL && "text-right")}>
                          {isRTL ? "اسم المجتمع" : "Community Name"}
                        </label>
                        <Input
                          placeholder={isRTL ? "مثال: عشاق التكنولوجيا" : "e.g., Tech Lovers"}
                          value={newCommunityName}
                          onChange={(e) => setNewCommunityName(e.target.value)}
                          className={cn(
                            "bg-secondary/60 border border-border/30 rounded-lg h-9 text-sm",
                            isRTL && "text-right"
                          )}
                          maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {newCommunityName.length}/100
                        </p>
                      </div>

                      <div>
                        <label className={cn("text-xs font-semibold text-muted-foreground block mb-1.5", isRTL && "text-right")}>
                          {isRTL ? "الوصف (اختياري)" : "Description (optional)"}
                        </label>
                        <Input
                          placeholder={isRTL ? "اكتب وصف قصير..." : "Write a short description..."}
                          value={newCommunityDescription}
                          onChange={(e) => setNewCommunityDescription(e.target.value)}
                          className={cn(
                            "bg-secondary/60 border border-border/30 rounded-lg h-9 text-sm",
                            isRTL && "text-right"
                          )}
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {newCommunityDescription.length}/500
                        </p>
                      </div>

                      <Button
                        onClick={() => {
                          if (newCommunityName.trim()) {
                            createCommunityMutation.mutate({
                              name: newCommunityName,
                              description: newCommunityDescription || undefined
                            });
                            setNewCommunityName("");
                            setNewCommunityDescription("");
                            setShowNewMessagePopover(false);
                            setPopoverTab('chat');
                          }
                        }}
                        disabled={!newCommunityName.trim() || createCommunityMutation.isPending}
                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary rounded-lg h-9 text-sm"
                      >
                        {createCommunityMutation.isPending ? (
                          <>
                            <Spinner className="w-3 h-3 mr-2" />
                            {isRTL ? "جاري الإنشاء..." : "Creating..."}
                          </>
                        ) : (
                          isRTL ? "أنشئ المجتمع" : "Create Community"
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Join Tab */}
                  {popoverTab === 'join' && (
                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <label className={cn("text-xs font-semibold text-muted-foreground block mb-1.5", isRTL && "text-right")}>
                          {isRTL ? "كود الدعوة" : "Invite Code"}
                        </label>
                        <Input
                          placeholder={isRTL ? "مثال: A2B4C8D1" : "e.g., A2B4C8D1"}
                          value={joinInviteCode}
                          onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                          className={cn(
                            "bg-secondary/60 border border-border/30 rounded-lg h-9 text-sm font-mono text-center",
                            isRTL && "text-right"
                          )}
                          maxLength={8}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {isRTL ? "احصل على الكود من صاحب المجتمع" : "Get the code from the community owner"}
                        </p>
                      </div>

                      {joinCommunityMutation.isError && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                          <p className="text-xs text-destructive">
                            {joinCommunityMutation.error instanceof Error 
                              ? joinCommunityMutation.error.message 
                              : isRTL ? "فشل الانضمام إلى المجتمع" : "Failed to join community"}
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          if (joinInviteCode.trim().length === 8) {
                            joinCommunityMutation.mutate(joinInviteCode);
                            setJoinInviteCode("");
                            // Close popover on success
                            setTimeout(() => {
                              setShowNewMessagePopover(false);
                              setPopoverTab('chat');
                            }, 1000);
                          }
                        }}
                        disabled={joinInviteCode.trim().length !== 8 || joinCommunityMutation.isPending}
                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary rounded-lg h-9 text-sm"
                      >
                        {joinCommunityMutation.isPending ? (
                          <>
                            <Spinner className="w-3 h-3 mr-2" />
                            {isRTL ? "جاري الانضمام..." : "Joining..."}
                          </>
                        ) : (
                          isRTL ? "انضم إلى المجتمع" : "Join Community"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className={cn(
                "absolute top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5",
                isRTL ? "right-3" : "left-3"
              )} />
              <Input
                placeholder={isRTL ? "ابحث..." : "Search..."}
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                className={cn(
                  "bg-accent/60 border-0 rounded-xl h-9 text-sm focus-visible:ring-1 focus-visible:ring-primary/50",
                  isRTL ? "pr-9 text-right" : "pl-9"
                )}
              />
            </div>
          </div>

          {/* Tabs for Chats and Communities */}
          <div className={cn("flex border-b border-border/40", isRTL && "flex-row-reverse")}>
            <button
              onClick={() => {
                setSelectedTab('chats');
                setSelectedCommunityId(null);
              }}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-colors relative",
                selectedTab === 'chats'
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isRTL ? "المحادثات" : "Chats"}
              {selectedTab === 'chats' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setSelectedTab('communities');
                setSelectedUserId(null);
              }}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-colors relative",
                selectedTab === 'communities'
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isRTL ? "المجتمعات" : "Communities"}
              {communities.length > 0 && (
                <span className="ml-1 text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                  {communities.length}
                </span>
              )}
              {selectedTab === 'communities' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Conversations List */}
          {selectedTab === 'chats' && (
          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="w-6 h-6" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{isRTL ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Search className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">
                  {isRTL ? `لا نتائج لـ "${conversationSearch}"` : `No results for "${conversationSearch}"`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredConversations.map((conv: any) => {
                  const hasUnread = conv.unreadCount > 0 && selectedUserId !== conv.user?.id;
                  const isVerified = conv.user?.is_verified;
                  const isOfficial = conv.user?.is_official;
                  const isSelected = selectedUserId === conv.user?.id;
                  const isOnline = conv.user?.is_online === true;
                  
                  return (
                    <button
                      key={conv.user?.id}
                      onClick={() => {
                        setSelectedCommunityId(null);
                        setSelectedUserId(conv.user?.id);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 cursor-pointer relative w-full",
                        "transition-colors duration-150",
                        "border-b border-border/20 last:border-0",
                        isRTL ? "text-right flex-row-reverse" : "text-left",
                        isSelected
                          ? "bg-primary/8"
                          : "hover:bg-accent/40 active:bg-accent/60"
                      )}
                    >
                      {/* Avatar Section */}
                      <div className="relative flex-shrink-0">
                        <Avatar className={cn(
                          "w-12 h-12 border-2",
                          isVerified && !isOfficial && "border-blue-500/40",
                          isOfficial && "border-amber-500/40",
                          !isVerified && !isOfficial && "border-border"
                        )}>
                          <AvatarImage src={conv.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.user?.username}`} />
                          <AvatarFallback className={cn(
                            "text-white font-bold text-sm",
                            isVerified && !isOfficial && "bg-gradient-to-br from-blue-500 to-cyan-600",
                            isOfficial && "bg-gradient-to-br from-amber-500 to-orange-600",
                            !isVerified && !isOfficial && "bg-gradient-to-br from-primary to-primary/70"
                          )}>
                            {conv.user?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Online Status */}
                        {isOnline && (
                          <div className={cn(
                            "absolute bottom-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background",
                            isRTL ? "left-0" : "right-0"
                          )} />
                        )}
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                        {/* Name + Time row */}
                        <div className={cn("flex items-center justify-between gap-2", isRTL && "flex-row-reverse")}>
                          <div className={cn("flex items-center gap-1 min-w-0", isRTL && "flex-row-reverse")}>
                            <span className={cn(
                              "text-sm truncate",
                              hasUnread || isSelected ? "font-bold text-foreground" : "font-medium text-foreground/90"
                            )}>
                              {conv.user?.full_name || conv.user?.username}
                            </span>
                            {isVerified && <VerifiedBadge size="sm" />}
                            {isOfficial && <OfficialBadge size="sm" />}
                          </div>
                          <span className={cn(
                            "text-[11px] flex-shrink-0",
                            hasUnread ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {formatConvTime(conv.lastMessage?.created_at, isRTL)}
                          </span>
                        </div>
                        
                        {/* Message preview + unread badge row */}
                        <div className={cn("flex items-center justify-between gap-2", isRTL && "flex-row-reverse")}>
                          <div className={cn("flex items-center gap-1 min-w-0 flex-1", isRTL && "flex-row-reverse")}>
                            {mutedConvIds.has(conv.user?.id) && (
                              <span className="text-[11px] text-muted-foreground flex-shrink-0">🔇</span>
                            )}
                            {conv.lastMessage?.sender_id === currentUser?.id && (
                              <span className={cn("text-[11px] flex-shrink-0", conv.lastMessage?.is_read ? "text-primary" : "text-muted-foreground")}>
                                {conv.lastMessage?.is_read ? "✓✓" : "✓"}
                              </span>
                            )}
                            <span className={cn(
                              "text-xs truncate leading-snug",
                              hasUnread ? "font-medium text-foreground" : "text-muted-foreground"
                            )}>
                              {conv.lastMessage?.image_url?.startsWith('[voice]')
                                ? (isRTL ? "🎤 رسالة صوتية" : "🎤 Voice message")
                                : conv.lastMessage?.image_url
                                ? (isRTL ? "📷 صورة" : "📷 Image")
                                : (conv.lastMessage?.content?.substring(0, 40) || (isRTL ? "ابدأ محادثة..." : "Start chatting..."))}
                            </span>
                          </div>
                          {/* Unread count badge */}
                          {hasUnread && (
                            <div className={cn(
                              "flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center",
                              "text-[11px] font-bold text-white",
                              isVerified && !isOfficial ? "bg-blue-500" : isOfficial ? "bg-amber-500" : "bg-primary"
                            )}>
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          )}

          {/* Communities List */}
          {selectedTab === 'communities' && (
          <ScrollArea className="flex-1">
            {communitiesLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="w-5 h-5" />
              </div>
            ) : communities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <MessageCircle className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "لا توجد مجتمعات بعد" : "No communities yet"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {communities.map((community: any) => (
                  <button
                    key={community.id}
                    onClick={() => {
                      setSelectedUserId(null);
                      setSelectedCommunityId(community.id);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-all duration-300 border-b border-border/20 last:border-0 text-left",
                      community.creator_is_official
                        ? "hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-amber-500/10 bg-gradient-to-r from-purple-900/5 to-amber-900/5 shadow-sm shadow-purple-500/5 ring-1 ring-purple-500/10"
                        : "hover:bg-accent/50",
                      selectedCommunityId === community.id && (
                        community.creator_is_official
                          ? "bg-gradient-to-r from-purple-500/20 to-amber-500/20 ring-1 ring-purple-500/30 shadow-lg shadow-purple-500/20"
                          : "bg-accent/70"
                      )
                    )}
                  >
                    <Avatar className={cn(
                      "w-10 h-10 flex-shrink-0 transition-all duration-300",
                      community.creator_is_official && "ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20"
                    )}>
                      <AvatarImage src={community.avatar_url || undefined} />
                      <AvatarFallback className={cn(
                        "font-bold text-xs",
                        community.creator_is_official
                          ? "bg-gradient-to-br from-purple-600 to-amber-600 text-white"
                          : "bg-gradient-to-br from-primary to-primary/70 text-white"
                      )}>
                        {community.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={cn(
                          "font-semibold text-sm truncate transition-all duration-300",
                          community.creator_is_official && "bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent"
                        )}>
                          {community.name}
                        </p>
                        {community.creator_is_official && (
                          <OfficialBadge size="sm" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {community.member_count || 1} {isRTL ? "عضو" : "members"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          )}
        </div>

        {/* Chat Area */}
        <div className={cn(
            "flex-1 flex flex-col bg-background overflow-hidden gap-0 pb-0",
            (selectedUserId || selectedCommunityId) ? "flex" : "hidden md:flex"
        )}>
            {selectedCommunityId && communities.find(c => c.id === selectedCommunityId) ? (
                <>
                    {/* Community Chat Header — sticky so it stays pinned at top of the messages scroll area without overlay/keyboard glitches */}
                    <div className={cn(
                        "h-16 border-b flex items-center justify-between px-4 shadow-sm",
                        "sticky top-0 left-0 right-0 w-full z-50 shrink-0",
                        currentCommunity?.creator_is_official 
                          ? "bg-gradient-to-r from-purple-900/30 via-purple-800/20 to-amber-700/30 border-b border-purple-500/30 shadow-lg shadow-purple-500/10" 
                          : "border-border/30 bg-gradient-to-r from-background via-background to-primary/5"
                    )}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="md:hidden hover:bg-accent/50 transition-colors h-9 w-9"
                                onClick={() => setSelectedCommunityId(null)}
                            >
                                <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                            </Button>
                            <button 
                              onClick={() => currentCommunity?.avatar_url && setShowCommunityImagePreview(true)}
                              className={cn(
                                "rounded-full hover:opacity-80 transition-opacity",
                                currentCommunity?.avatar_url && "cursor-pointer"
                              )}
                              title={isRTL ? "اضغط لرؤية الصورة" : "Click to view image"}
                            >
                              <Avatar className="w-10 h-10 flex-shrink-0">
                                <AvatarImage src={currentCommunity?.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-sm">
                                  {currentCommunity?.name[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={cn(
                                        "font-semibold text-sm truncate",
                                        currentCommunity?.creator_is_official && "bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent animate-pulse"
                                    )}>
                                        {communities.find(c => c.id === selectedCommunityId)?.name}
                                    </span>
                                    {currentCommunity?.creator_is_official && (
                                        <OfficialBadge size="sm" />
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {communities.find(c => c.id === selectedCommunityId)?.member_count} {isRTL ? "عضو" : "members"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="hover:bg-accent/50 transition-colors h-9 w-9"
                                onClick={() => setShowCommunityInfoModal(true)}
                                title={isRTL ? "معلومات المجتمع" : "Community Info"}
                            >
                                <Info className="w-4 h-4" />
                            </Button>
                            {communities.find(c => c.id === selectedCommunityId)?.created_by === currentUser?.id && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="hover:bg-accent/50 transition-colors h-9 w-9"
                                    onClick={handleOpenEditModal}
                                    title={isRTL ? "تعديل المعلومات" : "Edit Info"}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Community Messages Area + Input Container */}
                    <div className="flex-1 min-h-0 flex flex-col">
                      {currentCommunity?.name === "Bug Hunter" && (
                        <BugSwarmAnimation />
                      )}
                      <ScrollArea className={cn(
                          "flex-1 w-full overflow-y-auto transition-all duration-300 m-0 p-0",
                          currentCommunity?.creator_is_official && currentCommunity?.name !== "Bug Hunter"
                            ? "bg-gradient-to-b from-purple-950/40 via-black to-purple-950/20"
                            : currentCommunity?.name === "Bug Hunter"
                            ? "bg-transparent"
                            : "bg-background"
                      )}>
                        {userKickedStatus?.isKicked ? (
                          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
                            <div className="text-center">
                              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-destructive" />
                              </div>
                              <h3 className="text-lg font-semibold mb-2">
                                {isRTL ? "تم طردك من المجتمع" : "You've been kicked from this community"}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {isRTL ? "لا يمكنك الوصول إلى رسائل هذا المجتمع" : "You no longer have access to this community's messages"}
                              </p>
                              <Button 
                                onClick={() => setSelectedCommunityId(null)}
                                variant="outline"
                              >
                                {isRTL ? "العودة" : "Go Back"}
                              </Button>
                            </div>
                          </div>
                        ) : communityMessagesLoading ? (
                          <div className="flex items-center justify-center py-10">
                            <Spinner className="w-6 h-6" />
                          </div>
                        ) : communityMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <MessageCircle className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? "لا توجد رسائل بعد" : "No messages yet"}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 sm:gap-3 w-full sm:max-w-2xl sm:mx-auto px-2 sm:px-5 pt-2 sm:pt-5 pb-0 flex-1">
                                {communityMessages.map((msg: any) => {
                              const isMe = msg.sender_id === currentUser?.id;
                              const isSystem = msg.is_system_message === true;
                              const currentUserMember = communityMembers.find((m: any) => m.user_id === currentUser?.id);
                              const isAdmin = currentUserMember?.role === 'admin';
                              const isDeleted = msg.is_deleted;

                              // System messages render like normal messages with platform logo avatar
                              if (isSystem && !isDeleted) {
                                return (
                                  <div key={msg.id} className="flex gap-2 group">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                      <AvatarImage src="/assets/novii_logo_transparent.png" alt="النظام" />
                                      <AvatarFallback>N</AvatarFallback>
                                    </Avatar>
                                    <div className="max-w-[70%] flex flex-col gap-1">
                                      <div className="flex items-center gap-1 mb-1 px-2 py-1 rounded-lg">
                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                          {isRTL ? "النظام" : "System"}
                                        </span>
                                      </div>
                                      <div className="rounded-xl px-4 py-2 bg-muted text-foreground">
                                        {msg.content}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div key={msg.id} className={cn("flex gap-2 group", isMe && "flex-row-reverse")}>
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={msg.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`} />
                                    <AvatarFallback>{msg.username?.[0]?.toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className={cn("max-w-[70%] flex flex-col gap-1", isMe && "text-right items-end")}>
                                    {!isDeleted && (
                                      <div className={cn(
                                        "flex items-center gap-1 mb-1 px-2 py-1 rounded-lg transition-all duration-300",
                                        isRTL && "flex-row-reverse",
                                        msg.is_official && !isMe && "bg-gradient-to-r from-purple-600/30 to-pink-600/30 ring-1 ring-purple-500/50 shadow-md shadow-purple-500/20"
                                      )}>
                                        <VerifiedUsername
                                          username={msg.username}
                                          isVerified={msg.is_verified}
                                          className={cn("text-xs", msg.is_official && !isMe && "font-bold")}
                                        />
                                        {msg.is_verified && (
                                          <VerifiedBadge size="sm" />
                                        )}
                                        {msg.is_official && (
                                          <OfficialBadge size="sm" />
                                        )}
                                      </div>
                                    )}
                                    <div className="relative">
                                      {isDeleted ? (
                                        <div className="rounded-xl px-4 py-2 bg-muted/50 text-muted-foreground italic flex items-center gap-2">
                                          <Trash2 className="w-3 h-3 text-destructive/50" />
                                          <span className="text-xs">
                                            {isRTL ? "تم حذف هذه الرسالة بواسطة الأدمن" : "This message was deleted by an admin"}
                                          </span>
                                        </div>
                                      ) : (
                                        <>
                                          <div className={cn(
                                            "rounded-xl px-4 py-2 transition-all duration-300",
                                            isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                                            msg.is_official && !isMe && "bg-gradient-to-br from-purple-600/40 via-pink-600/30 to-purple-600/40 shadow-lg shadow-purple-500/40 ring-1.5 ring-purple-400/50 hover:shadow-xl hover:shadow-purple-500/50 hover:ring-purple-400/70",
                                            currentCommunity?.creator_is_official && !isMe && !msg.is_official && "shadow-lg shadow-purple-500/30 ring-1 ring-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40"
                                          )}>
                                            {msg.content}
                                          </div>
                                          {isAdmin && (
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                                              onClick={() => deleteMessageMutation.mutate({ communityId: selectedCommunityId!, messageId: msg.id })}
                                              disabled={deleteMessageMutation.isPending}
                                              title={isRTL ? "حذف الرسالة" : "Delete message"}
                                            >
                                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                            </Button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Typing Indicator with Animation 🎹 */}
                            {communityTypingUsers.length > 0 && (
                              <div className="flex flex-col gap-2 mt-2">
                                {communityTypingUsers.map((typingUser: any) => (
                                  <div key={typingUser.user_id} className="flex gap-2 animate-pulse">
                                    <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-primary/50">
                                      <AvatarImage src={typingUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${typingUser.username}`} />
                                      <AvatarFallback>{typingUser.username?.[0]?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-1">
                                      <p className="text-xs text-primary font-semibold">
                                        {typingUser.username}
                                      </p>
                                      <div className="bg-muted/70 rounded-xl px-3 py-2 flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">
                                          {isRTL ? "جاري الكتابة" : "typing"}
                                        </span>
                                        <span className="flex gap-0.5 ml-1">
                                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                            {/* Mobile spacer so the last message clears the fixed composer above the keyboard */}
                            <div className="h-20 md:hidden" aria-hidden />
                          </div>
                        )}
                      </ScrollArea>

                      {/* Desktop Input Box - Community Chat */}
                      <div className="hidden md:flex px-4 py-3 bg-background border-t border-border shrink-0 gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={communityMessageInput}
                            disabled={userMuteStatus?.isMuted || userKickedStatus?.isKicked}
                            onChange={(e) => {
                              if (userMuteStatus?.isMuted || userKickedStatus?.isKicked) return;
                              setCommunityMessageInput(e.target.value);
                              if (selectedCommunityId && currentUser) {
                                api.updateCommunityTypingStatus(selectedCommunityId, true);
                                if (communityTypingTimeoutRef.current) clearTimeout(communityTypingTimeoutRef.current);
                                communityTypingTimeoutRef.current = setTimeout(() => {
                                  api.updateCommunityTypingStatus(selectedCommunityId, false);
                                }, 3000);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (userMuteStatus?.isMuted || userKickedStatus?.isKicked) return;
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (communityMessageInput.trim() && selectedCommunityId) {
                                  sendCommunityMessageMutation.mutate({ communityId: selectedCommunityId, content: communityMessageInput });
                                  setCommunityMessageInput("");
                                  api.updateCommunityTypingStatus(selectedCommunityId, false);
                                }
                              }
                            }}
                            placeholder={
                              userKickedStatus?.isKicked
                                ? (isRTL ? "مطرود من المجتمع..." : "You are kicked...")
                                : userMuteStatus?.isMuted
                                ? (isRTL ? "أنت معطل..." : "You are muted...")
                                : (isRTL ? "اكتب رسالة..." : "Type a message...")
                            }
                            className={cn(
                              "flex-1 rounded-full bg-secondary/60 border border-border/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all h-10 text-sm px-4",
                              isRTL && "text-right",
                              (userMuteStatus?.isMuted || userKickedStatus?.isKicked) && "opacity-50 cursor-not-allowed"
                            )}
                          />
                          <Button
                            onClick={() => {
                              if (communityMessageInput.trim() && selectedCommunityId) {
                                sendCommunityMessageMutation.mutate({ communityId: selectedCommunityId, content: communityMessageInput });
                                setCommunityMessageInput("");
                              }
                            }}
                            disabled={!communityMessageInput.trim() || sendCommunityMessageMutation.isPending || userMuteStatus?.isMuted || userKickedStatus?.isKicked}
                            className="rounded-full flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg transition-all h-10 w-10 p-0"
                            size="icon"
                          >
                            {sendCommunityMessageMutation.isPending ? (
                              <Spinner className="w-4 h-4" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                </>
            ) : selectedUserId && selectedConversation ? (
                <>
                    {/* Chat Header — sticky so it stays visible above the messages
                         even when the mobile keyboard pushes the layout up. */}
                    <div className={cn(
                        "h-16 border-b border-border/30 flex items-center justify-between px-4 bg-gradient-to-r from-background via-background to-primary/5 shadow-sm",
                        "sticky top-0 left-0 right-0 w-full z-50 shrink-0",
                        "md:relative md:static md:z-20"
                    )}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="md:hidden hover:bg-accent/50 transition-colors h-9 w-9"
                                onClick={() => setSelectedUserId(null)}
                            >
                                <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                            </Button>
                            <Link href={`/user?id=${selectedConversation.user?.id}`}>
                                <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ring-2 ring-primary/20">
                                    <AvatarImage src={selectedConversation.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.user?.username}`} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-xs">{selectedConversation.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Link href={`/user?id=${selectedConversation.user?.id}`} className="font-semibold text-sm truncate hover:text-primary transition-colors">
                                        {selectedConversation.user?.full_name || selectedConversation.user?.username}
                                    </Link>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {selectedConversation.user?.is_verified && (
                                        <VerifiedBadge size="sm" />
                                      )}
                                      {selectedConversation.user?.is_official && (
                                        <OfficialBadge size="sm" />
                                      )}
                                    </div>
                                </div>
                                {selectedConversation.user?.is_online ? (
                                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
                                    {isRTL ? "نشط الآن" : "Active now"}
                                  </span>
                                ) : selectedConversation.user?.last_seen ? (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {isRTL ? "آخر ظهور " : "Last seen "}
                                    {formatDistanceToNow(new Date(selectedConversation.user.last_seen), { addSuffix: true, locale: isRTL ? ar : undefined })}
                                  </span>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("hover:bg-accent/50 transition-colors h-9 w-9", isMutedConv ? "text-orange-500" : "text-muted-foreground hover:text-foreground")}
                              onClick={toggleMuteConv}
                              title={isMutedConv ? (isRTL ? "إلغاء الكتم" : "Unmute") : (isRTL ? "كتم الإشعارات" : "Mute notifications")}
                            >
                              {isMutedConv ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground h-9 w-9">
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground h-9 w-9">
                              <Video className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground h-9 w-9">
                              <Info className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-2 sm:p-5 bg-background overflow-y-auto w-full">
                        {messagesLoading ? (
                          <div className="flex items-center justify-center py-10">
                            <Spinner className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 sm:gap-3 w-full sm:max-w-2xl sm:mx-auto">
                            {/* Profile Header Card */}
                            <div className="flex flex-col items-center justify-center py-4 sm:py-8 mb-2 sm:mb-4">
                              <Avatar className="w-16 sm:w-24 h-16 sm:h-24 ring-4 ring-primary/30 mb-2 sm:mb-4">
                                <AvatarImage src={selectedConversation.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.user?.username}`} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-2xl">
                                  {selectedConversation.user?.username?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <VerifiedUsername 
                                  username={selectedConversation.user?.full_name || selectedConversation.user?.username}
                                  isVerified={selectedConversation.user?.is_verified}
                                  className="text-base sm:text-xl"
                                />
                                <div className="flex items-center gap-1">
                                  {selectedConversation.user?.is_verified && (
                                    <VerifiedBadge size="sm" />
                                  )}
                                  {selectedConversation.user?.is_official && (
                                    <OfficialBadge size="sm" />
                                  )}
                                  {selectedConversation.user?.is_creator && (
                                    <CreatorBadge size="sm" />
                                  )}
                                  {selectedConversation.user?.is_premium && (
                                    <PremiumBadge size="sm" />
                                  )}
                                  {selectedConversation.user?.is_popular && (
                                    <PopularBadge size="sm" />
                                  )}
                                  {selectedConversation.user?.is_active && (
                                    <ActiveBadge size="sm" />
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                                @{selectedConversation.user?.username}
                              </p>
                              
                              <Link href={`/user?id=${selectedConversation.user?.id}`}>
                                <Button variant="outline" className="rounded-full px-6 sm:px-8 border-primary/30 hover:bg-primary/10 text-xs sm:text-sm">
                                  {isRTL ? "عرض الملف الشخصي" : "View Profile"}
                                </Button>
                              </Link>
                            </div>
                            
                            {/* Divider */}
                            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-4" />
                            
                            {(() => {
                              let shownUnread = false;
                              return (messages as any[]).map((msg: any) => {
                                const isMe = msg.sender_id === currentUser?.id;
                                const isUnread = !isMe && !msg.is_read;
                                const showUnreadSep = isUnread && !shownUnread;
                                if (showUnreadSep) shownUnread = true;
                                return (
                                  <div key={msg.id}>
                                    {showUnreadSep && (
                                      <div className="flex items-center gap-2 my-3 px-2">
                                        <div className="flex-1 h-px bg-primary/30" />
                                        <span className="text-[10px] text-primary font-semibold px-2 py-0.5 rounded-full bg-primary/10">
                                          {isRTL ? "رسائل جديدة" : "New Messages"}
                                        </span>
                                        <div className="flex-1 h-px bg-primary/30" />
                                      </div>
                                    )}
                                    <MessageBubble
                                      message={msg}
                                      isMe={isMe}
                                      otherUser={selectedConversation.user}
                                      currentUserId={currentUser?.id}
                                      onStoryClick={(storyId) => {
                                        setSelectedStoryId(storyId);
                                        setIsStoryViewerOpen(true);
                                      }}
                                      onReply={(m) => { setReplyingTo(m); }}
                                      onForward={(m) => { setReplyingTo(m); }}
                                      allUsers={conversations.map((c: any) => c.user).filter(Boolean)}
                                    />
                                  </div>
                                );
                              });
                            })()}
                            
                            {/* Typing Indicator */}
                            {isTyping && (
                              <div className="flex w-full justify-start gap-2 animate-in slide-in-from-bottom-2 duration-300">
                                <Avatar className="w-8 h-8 mt-1">
                                  <AvatarImage src={selectedConversation.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.user?.username}`} />
                                  <AvatarFallback>{selectedConversation.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="max-w-[70%] rounded-xl px-4 py-2 bg-muted text-foreground">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                            {/* Mobile spacer so the last message clears the fixed composer above the keyboard */}
                            <div className="h-20 md:hidden" aria-hidden />
                          </div>
                        )}
                    </ScrollArea>

                    {/* Desktop Input Box */}
                    <div className="hidden md:flex px-4 py-3 border-0 bg-background border-t border-border shrink-0 m-0 gap-0">
                      {/* Community Input */}
                      {selectedCommunityId && (
                        <div className="flex items-end gap-1 w-full leading-none pb-1 m-0">
                          <Input 
                            value={communityMessageInput}
                            disabled={userMuteStatus?.isMuted || userKickedStatus?.isKicked}
                            onChange={(e) => {
                              if (userMuteStatus?.isMuted || userKickedStatus?.isKicked) return;
                              setCommunityMessageInput(e.target.value);
                              if (selectedCommunityId && currentUser) {
                                api.updateCommunityTypingStatus(selectedCommunityId, true);
                                if (communityTypingTimeoutRef.current) clearTimeout(communityTypingTimeoutRef.current);
                                communityTypingTimeoutRef.current = setTimeout(() => {
                                  api.updateCommunityTypingStatus(selectedCommunityId, false);
                                }, 3000);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (userMuteStatus?.isMuted || userKickedStatus?.isKicked) return;
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (communityMessageInput.trim() && selectedCommunityId) {
                                  sendCommunityMessageMutation.mutate({ communityId: selectedCommunityId, content: communityMessageInput });
                                  api.updateCommunityTypingStatus(selectedCommunityId, false);
                                }
                              }
                            }}
                            placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."} 
                            className="flex-1 rounded-lg bg-secondary/60 border border-border/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all h-9 text-sm px-3 py-0 m-0"
                          />
                          <Button 
                            onClick={() => {
                              if (communityMessageInput.trim() && selectedCommunityId) {
                                sendCommunityMessageMutation.mutate({ communityId: selectedCommunityId, content: communityMessageInput });
                              }
                            }}
                            disabled={!communityMessageInput.trim() || sendCommunityMessageMutation.isPending || userMuteStatus?.isMuted || userKickedStatus?.isKicked}
                            className="rounded-full flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg transition-all h-9 w-9 p-0 m-0"
                            size="icon" 
                          >
                            {sendCommunityMessageMutation.isPending ? (
                              <Spinner className="w-4 h-4" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Direct Message Input */}
                      {selectedUserId && (
                        <div className="flex flex-col w-full gap-1">
                          {/* Reply Bar */}
                          {replyingTo && (
                            <div className={cn("flex items-center gap-2 px-2 py-1.5 bg-accent/30 rounded-lg border-l-4 border-primary mx-1", isRTL && "border-l-0 border-r-4 flex-row-reverse")}>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-primary font-semibold">{isRTL ? "ردًا على" : "Replying to"} {replyingTo.sender?.username || (replyingTo.sender_id === currentUser?.id ? (isRTL ? "أنت" : "You") : "")}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {replyingTo.image_url?.startsWith('[voice]') ? (isRTL ? "🎤 رسالة صوتية" : "🎤 Voice message") : replyingTo.image_url ? (isRTL ? "📷 صورة" : "📷 Image") : replyingTo.content}
                                </p>
                              </div>
                              <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => setReplyingTo(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}

                          {/* Emoji Picker */}
                          {showEmojiPicker && (
                            <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-lg border border-border max-h-32 overflow-y-auto mx-1">
                              {EMOJI_LIST.map(emoji => (
                                <button key={emoji} onClick={() => setMessageInput(prev => prev + emoji)} className="text-lg hover:scale-125 transition-transform leading-none">
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex items-end gap-1 w-full leading-none pb-1 m-0">
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                            <Button variant="ghost" size="icon" className="hover:bg-accent/50 flex-shrink-0 h-9 w-9 p-0 m-0 text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:bg-accent/50 flex-shrink-0 h-9 w-9 p-0 m-0 text-muted-foreground" onClick={() => setShowEmojiPicker(p => !p)}>
                              <Smile className="w-4 h-4" />
                            </Button>

                            {isRecording ? (
                              <div className="flex-1 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 h-9">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-xs text-red-500 font-mono">{String(Math.floor(recordingSeconds/60)).padStart(2,'0')}:{String(recordingSeconds%60).padStart(2,'0')}</span>
                                <span className="text-xs text-muted-foreground flex-1">{isRTL ? "جارٍ التسجيل..." : "Recording..."}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={cancelRecording} title={isRTL ? "إلغاء" : "Cancel"}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Input
                                value={messageInput}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."}
                                className="flex-1 rounded-lg bg-secondary/60 border border-border/30 focus-visible:ring-2 focus-visible:ring-primary/50 h-9 text-sm px-3 py-0 m-0"
                              />
                            )}

                            {/* Mic or Send */}
                            {(messageInput.trim() || selectedImage) ? (
                              <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending} className="rounded-full flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg h-9 w-9 p-0 m-0" size="icon">
                                {sendMessageMutation.isPending ? <Spinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                              </Button>
                            ) : isRecording ? (
                              <Button onClick={handleSendVoice} className="rounded-full flex-shrink-0 bg-red-500 hover:bg-red-600 shadow-lg h-9 w-9 p-0 m-0" size="icon">
                                <Send className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button onMouseDown={startRecording} variant="ghost" size="icon" className="hover:bg-accent/50 flex-shrink-0 h-9 w-9 p-0 m-0 text-muted-foreground" title={isRTL ? "اضغط مطولاً للتسجيل" : "Hold to record"} onClick={startRecording}>
                                <Mic className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {isRTL ? "رسائلك" : "Your Messages"}
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      {isRTL ? "أرسل رسائل خاصة إلى صديق أو مجموعة" : "Send private messages to a friend or group"}
                    </p>
                </div>
            )}
        </div>
      </div>

      {/* Mobile input pinned to bottom of viewport. Uses 100dvh on the page wrapper so the on-screen keyboard shrinks the viewport and this stays visible just above the keyboard. */}
      {(selectedUserId || selectedCommunityId) && (
        <div className="md:hidden fixed inset-x-0 bottom-0 border-t border-border/40 bg-background z-50 flex flex-col px-0 py-0 m-0 gap-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {/* Image Preview for Direct Messages */}
          {previewUrl && (
            <div className="py-0 px-0 relative w-full m-0">
              <div className="inline-block relative">
                <img src={previewUrl} alt="Preview" className="max-h-12 rounded-lg shadow-md group-hover:shadow-lg transition-shadow" />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90 shadow-lg transition-all"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          <div className="h-16 flex items-center px-2 sm:px-4">
            {/* Community Input */}
            {selectedCommunityId && (
            <div className="flex items-end gap-0 w-full leading-none pb-0 m-0 py-0">
              <Input 
                value={communityMessageInput}
                disabled={userMuteStatus?.isMuted || userKickedStatus?.isKicked}
                onChange={(e) => {
                  if (userMuteStatus?.isMuted || userKickedStatus?.isKicked) return;
                  
                  setCommunityMessageInput(e.target.value);
                  
                  if (selectedCommunityId && currentUser) {
                    api.updateCommunityTypingStatus(selectedCommunityId, true);
                    if (communityTypingTimeoutRef.current) {
                      clearTimeout(communityTypingTimeoutRef.current);
                    }
                    communityTypingTimeoutRef.current = setTimeout(() => {
                      api.updateCommunityTypingStatus(selectedCommunityId, false);
                    }, 3000);
                  }
                }}
                onKeyDown={(e) => {
                  if (userMuteStatus?.isMuted || userKickedStatus?.isKicked) return;
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (communityMessageInput.trim() && selectedCommunityId) {
                      sendCommunityMessageMutation.mutate({ communityId: selectedCommunityId, content: communityMessageInput });
                      api.updateCommunityTypingStatus(selectedCommunityId, false);
                    }
                  }
                }}
                placeholder={userKickedStatus?.isKicked ? (isRTL ? "مطرود..." : "You are kicked...") : userMuteStatus?.isMuted ? (isRTL ? "معموله كتم..." : "You are muted...") : (isRTL ? "اكتب رسالة..." : "Type a message...")} 
                className={cn(
                  "flex-1 rounded-lg sm:rounded-2xl bg-secondary/60 border border-border/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all h-8 sm:h-9 text-xs sm:text-sm px-3 py-0 m-0",
                  isRTL && "text-right",
                  (userMuteStatus?.isMuted || userKickedStatus?.isKicked) && "opacity-50 cursor-not-allowed bg-destructive/5"
                )}
              />
              <Button 
                onClick={() => {
                  if (communityMessageInput.trim() && selectedCommunityId) {
                    sendCommunityMessageMutation.mutate({ communityId: selectedCommunityId, content: communityMessageInput });
                  }
                }}
                disabled={!communityMessageInput.trim() || sendCommunityMessageMutation.isPending || userMuteStatus?.isMuted || userKickedStatus?.isKicked}
                className="rounded-full flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg transition-all h-8 w-8 sm:h-9 sm:w-9 p-0 m-0 ml-1"
                size="icon" 
              >
                {sendCommunityMessageMutation.isPending ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
              </div>
            )}
            
            {/* Direct Message Input - Mobile Enhanced */}
            {selectedUserId && (
            <div className="flex flex-col w-full gap-1">
              {/* Reply Bar - Mobile */}
              {replyingTo && (
                <div className={cn("flex items-center gap-2 px-2 py-1.5 bg-accent/30 rounded-lg border-l-4 border-primary mx-1", isRTL && "border-l-0 border-r-4 flex-row-reverse")}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-primary font-semibold">{isRTL ? "ردًا على" : "Replying to"} {replyingTo.sender?.username || (replyingTo.sender_id === currentUser?.id ? (isRTL ? "أنت" : "You") : "")}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {replyingTo.image_url?.startsWith('[voice]') ? (isRTL ? "🎤 رسالة صوتية" : "🎤 Voice message") : replyingTo.image_url ? (isRTL ? "📷 صورة" : "📷 Image") : replyingTo.content}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => setReplyingTo(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              {/* Emoji Picker - Mobile */}
              {showEmojiPicker && (
                <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-lg border border-border max-h-28 overflow-y-auto mx-1">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} onClick={() => setMessageInput(prev => prev + emoji)} className="text-lg hover:scale-125 transition-transform leading-none">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-0 w-full leading-none pb-0 m-0 py-0">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <Button variant="ghost" size="icon" className="hover:bg-accent/50 flex-shrink-0 h-8 w-8 p-0 m-0 text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-accent/50 flex-shrink-0 h-8 w-8 p-0 m-0 text-muted-foreground" onClick={() => setShowEmojiPicker(p => !p)}>
                  <Smile className="w-4 h-4" />
                </Button>

                {isRecording ? (
                  <div className="flex-1 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-2 h-8">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-500 font-mono">{String(Math.floor(recordingSeconds/60)).padStart(2,'0')}:{String(recordingSeconds%60).padStart(2,'0')}</span>
                    <span className="text-xs text-muted-foreground flex-1">{isRTL ? "تسجيل..." : "Rec..."}</span>
                    <button onClick={cancelRecording} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <Input
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."}
                    className={cn("flex-1 rounded-lg bg-secondary/60 border border-border/30 focus-visible:ring-2 focus-visible:ring-primary/50 h-8 text-xs px-3 py-0 m-0", isRTL && "text-right")}
                  />
                )}

                {(messageInput.trim() || selectedImage) ? (
                  <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending} className="rounded-full flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 shadow-lg h-8 w-8 p-0 m-0 ml-1" size="icon">
                    {sendMessageMutation.isPending ? <Spinner className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                ) : isRecording ? (
                  <Button onClick={handleSendVoice} className="rounded-full flex-shrink-0 bg-red-500 hover:bg-red-600 shadow-lg h-8 w-8 p-0 m-0 ml-1" size="icon">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button onClick={startRecording} variant="ghost" size="icon" className="hover:bg-accent/50 flex-shrink-0 h-8 w-8 p-0 m-0 ml-0 text-muted-foreground">
                    <Mic className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-border/30">
              <h2 className="font-semibold">
                {isRTL ? "قص الصورة" : "Crop Image"}
              </h2>
            </div>

            {/* Crop Area */}
            <div className="relative w-full bg-black" style={{ height: '400px' }}>
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={true}
                onCropChange={setCrop}
                onCropComplete={(croppedArea, croppedAreaPixels) => {
                  setCroppedAreaPixels(croppedAreaPixels);
                }}
                onZoomChange={setZoom}
                onMediaLoaded={() => {
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                }}
              />
            </div>

            {/* Zoom Slider */}
            <div className="p-4 border-t border-border/30 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isRTL ? "التكبير/التصغير" : "Zoom"}
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {zoom.toFixed(1)}x
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCropModal(false);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button 
                  onClick={handleCropComplete}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isRTL ? "تطبيق القص" : "Apply Crop"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Image Preview Modal */}
      {showCommunityImagePreview && currentCommunity?.avatar_url && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowCommunityImagePreview(false)}>
          <div className="relative max-w-2xl w-full h-auto" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowCommunityImagePreview(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 transition-colors rounded-full p-2"
            >
              <ChevronLeft className={cn("w-6 h-6 text-white", isRTL && "rotate-180")} />
            </button>
            <img 
              src={currentCommunity.avatar_url} 
              alt={currentCommunity.name}
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <div className="mt-4 text-center text-white">
              <h3 className="text-lg font-semibold">{currentCommunity.name}</h3>
              <p className="text-sm text-gray-400">
                {currentCommunity.member_count} {isRTL ? "عضو" : "members"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {showEditCommunityModal && selectedCommunityId && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="font-semibold">
                {isRTL ? "تعديل المجتمع" : "Edit Community"}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowEditCommunityModal(false)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={editCommunityImagePreview || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-lg">
                    {editCommunityName[0]?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={editImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditCommunityImageChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editImageInputRef.current?.click()}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {isRTL ? "تغيير الصورة" : "Change Photo"}
                </Button>
              </div>

              {/* Community Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isRTL ? "اسم المجتمع" : "Community Name"}
                </label>
                <Input
                  value={editCommunityName}
                  onChange={(e) => setEditCommunityName(e.target.value)}
                  placeholder={isRTL ? "اسم المجتمع" : "Community name"}
                  className="rounded-lg"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isRTL ? "الوصف" : "Description"}
                </label>
                <textarea
                  value={editCommunityDescription}
                  onChange={(e) => setEditCommunityDescription(e.target.value)}
                  placeholder={isRTL ? "وصف المجتمع" : "Community description"}
                  className="w-full rounded-lg bg-secondary/60 border border-border/30 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  rows={4}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/30 flex items-center justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditCommunityModal(false)}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                onClick={() => updateCommunityMutation.mutate()}
                disabled={updateCommunityMutation.isPending}
                className="gap-2"
              >
                {updateCommunityMutation.isPending ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    {isRTL ? "جاري الحفظ..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {isRTL ? "حفظ" : "Save"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedCommunityId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="font-semibold">
                {isRTL ? "إدارة الأعضاء" : "Manage Members"}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowMembersModal(false)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 py-2 border-b border-border/30">
              <Button
                variant={membersModalTab === 'active' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMembersModalTab('active')}
                className="h-8"
              >
                {isRTL ? `النشطون (${communityMembers.length})` : `Active (${communityMembers.length})`}
              </Button>
              <Button
                variant={membersModalTab === 'kicked' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMembersModalTab('kicked')}
                className="h-8"
              >
                {isRTL ? `المطرودون (${kickedMembers.length})` : `Kicked (${kickedMembers.length})`}
              </Button>
            </div>

            {/* Members List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {(membersModalTab === 'active' ? communityMembers : kickedMembers).map((member: any) => {
                  const isAdmin = member.role === 'admin';
                  const isCurrentUser = member.user_id === currentUser?.id;
                  const isMuted = member.is_muted;
                  const canModerate = communities.find(c => c.id === selectedCommunityId)?.created_by === currentUser?.id;

                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.profiles?.username}`} />
                          <AvatarFallback>{member.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {member.profiles?.username}
                            {isAdmin && <Crown className="w-3 h-3 inline-block ml-1 text-yellow-500" />}
                          </p>
                          {isMuted && (
                            <p className="text-xs text-destructive">
                              {isRTL ? "مكتوم الصوت" : "Muted"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Moderation Menu */}
                      {canModerate && !isCurrentUser && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 ml-2"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48" align="end">
                            <div className="space-y-2">
                              {/* Make Admin (owner only, not for current admin) */}
                              {!isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-blue-600 hover:text-blue-600 hover:bg-blue-500/10"
                                  onClick={() => makeAdminMutation.mutate(member.user_id)}
                                  disabled={makeAdminMutation.isPending}
                                >
                                  <Crown className="w-4 h-4 mr-2" />
                                  {isRTL ? "اجعله أدمن" : "Make Admin"}
                                </Button>
                              )}
                              
                              {/* Remove Admin (owner only, only for admins) */}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-orange-600 hover:text-orange-600 hover:bg-orange-500/10"
                                  onClick={() => removeAdminMutation.mutate(member.user_id)}
                                  disabled={removeAdminMutation.isPending}
                                >
                                  <ChevronDown className="w-4 h-4 mr-2" />
                                  {isRTL ? "إزالة الأدمن" : "Remove Admin"}
                                </Button>
                              )}
                              
                              {/* Mute/Unmute (only for non-admin members) */}
                              {!isAdmin && (
                                <>
                                  {!isMuted ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => muteMemberMutation.mutate({ targetUserId: member.user_id })}
                                        disabled={muteMemberMutation.isPending}
                                      >
                                        <VolumeX className="w-4 h-4 mr-2" />
                                        {isRTL ? "كتم نهائي" : "Permanent Mute"}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-yellow-600 hover:text-yellow-600 hover:bg-yellow-500/10"
                                        onClick={() => {
                                          tempMuteMemberMutation.mutate({ 
                                            targetUserId: member.user_id, 
                                            durationMinutes: tempMuteDuration 
                                          });
                                        }}
                                        disabled={tempMuteMemberMutation.isPending}
                                      >
                                        <Clock className="w-4 h-4 mr-2" />
                                        {isRTL ? `كتم ${tempMuteDuration} دقيقة` : `Mute ${tempMuteDuration}m`}
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-green-600 hover:text-green-600 hover:bg-green-500/10"
                                      onClick={() => unmuteMemberMutation.mutate(member.user_id)}
                                      disabled={unmuteMemberMutation.isPending}
                                    >
                                      <Volume2 className="w-4 h-4 mr-2" />
                                      {isRTL ? "رفع الكتم" : "Unmute"}
                                    </Button>
                                  )}
                                </>
                              )}

                              {/* Kick or Unkick based on tab */}
                              {membersModalTab === 'active' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => kickMemberMutation.mutate({ targetUserId: member.user_id })}
                                  disabled={kickMemberMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {isRTL ? "طرد" : "Kick"}
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-green-600 hover:text-green-600 hover:bg-green-500/10"
                                  onClick={() => unkickMemberMutation.mutate(member.user_id)}
                                  disabled={unkickMemberMutation.isPending}
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  {isRTL ? "فك الطرد" : "Unkick"}
                                </Button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Community Info Modal */}
      {showCommunityInfoModal && selectedCommunityId && currentCommunity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="font-semibold">
                {isRTL ? "معلومات المجتمع" : "Community Info"}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowCommunityInfoModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 py-2 border-b border-border/30">
              <Button
                variant={membersModalTab === 'active' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMembersModalTab('active')}
                className="h-8"
              >
                {isRTL ? "معلومات" : "Info"}
              </Button>
              <Button
                variant={membersModalTab === 'kicked' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMembersModalTab('kicked')}
                className="h-8"
              >
                {isRTL ? `الأعضاء (${communityMembers.length})` : `Members (${communityMembers.length})`}
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {membersModalTab === 'active' ? (
                  <>
                    {/* Community Info Section */}
                    <div className="space-y-4">
                      {/* Avatar */}
                      <div className="flex justify-center">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={currentCommunity?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold">
                            {currentCommunity?.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Name & Official Badge */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{currentCommunity?.name}</h3>
                          {currentCommunity?.creator_is_official && (
                            <OfficialBadge size="sm" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? `${communityMembers.length} أعضاء` : `${communityMembers.length} members`}
                        </p>
                      </div>

                      {/* Description */}
                      {currentCommunity?.description && (
                        <div className="bg-accent/30 rounded-lg p-3">
                          <p className="text-sm">{currentCommunity.description}</p>
                        </div>
                      )}

                      {/* Invite Code */}
                      <div className="bg-accent/30 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                          {isRTL ? "رمز الدعوة" : "Invite Code"}
                        </p>
                        <div className="flex items-center justify-between gap-2 bg-background/50 p-2 rounded">
                          <code className="text-sm font-mono">{currentCommunity?.invite_code}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => {
                              navigator.clipboard.writeText(currentCommunity?.invite_code);
                              toast.success(isRTL ? "تم نسخ الرمز" : "Code copied!");
                            }}
                          >
                            {isRTL ? "نسخ" : "Copy"}
                          </Button>
                        </div>
                      </div>

                      {/* Edit Button (Owner Only) */}
                      {currentCommunity?.created_by === currentUser?.id && (
                        <Button
                          onClick={() => {
                            setShowCommunityInfoModal(false);
                            handleOpenEditModal();
                          }}
                          className="w-full gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          {isRTL ? "تعديل المعلومات" : "Edit Info"}
                        </Button>
                      )}

                      {/* Notifications mute toggle (any member) */}
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          if (!selectedCommunityId) return;
                          toggleNotificationsMutation.mutate({ communityId: selectedCommunityId, muted: !notificationsMuted });
                        }}
                        disabled={toggleNotificationsMutation.isPending}
                        data-testid="button-toggle-community-notifications"
                      >
                        {notificationsMuted
                          ? (isRTL ? "إلغاء كتم الإشعارات" : "Unmute notifications")
                          : (isRTL ? "كتم الإشعارات" : "Mute notifications")}
                      </Button>

                      {/* Leave / Delete community */}
                      {currentCommunity?.created_by === currentUser?.id ? (
                        <Button
                          variant="destructive"
                          className="w-full gap-2"
                          onClick={() => {
                            if (!selectedCommunityId) return;
                            const ok = window.confirm(isRTL
                              ? `هل تريد حذف مجتمع "${currentCommunity?.name}" نهائياً؟ لا يمكن التراجع.`
                              : `Permanently delete community "${currentCommunity?.name}"? This cannot be undone.`);
                            if (ok) deleteCommunityMutation.mutate(selectedCommunityId);
                          }}
                          disabled={deleteCommunityMutation.isPending}
                          data-testid="button-delete-community"
                        >
                          {isRTL ? "حذف المجتمع" : "Delete community"}
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          className="w-full gap-2"
                          onClick={() => {
                            if (!selectedCommunityId) return;
                            const ok = window.confirm(isRTL
                              ? `هل تريد مغادرة مجتمع "${currentCommunity?.name}"؟`
                              : `Leave community "${currentCommunity?.name}"?`);
                            if (ok) leaveCommunityMutation.mutate(selectedCommunityId);
                          }}
                          disabled={leaveCommunityMutation.isPending}
                          data-testid="button-leave-community"
                        >
                          {isRTL ? "مغادرة المجتمع" : "Leave community"}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Members List */}
                    <div className="space-y-2">
                      {communityMembers.map((member: any) => {
                        const isAdmin = member.role === 'admin';
                        const isCurrentUser = member.user_id === currentUser?.id;
                        const isMuted = member.is_muted;

                        return (
                          <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarImage src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.profiles?.username}`} />
                                <AvatarFallback>{member.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {member.profiles?.username}
                                  {isAdmin && <Crown className="w-3 h-3 inline-block ml-1 text-yellow-500" />}
                                </p>
                                {isMuted && (
                                  <p className="text-xs text-destructive">
                                    {isRTL ? "مكتوم الصوت" : "Muted"}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStoryId && (
        <StoryViewerModal
          stories={allStories.filter(s => s.id === selectedStoryId).length > 0 
            ? allStories.filter(s => s.id === selectedStoryId) 
            : allStories}
          initialIndex={allStories.findIndex(s => s.id === selectedStoryId) || 0}
          open={isStoryViewerOpen}
          onOpenChange={setIsStoryViewerOpen}
          isRTL={isRTL}
          currentUserId={currentUser?.id}
        />
      )}
    </Layout>
  );
}
