import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import { MessageCircle, X } from "lucide-react";

export function GlobalMessageListener() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const { direction } = useLanguage();
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const isRTL = direction === "rtl";

  useEffect(() => {
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0OVqzn77BdGAg+lt7xwW0gBSuBzvLZjTYIGGS56+ijUQ4LTaXh8bllHAU2jdXyzn0pBSd+zPDckUAKE1qv5u+uWRYKQ5vd88GBJAUuhM/z1oU1Bx1qu+7mnEYMEFOo5O+0XhgIPZbZ8cJxHQUtgtDy2ow2BxhluevenEcMDlGn4/G2ZBkHN47V88x+KwUpe8vw3Y9AAAAFamvr6+vr6/Pz8/Pz8/Pz8AAAAAAAAAD/AP8A/wD/AP8A/wD/AP8A');
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    console.log('🌍 Setting up global message listener for toast notifications');

    const channel = supabase
      .channel(`global-messages-${currentUser.id}`)
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
          console.log('📬 New message received, showing toast notification');
          
          if (notificationSoundRef.current) {
            notificationSoundRef.current.play().catch(err => console.log('Could not play sound:', err));
          }
          
          supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single()
            .then(({ data: senderProfile }) => {
              if (senderProfile) {
                const senderName = senderProfile.full_name || senderProfile.username || 'مستخدم';
                const avatarUrl = senderProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderProfile.username}`;
                
                const messagePreview = newMessage.content.length > 50 
                  ? newMessage.content.substring(0, 50) + '...' 
                  : newMessage.content;

                toast.custom(
                  (t) => (
                    <div 
                      className={cn(
                        "group relative flex items-start gap-4 w-full min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl border-2 transition-all duration-300",
                        "bg-gradient-to-br from-background via-background to-background/95",
                        "border-primary/30 hover:border-primary/50",
                        "backdrop-blur-xl",
                        "animate-in slide-in-from-top-5 fade-in duration-300",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      {/* Close Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.dismiss(t);
                        }}
                        className={cn(
                          "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          "hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
                          isRTL ? "left-2" : "right-2"
                        )}
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Message Icon Badge */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-14 h-14 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                          <AvatarImage src={avatarUrl} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                            {senderName[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg ring-2 ring-background">
                          <MessageCircle className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      </div>

                      {/* Content */}
                      <div 
                        className={cn(
                          "flex-1 min-w-0 cursor-pointer",
                          isRTL && "text-right"
                        )}
                        onClick={() => {
                          navigate(`/messages?user=${newMessage.sender_id}`);
                          toast.dismiss(t);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm text-foreground truncate">
                            {senderName}
                          </p>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                            {isRTL ? "رسالة جديدة" : "New"}
                          </span>
                        </div>
                        {newMessage.image_url && (
                          <img 
                            src={newMessage.image_url} 
                            alt="Message" 
                            className="w-full h-24 object-cover rounded-lg mb-2"
                          />
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {messagePreview}
                        </p>
                        <p className="text-xs text-primary/70 mt-1.5 font-medium">
                          {isRTL ? "اضغط للرد" : "Click to reply"}
                        </p>
                      </div>
                    </div>
                  ),
                  {
                    duration: 6000,
                    position: isRTL ? 'top-left' : 'top-right',
                  }
                );
              }
            });
          
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe((status: any) => {
        console.log('📡 Global message listener status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up global message listener');
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient, navigate]);

  return null;
}
