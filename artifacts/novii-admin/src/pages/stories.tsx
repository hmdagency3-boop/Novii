import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Film, Trash2, RotateCcw, Eye, Clock, User } from "lucide-react";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  views_count: number;
  is_deleted?: boolean;
  created_at: string;
  expires_at: string;
  profiles?: { username: string; full_name: string; avatar_url: string; is_verified: boolean };
}

export default function StoriesPage() {
  const { token } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  const headers = { "Content-Type": "application/json", "x-user-token": token || "" };

  useEffect(() => { loadStories(); }, [showDeleted]);

  async function loadStories() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stories?deleted=${showDeleted}`, { headers });
      if (res.ok) setStories(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteStory(id: string) {
    if (!confirm("هل تريد حذف هذه القصة؟")) return;
    await fetch(`/api/admin/stories/${id}`, { method: "DELETE", headers });
    loadStories();
  }

  async function restoreStory(id: string) {
    await fetch(`/api/admin/stories/${id}/restore`, { method: "POST", headers });
    loadStories();
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#262626]">إدارة القصص</h1>
            <p className="text-[13px] text-[#8e8e8e]">{stories.length} قصة</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleted(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!showDeleted ? "bg-[#262626] text-white" : "bg-[#efefef] text-[#262626]"}`}
          >
            النشطة
          </button>
          <button
            onClick={() => setShowDeleted(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showDeleted ? "bg-[#262626] text-white" : "bg-[#efefef] text-[#262626]"}`}
          >
            المحذوفة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-[#dbdbdb] border-t-[#262626] rounded-full animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e8e]">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد قصص</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {stories.map((story) => (
            <div key={story.id} className="bg-white rounded-xl border border-[#efefef] overflow-hidden group">
              <div className="relative aspect-[9/16] bg-[#fafafa]">
                {story.media_type === "video" ? (
                  <video src={story.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={story.media_url} alt="" className="w-full h-full object-cover" />
                )}
                {isExpired(story.expires_at) && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-medium">
                    منتهية
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-white/80" />
                    <span className="text-white text-[11px]">{story.views_count}</span>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {story.profiles?.avatar_url ? (
                    <img src={story.profiles.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#efefef] flex items-center justify-center">
                      <User className="w-3 h-3 text-[#8e8e8e]" />
                    </div>
                  )}
                  <span className="text-[12px] font-medium text-[#262626] truncate">
                    {story.profiles?.username || "مجهول"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#8e8e8e] mb-2">
                  <Clock className="w-3 h-3" />
                  {new Date(story.created_at).toLocaleDateString("ar")}
                </div>
                {showDeleted ? (
                  <button onClick={() => restoreStory(story.id)} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-50 text-green-600 text-[12px] font-medium hover:bg-green-100 transition-colors">
                    <RotateCcw className="w-3 h-3" /> استعادة
                  </button>
                ) : (
                  <button onClick={() => deleteStory(story.id)} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 text-red-500 text-[12px] font-medium hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3 h-3" /> حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
