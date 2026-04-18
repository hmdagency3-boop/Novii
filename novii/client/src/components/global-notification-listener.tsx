import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle, UserPlus, AtSign, X, Bell } from "lucide-react";

type NotifType =
  | "like"
  | "comment"
  | "follow"
  | "follow_request"
  | "mention"
  | "reel_like"
  | "story_reply"
  | "save"
  | "repost";

const typeLabel: Record<NotifType, { ar: string; en: string; Icon: React.ElementType; color: string }> = {
  like: { ar: "أعجب بمنشورك", en: "liked your post", Icon: Heart, color: "text-red-500" },
  reel_like: { ar: "أعجب بمقطعك", en: "liked your reel", Icon: Heart, color: "text-red-500" },
  comment: { ar: "علّق على منشورك", en: "commented on your post", Icon: MessageCircle, color: "text-blue-500" },
  follow: { ar: "بدأ يتابعك", en: "started following you", Icon: UserPlus, color: "text-green-500" },
  follow_request: { ar: "طلب متابعتك", en: "sent a follow request", Icon: UserPlus, color: "text-yellow-500" },
  mention: { ar: "ذكرك في تعليق", en: "mentioned you", Icon: AtSign, color: "text-purple-500" },
  story_reply: { ar: "ردّ على قصتك", en: "replied to your story", Icon: MessageCircle, color: "text-pink-500" },
  save: { ar: "حفظ منشورك", en: "saved your post", Icon: Bell, color: "text-orange-500" },
  repost: { ar: "أعاد نشر منشورك", en: "reposted your post", Icon: Bell, color: "text-teal-500" },
};

export function GlobalNotificationListener() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const soundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    soundRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0OVqzn77BdGAg+lt7xwW0gBSuBzvLZjTYIGGS56+ijUQ4LTaXh8bllHAU2jdXyzn0pBSd+zPDckUAKE1qv5u+uWRYKQ5vd88GBJAUuhM/z1oU1Bx1qu+7mnEYMEFOo5O+0XhgIPZbZ8cJxHQUtgtDy2ow2BxhluevenEcMDlGn4/G2ZBkHN47V88x+KwUpe8vw3Y9AAAAFamvr6+vr6/Pz8/Pz8/Pz8AAAAAAAAAD/AP8A/wD/AP8A/wD/AP8A"
    );
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`global-notifications-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        async (payload: any) => {
          const notif = payload.new;

          // Play sound
          soundRef.current?.play().catch(() => {});

          // Refresh notification count badge
          queryClient.invalidateQueries({ queryKey: ["notifications"] });

          // Fetch actor profile
          const { data: actor } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", notif.actor_id)
            .single();

          if (!actor) return;

          const name = actor.full_name || actor.username || (isRTL ? "مستخدم" : "Someone");
          const avatarUrl =
            actor.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${actor.username}`;

          const type = notif.type as NotifType;
          const meta = typeLabel[type] ?? {
            ar: "إشعار جديد",
            en: "New notification",
            Icon: Bell,
            color: "text-primary",
          };
          const { Icon, color } = meta;
          const label = isRTL ? meta.ar : meta.en;

          toast.custom(
            (t) => (
              <div
                className={cn(
                  "group relative flex items-start gap-4 w-full min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl border-2 transition-all duration-300",
                  "bg-gradient-to-br from-background via-background to-background/95",
                  "border-primary/30 hover:border-primary/50 backdrop-blur-xl",
                  "animate-in slide-in-from-top-5 fade-in duration-300",
                  isRTL && "flex-row-reverse"
                )}
              >
                {/* Close */}
                <button
                  onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
                  className={cn(
                    "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    "hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
                    isRTL ? "left-2" : "right-2"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Avatar + icon badge */}
                <div className="relative flex-shrink-0">
                  <Avatar className="w-14 h-14 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                      {name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-lg ring-2 ring-background">
                    <Icon className={cn("w-3.5 h-3.5", color)} />
                  </div>
                </div>

                {/* Text */}
                <div
                  className={cn("flex-1 min-w-0 cursor-pointer", isRTL && "text-right")}
                  onClick={() => { navigate("/notifications"); toast.dismiss(t); }}
                >
                  <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse justify-end")}>
                    <p className="font-bold text-sm text-foreground truncate">{name}</p>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary shrink-0">
                      {isRTL ? "إشعار" : "New"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{label}</p>
                  {notif.content && (
                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1 italic">
                      "{notif.content}"
                    </p>
                  )}
                  <p className="text-xs text-primary/70 mt-1.5 font-medium">
                    {isRTL ? "اضغط للعرض" : "Click to view"}
                  </p>
                </div>
              </div>
            ),
            {
              duration: 6000,
              position: isRTL ? "top-left" : "top-right",
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient, navigate, isRTL]);

  return null;
}
