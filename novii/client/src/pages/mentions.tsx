import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { 
  AtSign, MessageCircle, Heart, Trash2, Copy, Check,
  Clock, User as UserIcon, Badge
} from "lucide-react";
import { toast } from "sonner";

interface Mention {
  id: string;
  type: 'post_mention' | 'comment_mention';
  content: string;
  postId?: string;
  commentId?: string;
  actorName: string;
  actorAvatar: string;
  actorUsername: string;
  createdAt: string;
  isRead: boolean;
}

export default function Mentions() {
  const { user } = useAuth();
  const { direction } = useLanguage();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [selectedMention, setSelectedMention] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const t = getTranslation(direction === 'rtl' ? 'ar' : 'en').settings;

  const { data: mentionsData, isLoading } = useQuery({
    queryKey: ['mentions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get mentions from notifications
      const response = await fetch('/api/mentions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to fetch mentions');
      return response.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (mentionsData) {
      setMentions(mentionsData);
    }
  }, [mentionsData]);

  const handleCopyText = (text: string, mentionId: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(direction === 'rtl' ? 'تم النسخ!' : 'Copied!');
  };

  const handleDeleteMention = async (mentionId: string) => {
    try {
      await fetch(`/api/mentions/${mentionId}`, { method: 'DELETE' });
      setMentions(mentions.filter(m => m.id !== mentionId));
      toast.success(direction === 'rtl' ? 'تم الحذف!' : 'Deleted!');
    } catch (error) {
      toast.error(direction === 'rtl' ? 'خطأ في الحذف' : 'Error deleting');
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative mb-12 overflow-hidden rounded-3xl">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary via-blue-500 to-transparent opacity-20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500 via-blue-500 to-transparent opacity-15 rounded-full blur-3xl" />
          </div>

          <div className="relative p-8 md:p-16 text-center backdrop-blur-sm">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {direction === 'rtl' ? 'إشاراتك' : 'Your Mentions'}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-4">
              {direction === 'rtl' ? '@الإشارات' : '@Mentions'}
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {direction === 'rtl'
                ? 'جميع المنشورات والتعليقات التي تم الإشارة إليك فيها'
                : 'All posts and comments where you were mentioned'}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && mentions.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <AtSign className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {direction === 'rtl' ? 'لا توجد إشارات' : 'No Mentions Yet'}
            </h2>
            <p className="text-muted-foreground">
              {direction === 'rtl'
                ? 'عندما يقوم شخص ما بالإشارة إليك، ستظهر هنا'
                : 'When someone mentions you, it will appear here'}
            </p>
          </div>
        )}

        {/* Mentions List */}
        {!isLoading && mentions.length > 0 && (
          <div className="space-y-4">
            {mentions.map((mention) => (
              <div
                key={mention.id}
                onClick={() => setSelectedMention(mention.id)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer",
                  "backdrop-blur-xl hover:shadow-lg hover:scale-[1.02]",
                  selectedMention === mention.id
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/50 bg-card/30 hover:border-primary/40"
                )}
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-blue-500/5" />

                {/* Type indicator glow */}
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity",
                  mention.type === 'post_mention' ? 'bg-blue-500/20' : 'bg-cyan-500/20'
                )} />

                <div className="relative p-6">
                  {/* Top Section - Actor Info */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={mention.actorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mention.actorUsername}`}
                          alt={mention.actorName}
                          className="w-12 h-12 rounded-full object-cover shadow-lg"
                        />
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                          mention.type === 'post_mention' ? 'bg-blue-500' : 'bg-cyan-500'
                        )} />
                      </div>

                      <div>
                        <h3 className="font-bold text-foreground">{mention.actorName}</h3>
                        <p className="text-sm text-muted-foreground">@{mention.actorUsername}</p>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className={cn(
                      "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
                      mention.type === 'post_mention'
                        ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        : 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20'
                    )}>
                      {mention.type === 'post_mention' ? (
                        <>
                          <Badge className="w-3 h-3" />
                          {direction === 'rtl' ? 'منشور' : 'Post'}
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3 h-3" />
                          {direction === 'rtl' ? 'تعليق' : 'Comment'}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-5 p-4 rounded-xl bg-background/50 border border-border/50">
                    <p className="text-foreground leading-relaxed text-sm md:text-base break-words whitespace-pre-wrap">
                      {mention.content}
                    </p>
                  </div>

                  {/* Bottom Section - Time and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(mention.createdAt).toLocaleDateString(
                          direction === 'rtl' ? 'ar-SA' : 'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(mention.content, mention.id);
                        }}
                        className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                        title={direction === 'rtl' ? 'نسخ' : 'Copy'}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMention(mention.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title={direction === 'rtl' ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {!mention.isRead && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-xs font-bold text-primary border border-primary/30">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        {direction === 'rtl' ? 'جديد' : 'New'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {mentions.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <AtSign className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-muted-foreground">{direction === 'rtl' ? 'الإجمالي' : 'Total'}</h3>
              </div>
              <p className="text-3xl font-black text-primary">{mentions.length}</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-muted-foreground">{direction === 'rtl' ? 'منشورات' : 'Posts'}</h3>
              </div>
              <p className="text-3xl font-black text-blue-600">
                {mentions.filter(m => m.type === 'post_mention').length}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-muted-foreground">{direction === 'rtl' ? 'تعليقات' : 'Comments'}</h3>
              </div>
              <p className="text-3xl font-black text-cyan-600">
                {mentions.filter(m => m.type === 'comment_mention').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
