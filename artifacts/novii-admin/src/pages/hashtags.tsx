import { useState, useEffect } from "react";
import { Hash, Ban, Pin, PinOff, TrendingUp, Search } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface Hashtag {
  id: string;
  name: string;
  posts_count: number;
  is_banned: boolean;
  is_pinned: boolean;
  created_at: string;
}

export default function HashtagsPage() {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "banned">("all");

  useEffect(() => { loadHashtags(); }, []);

  async function loadHashtags() {
    setLoading(true);
    try {
      const data = await adminFetch<Hashtag[]>("/hashtags");
      setHashtags(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function updateHashtag(id: string, updates: { is_banned?: boolean; is_pinned?: boolean }) {
    await adminFetch(`/hashtags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    loadHashtags();
  }

  const filtered = hashtags.filter((h) => {
    if (filter === "pinned" && !h.is_pinned) return false;
    if (filter === "banned" && !h.is_banned) return false;
    if (searchQuery && !h.name.includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#262626]">إدارة الهاشتاقات</h1>
            <p className="text-[13px] text-[#8e8e8e]">{hashtags.length} هاشتاق</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e8e]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن هاشتاق..."
            className="w-full pr-10 pl-4 py-2.5 border border-[#dbdbdb] rounded-lg text-sm focus:outline-none focus:border-[#262626]"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pinned", "banned"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${filter === f ? "bg-[#262626] text-white" : "bg-[#efefef] text-[#262626]"}`}>
              {f === "all" ? "الكل" : f === "pinned" ? "مثبتة" : "محظورة"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-[#dbdbdb] border-t-[#262626] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e8e]">
          <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد هاشتاقات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((hashtag, i) => (
            <div key={hashtag.id} className={`bg-white rounded-xl border border-[#efefef] p-4 flex items-center gap-4 ${hashtag.is_banned ? "opacity-60" : ""}`}>
              <span className="text-[14px] font-bold text-[#8e8e8e] w-8">{i + 1}</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Hash className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#262626]">#{hashtag.name}</span>
                  {hashtag.is_pinned && <Pin className="w-3 h-3 text-blue-500" />}
                  {hashtag.is_banned && <Ban className="w-3 h-3 text-red-500" />}
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#8e8e8e]">
                  <TrendingUp className="w-3 h-3" />
                  <span>{hashtag.posts_count} منشور</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateHashtag(hashtag.id, { is_pinned: !hashtag.is_pinned })}
                  className={`p-2 rounded-lg transition-colors ${hashtag.is_pinned ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "hover:bg-[#fafafa] text-[#8e8e8e]"}`}
                  title={hashtag.is_pinned ? "إلغاء التثبيت" : "تثبيت في الترند"}
                >
                  {hashtag.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => updateHashtag(hashtag.id, { is_banned: !hashtag.is_banned })}
                  className={`p-2 rounded-lg transition-colors ${hashtag.is_banned ? "bg-red-50 text-red-500 hover:bg-red-100" : "hover:bg-[#fafafa] text-[#8e8e8e]"}`}
                  title={hashtag.is_banned ? "إلغاء الحظر" : "حظر الهاشتاق"}
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
