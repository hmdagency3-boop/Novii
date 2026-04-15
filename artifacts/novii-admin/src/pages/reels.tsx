import { useState, useEffect } from "react";
import { Video, Trash2, RotateCcw, Star, StarOff, Eye, Heart, Clock, User } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  caption: string;
  views_count: number;
  likes_count: number;
  is_featured?: boolean;
  is_deleted?: boolean;
  created_at: string;
  profiles?: { username: string; full_name: string; avatar_url: string; is_verified: boolean };
}

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => { loadReels(); }, [showDeleted]);

  async function loadReels() {
    setLoading(true);
    try {
      const data = await adminFetch<Reel[]>(`/reels?deleted=${showDeleted}`);
      setReels(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteReel(id: string) {
    if (!confirm("هل تريد حذف هذا الريل؟")) return;
    await adminFetch(`/reels/${id}`, { method: "DELETE" });
    loadReels();
  }

  async function restoreReel(id: string) {
    await adminFetch(`/reels/${id}/restore`, { method: "POST" });
    loadReels();
  }

  async function toggleFeature(id: string, featured: boolean) {
    await adminFetch(`/reels/${id}/feature`, {
      method: "POST",
      body: JSON.stringify({ featured: !featured }),
    });
    loadReels();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#262626]">إدارة الريلز</h1>
            <p className="text-[13px] text-[#8e8e8e]">{reels.length} ريل</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDeleted(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!showDeleted ? "bg-[#262626] text-white" : "bg-[#efefef] text-[#262626]"}`}>النشطة</button>
          <button onClick={() => setShowDeleted(true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showDeleted ? "bg-[#262626] text-white" : "bg-[#efefef] text-[#262626]"}`}>المحذوفة</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-[#dbdbdb] border-t-[#262626] rounded-full animate-spin" />
        </div>
      ) : reels.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e8e]">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد ريلز</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reels.map((reel) => (
            <div key={reel.id} className="bg-white rounded-xl border border-[#efefef] overflow-hidden">
              <div className="relative aspect-[9/16] bg-black">
                <video src={reel.video_url} className="w-full h-full object-cover" muted />
                {reel.is_featured && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500 text-white text-[10px] rounded-full font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" /> مميز
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-white/80" />
                      <span className="text-white text-[11px]">{reel.views_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-white/80" />
                      <span className="text-white text-[11px]">{reel.likes_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {reel.profiles?.avatar_url ? (
                    <img src={reel.profiles.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#efefef] flex items-center justify-center">
                      <User className="w-3 h-3 text-[#8e8e8e]" />
                    </div>
                  )}
                  <span className="text-[12px] font-medium text-[#262626] truncate">{reel.profiles?.username || "مجهول"}</span>
                </div>
                {reel.caption && (
                  <p className="text-[11px] text-[#8e8e8e] mb-2 line-clamp-2">{reel.caption}</p>
                )}
                <div className="flex items-center gap-1 text-[11px] text-[#8e8e8e] mb-2">
                  <Clock className="w-3 h-3" />
                  {new Date(reel.created_at).toLocaleDateString("ar")}
                </div>
                <div className="flex gap-1.5">
                  {showDeleted ? (
                    <button onClick={() => restoreReel(reel.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-50 text-green-600 text-[11px] font-medium hover:bg-green-100 transition-colors">
                      <RotateCcw className="w-3 h-3" /> استعادة
                    </button>
                  ) : (
                    <>
                      <button onClick={() => toggleFeature(reel.id, !!reel.is_featured)} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${reel.is_featured ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" : "bg-[#fafafa] text-[#8e8e8e] hover:bg-[#efefef]"}`}>
                        {reel.is_featured ? <StarOff className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                        {reel.is_featured ? "إلغاء" : "تمييز"}
                      </button>
                      <button onClick={() => deleteReel(reel.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 text-red-500 text-[11px] font-medium hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3 h-3" /> حذف
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
