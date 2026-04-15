import { useEffect, useState, useMemo } from "react";
import { fetchContent, deleteContent, fetchDeletedContent, restoreContent, type PostRecord } from "@/lib/admin-api";
import { Search, Trash2, Eye, Image, Heart, MessageCircle, RefreshCw, X, AlertTriangle, BarChart3, Archive, RotateCcw, CheckCircle2 } from "lucide-react";

type Tab = "active" | "deleted";

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [deletedPosts, setDeletedPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewPost, setViewPost] = useState<PostRecord | null>(null);
  const [deletePost, setDeletePost] = useState<PostRecord | null>(null);
  const [restorePost, setRestorePost] = useState<PostRecord | null>(null);
  const [error, setError] = useState("");

  const loadPosts = () => {
    setLoading(true);
    setError("");
    fetchContent()
      .then(setPosts)
      .catch((e) => setError(e.message || "فشل في تحميل المحتوى"))
      .finally(() => setLoading(false));
  };

  const loadDeletedPosts = () => {
    setLoading(true);
    setError("");
    fetchDeletedContent()
      .then(setDeletedPosts)
      .catch((e) => setError(e.message || "فشل في تحميل المحتوى المحذوف"))
      .finally(() => setLoading(false));
  };

  const reload = () => {
    if (tab === "active") loadPosts();
    else loadDeletedPosts();
  };

  useEffect(() => { reload(); }, [tab]);

  const currentList = tab === "active" ? posts : deletedPosts;

  const filtered = useMemo(() => {
    if (!search) return currentList;
    const s = search.toLowerCase();
    return currentList.filter(
      (p) =>
        p.content?.toLowerCase().includes(s) ||
        p.username?.toLowerCase().includes(s) ||
        p.display_name?.toLowerCase().includes(s)
    );
  }, [currentList, search]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-[#262626]">إدارة المحتوى</h1>
          <p className="text-[14px] text-[#8e8e8e] mt-0.5">
            {tab === "active" ? `${posts.length} منشور نشط` : `${deletedPosts.length} منشور محذوف`}
          </p>
        </div>
        <button onClick={reload} className="p-2 rounded-full hover:bg-[#f5f5f5] transition-colors" title="تحديث">
          <RefreshCw className={`w-5 h-5 text-[#262626] ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("active")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              tab === "active" ? "bg-[#262626] text-white" : "bg-[#efefef] text-[#262626] hover:bg-[#dbdbdb]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            نشطة
            <span className={`text-[11px] ${tab === "active" ? "text-white/70" : "text-[#8e8e8e]"}`}>{posts.length}</span>
          </button>
          <button
            onClick={() => setTab("deleted")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              tab === "deleted" ? "bg-[#ed4956] text-white" : "bg-[#efefef] text-[#262626] hover:bg-[#dbdbdb]"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            محذوفة
            <span className={`text-[11px] ${tab === "deleted" ? "text-white/70" : "text-[#8e8e8e]"}`}>{deletedPosts.length}</span>
          </button>
        </div>

        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-full pr-10 pl-4 py-2 bg-[#efefef] border-none rounded-lg text-[14px] text-[#262626] placeholder-[#8e8e8e] focus:outline-none focus:bg-[#dbdbdb]/60 transition-colors"
            dir="rtl"
          />
        </div>
      </div>

      {error && (
        <div className="bg-[#ed4956]/5 border border-[#ed4956]/15 rounded-lg px-4 py-3 text-[13px] text-[#ed4956] flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {tab === "deleted" && deletedPosts.length > 0 && !loading && (
        <div className="bg-[#ff9500]/5 border border-[#ff9500]/15 rounded-lg px-4 py-3 text-[13px] text-[#262626] flex items-center gap-2 mb-4">
          <Archive className="w-4 h-4 shrink-0 text-[#ff9500]" />
          هذه المنشورات محذوفة ولا تظهر للمستخدمين. يمكنك استعادة أي منشور ليعود مرئياً.
        </div>
      )}

      <div className="bg-white border border-[#dbdbdb] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#efefef]">
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">المؤلف</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">المحتوى</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">وسائط</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">التفاعل</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide">التاريخ</th>
                <th className="text-center px-4 py-3 text-[12px] font-semibold text-[#8e8e8e] uppercase tracking-wide w-[80px]">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#efefef]"><td colSpan={6} className="px-4 py-4"><div className="h-8 bg-[#f5f5f5] rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-[14px] text-[#8e8e8e]">
                  {search ? "لا توجد نتائج" : tab === "deleted" ? "لا توجد منشورات محذوفة" : "لا توجد منشورات"}
                </td></tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id} className={`border-b border-[#efefef] last:border-0 hover:bg-[#fafafa] transition-colors ${tab === "deleted" ? "opacity-75" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-[1.5px] shrink-0">
                          <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                            {post.avatar_url ? (
                              <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-semibold text-[#262626]">{(post.username || post.display_name || "?").charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#262626] truncate">{post.display_name || post.username || "مستخدم"}</p>
                          {post.username && <p className="text-[11px] text-[#8e8e8e]" dir="ltr">@{post.username}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[14px] text-[#262626] truncate max-w-[250px]">{post.content || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {post.media_urls && post.media_urls.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-md overflow-hidden bg-[#efefef] shrink-0">
                            <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#0095f6] bg-[#0095f6]/10 px-1.5 py-0.5 rounded-full font-medium">
                            <Image className="w-3 h-3" /> {post.media_urls.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#8e8e8e]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-[12px] text-[#8e8e8e]">
                        <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes_count}</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments_count}</span>
                        <span className="inline-flex items-center gap-1"><BarChart3 className="w-3 h-3" />{post.views_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#8e8e8e]">{new Date(post.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewPost(post)} className="p-1.5 rounded-full hover:bg-[#efefef] text-[#262626] transition-colors" title="عرض">
                          <Eye className="w-4 h-4" />
                        </button>
                        {tab === "active" ? (
                          <button onClick={() => setDeletePost(post)} className="p-1.5 rounded-full hover:bg-[#ed4956]/10 text-[#8e8e8e] hover:text-[#ed4956] transition-colors" title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => setRestorePost(post)} className="p-1.5 rounded-full hover:bg-[#00c853]/10 text-[#8e8e8e] hover:text-[#00c853] transition-colors" title="استعادة">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewPost && <ViewPostModal post={viewPost} onClose={() => setViewPost(null)} isDeleted={tab === "deleted"} />}
      {deletePost && <DeletePostModal post={deletePost} onClose={() => setDeletePost(null)} onDone={reload} />}
      {restorePost && <RestorePostModal post={restorePost} onClose={() => setRestorePost(null)} onDone={reload} />}
    </div>
  );
}

function ViewPostModal({ post, onClose, isDeleted }: { post: PostRecord; onClose: () => void; isDeleted?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#efefef] relative">
          <button onClick={onClose} className="absolute left-4 p-0.5 hover:opacity-60 transition-opacity">
            <X className="w-5 h-5 text-[#262626]" />
          </button>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <h2 className="text-[16px] font-semibold text-[#262626]">تفاصيل المنشور</h2>
            {isDeleted && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ed4956]/10 text-[#ed4956]">محذوف</span>}
          </div>
        </div>
        <div className="p-4 overflow-y-auto scrollbar-thin flex-1 space-y-4" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                {post.avatar_url ? <img src={post.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-semibold">{(post.username || "?")[0].toUpperCase()}</span>}
              </div>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#262626]">{post.display_name || post.username || "مستخدم"}</p>
              <p className="text-[12px] text-[#8e8e8e]">{new Date(post.created_at).toLocaleString("ar-EG")}</p>
            </div>
          </div>
          {post.content && <p className="text-[14px] text-[#262626] leading-relaxed whitespace-pre-wrap">{post.content}</p>}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-1">
              {post.media_urls.map((url, i) => (
                <img key={i} src={url} alt="" className="rounded-md object-cover w-full h-36 bg-[#efefef]" />
              ))}
            </div>
          )}
          <div className="flex gap-5 text-[14px] text-[#262626] py-1">
            <span className="inline-flex items-center gap-1.5 font-semibold"><Heart className="w-5 h-5" />{post.likes_count}</span>
            <span className="inline-flex items-center gap-1.5 font-semibold"><MessageCircle className="w-5 h-5" />{post.comments_count}</span>
            <span className="inline-flex items-center gap-1.5 font-semibold"><BarChart3 className="w-5 h-5" />{post.views_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeletePostModal({ post, onClose, onDone }: { post: PostRecord; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setBusy(true); setError("");
    try { await deleteContent(post.id); onDone(); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : "فشل"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3.5 border-b border-[#efefef] text-center relative">
          <button onClick={onClose} className="absolute left-4 top-1/2 -translate-y-1/2 hover:opacity-60"><X className="w-5 h-5 text-[#262626]" /></button>
          <h2 className="text-[16px] font-semibold text-[#262626]">حذف المنشور</h2>
        </div>
        <div className="p-4 space-y-4" dir="rtl">
          <div className="flex items-center gap-3 p-3 bg-[#ff9500]/5 border border-[#ff9500]/15 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-[#ff9500] shrink-0" />
            <div>
              <p className="text-[14px] text-[#262626] font-medium">هل تريد حذف هذا المنشور؟</p>
              <p className="text-[12px] text-[#8e8e8e] mt-0.5">بواسطة @{post.username || "مستخدم"}</p>
            </div>
          </div>
          {post.content && <div className="bg-[#fafafa] rounded-lg p-3"><p className="text-[14px] text-[#262626] line-clamp-3">{post.content}</p></div>}
          {error && <div className="bg-[#ed4956]/5 border border-[#ed4956]/15 rounded-lg px-4 py-3 text-[13px] text-[#ed4956]">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">إلغاء</button>
            <button onClick={handleDelete} disabled={busy} className="px-5 py-2 rounded-lg text-[14px] font-semibold text-white bg-[#ed4956] hover:bg-[#dc3545] transition-colors disabled:opacity-50">
              {busy ? "جاري..." : "حذف"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RestorePostModal({ post, onClose, onDone }: { post: PostRecord; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleRestore = async () => {
    setBusy(true); setError("");
    try { await restoreContent(post.id); onDone(); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : "فشل"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3.5 border-b border-[#efefef] text-center relative">
          <button onClick={onClose} className="absolute left-4 top-1/2 -translate-y-1/2 hover:opacity-60"><X className="w-5 h-5 text-[#262626]" /></button>
          <h2 className="text-[16px] font-semibold text-[#262626]">استعادة المنشور</h2>
        </div>
        <div className="p-4 space-y-4" dir="rtl">
          <div className="flex items-center gap-3 p-3 bg-[#00c853]/5 border border-[#00c853]/15 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-[#00c853] shrink-0" />
            <div>
              <p className="text-[14px] text-[#262626] font-medium">استعادة هذا المنشور؟</p>
              <p className="text-[12px] text-[#8e8e8e] mt-0.5">سيعود مرئياً وسيتم إشعار صاحبه.</p>
            </div>
          </div>
          {post.content && <div className="bg-[#fafafa] rounded-lg p-3"><p className="text-[14px] text-[#262626] line-clamp-3">{post.content}</p></div>}
          {error && <div className="bg-[#ed4956]/5 border border-[#ed4956]/15 rounded-lg px-4 py-3 text-[13px] text-[#ed4956]">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] font-medium text-[#262626] hover:bg-[#fafafa] transition-colors">إلغاء</button>
            <button onClick={handleRestore} disabled={busy} className="px-5 py-2 rounded-lg text-[14px] font-semibold text-white bg-[#0095f6] hover:bg-[#1877f2] transition-colors disabled:opacity-50">
              {busy ? "جاري..." : "استعادة"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
