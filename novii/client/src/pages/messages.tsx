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
  const isRTL = direction === "rtl";
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [showNewMessagePopover, setShowNewMessagePopover] = useState(false);
  const [searchFollowingQuery, setSearchFollowingQuery] = useState("");
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

  // Hide bottom nav in mobile when chat/community is selected
  useEffect(() => {
    localStorage.setItem('chatActive', selectedUserId || selectedCommunityId ? 'true' : 'false');
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

  // Send community message mutation
  const sendCommunityMessageMutation = useMutation({
    mutationFn: async ({ communityId, content }: { communityId: string; content: string }) =>
      api.sendCommunityMessage(communityId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityMessages', selectedCommunityId, currentUser?.id] });
      setCommunityMessageInput("");
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

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: () => api.getConversations(),
    enabled: !!currentUser,
  });

  // Fetch following list
  const { data: followingList = [], isLoading: followingLoading } = useQuery({
    queryKey: ['following', currentUser?.id],
    queryFn: () => currentUser ? api.getFollowing(currentUser.id) : Promise.resolve([]),
    enabled: !!currentUser && showNewMessagePopover,
  });

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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content, imageUrl }: { receiverId: string; content: string; imageUrl?: string }) =>
      api.sendMessage(receiverId, content, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
      setMessageInput("");
      setSelectedImage(null);
      setPreviewUrl(null);
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
        (payload) => {
          // Refetch community messages to get the new message
          queryClient.invalidateQueries({
            queryKey: ['communityMessages', selectedCommunityId, currentUser?.id]
          });
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
    
    if (targetUserId) {
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
          
          // Check if message is for currently open chat
          const isActiveChat = selectedUserId === newMessage.sender_id;
          
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
            
            // Play notification sound
            if (notificationSoundRef.current) {
              notificationSoundRef.current.play();
            }
            
            // Show browser notification
            if (hasNotificationPermission) {
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

  // Real-time subscription for new messages and typing indicators in active chat
  useEffect(() => {
    if (!currentUser || !selectedUserId) return;
    

    // Create unique channel name for this conversation
    const userIds = [currentUser.id, selectedUserId].sort();
    const channelName = `chat-${userIds[0]}-${userIds[1]}`;

    const channel = supabase
      .channel(channelName)
      // Listen for new messages
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
    };
  }, [currentUser, selectedUserId, queryClient]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (selectedUserId && currentUser) {
      // Optimistically update conversations to remove unread count immediately
      queryClient.setQueryData(['conversations', currentUser.id], (old: any) => {
        if (!old) return old;
        return old.map((conv: any) => {
          if (conv.user?.id === selectedUserId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        });
      });

      // Then mark as read in database
      api.markMessagesAsRead(selectedUserId)
        .then(() => {
          // Wait a bit to ensure database has processed the update
          return new Promise(resolve => setTimeout(resolve, 500));
        })
        .then(() => {
          // Force refetch with fresh data from database
          queryClient.refetchQueries({ 
            queryKey: ['conversations', currentUser.id],
            type: 'active'
          });
          queryClient.refetchQueries({ 
            queryKey: ['messages', selectedUserId],
            type: 'active'
          });
        })
        .catch(err => {
          console.error('Failed to mark messages as read:', err);
          // Revert optimistic update on error
          queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
        });
    }
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
        imageUrl
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

  // Send typing indicator to other user
  const sendTypingEvent = (typing: boolean) => {
    if (!currentUser || !selectedUserId) return;
    
    const userIds = [currentUser.id, selectedUserId].sort();
    const channelName = `chat-${userIds[0]}-${userIds[1]}`;
    
    supabase.channel(channelName).send({
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
      <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-screen w-full bg-background text-foreground overflow-hidden border-t border-border md:border-0">
        
        {/* Conversations Sidebar */}
        <div className={cn(
          "w-full md:w-[380px] flex flex-col border-e border-border bg-gradient-to-b from-background to-background/95",
          (selectedUserId || selectedCommunityId) ? "hidden md:flex" : "flex"
        )}>
          
          {/* Header */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-background via-background to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-sm">
                💬
              </div>
              <span className="font-bold text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{isRTL ? "الرسائل" : "Messages"}</span>
            </div>
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
          <div className="px-4 py-3 border-b border-border/30">
             <div className="relative">
                <Search className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4", 
                  isRTL ? "right-3" : "left-3"
                )} />
                <Input 
                  placeholder={isRTL ? "ابحث عن محادثة..." : "Search conversations..."} 
                  className={cn(
                      "bg-secondary/60 border border-border/30 rounded-2xl h-10 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all text-sm",
                      isRTL ? "pr-10 text-right" : "pl-10"
                  )} 
                />
             </div>
          </div>

          {/* Tabs for Chats and Communities */}
          <div className="flex gap-2 px-4 py-3 border-b border-border/30">
            <Button 
              variant={selectedTab === 'chats' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('chats')}
              className="h-8"
            >
              {isRTL ? "محادثات" : "Chats"}
            </Button>
            <Button 
              variant={selectedTab === 'communities' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('communities')}
              className="h-8"
            >
              {isRTL ? "مجتمعات" : "Communities"} ({communities.length})
            </Button>
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
            ) : (
              <div className="flex flex-col">
                {conversations.map((conv: any) => {
                  const hasUnread = conv.unreadCount > 0 && selectedUserId !== conv.user?.id;
                  const isVerified = conv.user?.is_verified;
                  const isOfficial = conv.user?.is_official;
                  const isSelected = selectedUserId === conv.user?.id;
                  
                  return (
                    <button
                      key={conv.user?.id}
                      onClick={() => setSelectedUserId(conv.user?.id)}
                      className={cn(
                        // Base container
                        "flex items-center gap-4 px-4 py-3.5 cursor-pointer text-left relative group",
                        "transition-all duration-300 ease-out",
                        "mx-2 mb-2 rounded-2xl",
                        "border border-transparent",
                        
                        // Verified accounts - blue premium style
                        isVerified && !isOfficial && cn(
                          "bg-gradient-to-r from-blue-500/8 via-blue-500/4 to-transparent",
                          "hover:from-blue-500/15 hover:via-blue-500/8 hover:shadow-lg hover:shadow-blue-500/10",
                          "hover:border-blue-500/20",
                          isSelected && "from-blue-500/20 via-blue-500/10 border-blue-500/40 shadow-xl shadow-blue-500/15"
                        ),
                        
                        // Official accounts - gold/amber premium style
                        isOfficial && cn(
                          "bg-gradient-to-r from-amber-500/8 via-amber-500/4 to-transparent",
                          "hover:from-amber-500/15 hover:via-amber-500/8 hover:shadow-lg hover:shadow-amber-500/10",
                          "hover:border-amber-500/20",
                          isSelected && "from-amber-500/20 via-amber-500/10 border-amber-500/40 shadow-xl shadow-amber-500/15"
                        ),
                        
                        // Regular accounts
                        !isVerified && !isOfficial && cn(
                          "bg-gradient-to-r from-secondary/40 to-transparent",
                          "hover:from-secondary/60 hover:shadow-md hover:border-border/50",
                          isSelected && "from-primary/15 border-primary/40 shadow-lg shadow-primary/10"
                        ),
                        
                        // Unread indicator for regular accounts
                        hasUnread && !isVerified && !isOfficial && "from-primary/10"
                      )}
                    >
                      {/* Avatar Section */}
                      <div className="relative flex-shrink-0">
                        <Avatar className={cn(
                          "w-14 h-14 transition-all duration-300",
                          "border-2",
                          isVerified && !isOfficial && "ring-2 ring-blue-500/20 border-blue-500/30 group-hover:ring-blue-500/40 group-hover:border-blue-500/50",
                          isOfficial && "ring-2 ring-amber-500/20 border-amber-500/30 group-hover:ring-amber-500/40 group-hover:border-amber-500/50",
                          !isVerified && !isOfficial && "ring-2 ring-primary/10 border-primary/20 group-hover:ring-primary/30",
                          isSelected && "scale-105"
                        )}>
                          <AvatarImage src={conv.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.user?.username}`} />
                          <AvatarFallback className={cn(
                            "text-white font-bold text-sm",
                            isVerified && !isOfficial && "bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600",
                            isOfficial && "bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-600",
                            !isVerified && !isOfficial && "bg-gradient-to-br from-primary to-primary/70"
                          )}>
                            {conv.user?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Online Status Indicator */}
                        <div className={cn(
                          "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2.5 border-background ring-2 animate-pulse",
                          isVerified && !isOfficial && "bg-blue-500 ring-blue-400",
                          isOfficial && "bg-amber-500 ring-amber-400",
                          !isVerified && !isOfficial && "bg-green-500 ring-green-400"
                        )}></div>
                        
                        {/* Unread Badge */}
                        {hasUnread && (
                          <div className={cn(
                            "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center",
                            "font-bold text-xs text-white",
                            "shadow-lg backdrop-blur-sm",
                            "animate-in scale-in duration-300",
                            isVerified && !isOfficial && "bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-background",
                            isOfficial && "bg-gradient-to-br from-amber-500 to-amber-600 ring-2 ring-background",
                            !isVerified && !isOfficial && "bg-gradient-to-br from-primary to-primary/90 ring-2 ring-background"
                          )}>
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex flex-col flex-1 min-w-0 gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <VerifiedUsername 
                              username={conv.user?.full_name || conv.user?.username}
                              isVerified={isVerified}
                              className={cn(
                                "text-sm truncate transition-all duration-200",
                                hasUnread || isSelected ? "font-bold text-foreground" : "font-semibold text-foreground/80 group-hover:text-foreground"
                              )}
                            />
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {isVerified && (
                                <VerifiedBadge size="sm" />
                              )}
                              {isOfficial && (
                                <OfficialBadge size="sm" />
                              )}
                              {conv.user?.is_creator && (
                                <CreatorBadge size="sm" />
                              )}
                              {conv.user?.is_premium && (
                                <PremiumBadge size="sm" />
                              )}
                              {conv.user?.is_popular && (
                                <PopularBadge size="sm" />
                              )}
                              {conv.user?.is_active && (
                                <ActiveBadge size="sm" />
                              )}
                            </div>
                          </div>
                          <span className={cn(
                            "text-xs flex-shrink-0 whitespace-nowrap transition-all duration-200",
                            "px-2 py-1 rounded-lg backdrop-blur-sm",
                            hasUnread ? "font-semibold" : "text-muted-foreground",
                            isVerified && !isOfficial && "text-blue-600 bg-blue-500/10",
                            isOfficial && "text-amber-600 bg-amber-500/10",
                            !isVerified && !isOfficial && "text-muted-foreground bg-secondary/30"
                          )}>
                            {new Date(conv.lastMessage?.created_at).toLocaleDateString(isRTL ? 'ar' : 'en', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        
                        {/* Message Preview */}
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs truncate flex-1 leading-relaxed transition-all duration-200",
                            "line-clamp-1",
                            hasUnread ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-muted-foreground/90"
                          )}>
                            {conv.lastMessage?.content?.substring(0, 45)}
                          </span>
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
                    onClick={() => setSelectedCommunityId(community.id)}
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
                    {/* Community Chat Header */}
                    <div className={cn(
                        "h-16 border-b flex items-center justify-between px-4 shadow-sm",
                        "fixed top-0 left-0 right-0 w-full z-50",
                        "md:relative md:shrink-0 md:static md:top-auto md:left-auto md:right-auto md:w-auto md:z-20",
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
                          "flex-1 w-full overflow-y-auto transition-all duration-300 m-0 p-0 pt-16 md:pt-0",
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
                              const currentUserMember = communityMembers.find((m: any) => m.user_id === currentUser?.id);
                              const isAdmin = currentUserMember?.role === 'admin';
                              const isDeleted = msg.is_deleted;
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
                          </div>
                        )}
                      </ScrollArea>
                      
                    </div>

                </>
            ) : selectedUserId && selectedConversation ? (
                <>
                    {/* Chat Header */}
                    <div className={cn(
                        "h-16 border-b border-border/30 flex items-center justify-between px-4 bg-gradient-to-r from-background via-background to-primary/5 shadow-sm",
                        "fixed top-0 left-0 right-0 w-full z-50",
                        "md:relative md:shrink-0 md:static md:top-auto md:left-auto md:right-auto md:w-auto md:z-20"
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
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                                  {isRTL ? "نشط الآن" : "Active now"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
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
                    <ScrollArea className="flex-1 p-2 sm:p-5 bg-background overflow-y-auto w-full pt-16 md:pt-0">
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
                            
                            {messages.map((msg: any) => {
                              const isMe = msg.sender_id === currentUser?.id;
                              
                              return (
                                <MessageBubble
                                  key={msg.id}
                                  message={msg}
                                  isMe={isMe}
                                  otherUser={selectedConversation.user}
                                  currentUserId={currentUser?.id}
                                  onStoryClick={(storyId) => {
                                    setSelectedStoryId(storyId);
                                    setIsStoryViewerOpen(true);
                                  }}
                                />
                              );
                            })}
                            
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
                        <div className="flex items-end gap-1 w-full leading-none pb-1 m-0">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-accent/50 flex-shrink-0 transition-colors text-muted-foreground hover:text-foreground h-9 w-9 p-0 m-0"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                          <Input 
                            value={messageInput}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."} 
                            className="flex-1 rounded-lg bg-secondary/60 border border-border/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all h-9 text-sm px-3 py-0 m-0"
                          />
                          <Button 
                            onClick={handleSendMessage}
                            disabled={(!messageInput.trim() && !selectedImage) || sendMessageMutation.isPending}
                            className="rounded-full flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg transition-all h-9 w-9 p-0 m-0"
                            size="icon" 
                          >
                            {sendMessageMutation.isPending ? (
                              <Spinner className="w-4 h-4" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
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

      {/* Fixed Input Box - Bottom of Screen for Mobile */}
      {(selectedUserId || selectedCommunityId) && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-0 bg-background z-50 flex flex-col px-0 py-0 m-0 gap-0">
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
            
            {/* Direct Message Input */}
            {selectedUserId && (
            <div className="flex items-end gap-0 w-full leading-none pb-0 m-0 py-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-accent/50 flex-shrink-0 transition-colors text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9 p-0 m-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Input 
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."} 
                className={cn(
                  "flex-1 rounded-lg sm:rounded-2xl bg-secondary/60 border border-border/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all h-8 sm:h-9 text-xs sm:text-sm px-3 py-0 m-0",
                  isRTL && "text-right"
                )}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={(!messageInput.trim() && !selectedImage) || sendMessageMutation.isPending}
                className="rounded-full flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg transition-all h-8 w-8 sm:h-9 sm:w-9 p-0 m-0 ml-1"
                size="icon" 
              >
                {sendMessageMutation.isPending ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
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
        />
      )}
    </Layout>
  );
}
