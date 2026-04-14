import { useEffect, useState, useMemo } from "react";
import { fetchContent, deleteContent, fetchDeletedContent, restoreContent, type PostRecord } from "@/lib/admin-api";
import { Search, Trash2, Eye, Image, Heart, MessageCircle, Share2, RefreshCw, XCircle, AlertTriangle, BarChart3, Archive, RotateCcw, CheckCircle2 } from "lucide-react";

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
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المحتوى</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tab === "active" ? `${posts.length} منشور نشط` : `${deletedPosts.length} منشور محذوف`}
          </p>
        </div>
        <button onClick={reload} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title="تحديث">
          <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("active")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "active"
              ? "bg-purple-600 text-white shadow-md shadow-purple-200"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Eye className="w-4 h-4" />
          المنشورات النشطة
          <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
            tab === "active" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
          }`}>{posts.length}</span>
        </button>
        <button
          onClick={() => setTab("deleted")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "deleted"
              ? "bg-red-600 text-white shadow-md shadow-red-200"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Archive className="w-4 h-4" />
          الأرشيف (المحذوفة)
          <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
            tab === "deleted" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
          }`}>{deletedPosts.length}</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في المحتوى أو اسم المستخدم..."
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          dir="rtl"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {tab === "deleted" && deletedPosts.length > 0 && !loading && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <Archive className="w-4 h-4 shrink-0 text-amber-500" />
          هذه المنشورات محذوفة ولا تظهر للمستخدمين. يمكنك استعادة أي منشور ليعود مرئياً.
        </div>
      )}

      <div className={`bg-white rounded-2xl border overflow-hidden ${tab === "deleted" ? "border-red-100" : "border-gray-100"}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={tab === "deleted" ? "bg-red-50/50" : "bg-gray-50/80"}>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المؤلف</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">المحتوى</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">وسائط</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">التفاعل</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-10 bg-gray-100 rounded-lg animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                  {search
                    ? "لا توجد نتائج للبحث"
                    : tab === "deleted"
                      ? "لا توجد منشورات محذوفة"
                      : "لا توجد منشورات"
                  }
                </td></tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id} className={`hover:bg-gray-50/50 transition-colors ${tab === "deleted" ? "opacity-80" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                          {post.avatar_url ? (
                            <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (post.username || post.display_name || "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{post.display_name || post.username || "مستخدم"}</p>
                          {post.username && <p className="text-[11px] text-gray-400" dir="ltr">@{post.username}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-600 truncate max-w-[250px]">{post.content || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {post.media_urls && post.media_urls.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            <Image className="w-3 h-3" /> {post.media_urls.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes_count}</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments_count}</span>
                        <span className="inline-flex items-center gap-1"><BarChart3 className="w-3 h-3" />{post.views_count}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewPost(post)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="عرض">
                          <Eye className="w-4 h-4" />
                        </button>
                        {tab === "active" ? (
                          <button onClick={() => setDeletePost(post)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors" title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => setRestorePost(post)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="استعادة">
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">تفاصيل المنشور</h2>
            {isDeleted && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-600">محذوف</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
              {post.avatar_url ? (
                <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (post.username || post.display_name || "?").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{post.display_name || post.username || "مستخدم"}</p>
              {post.username && <p className="text-xs text-gray-400" dir="ltr">@{post.username}</p>}
              <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString("ar-EG")}</p>
            </div>
          </div>
          {post.content && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.media_urls.map((url, i) => (
                <img key={i} src={url} alt="" className="rounded-xl object-cover w-full h-40 bg-gray-100" onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).alt = 'خطأ في التحميل'; }} />
              ))}
            </div>
          )}
          <div className="flex gap-4 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
            <span className="inline-flex items-center gap-1"><Heart className="w-4 h-4" />{post.likes_count}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="w-4 h-4" />{post.comments_count}</span>
            <span className="inline-flex items-center gap-1"><BarChart3 className="w-4 h-4" />{post.views_count}</span>
          </div>
          <div className="text-[10px] text-gray-400" dir="ltr">ID: {post.id}</div>
        </div>
      </div>
    </div>
  );
}

function DeletePostModal({ post, onClose, onDone }: { post: PostRecord; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setBusy(true);
    setError("");
    try {
      await deleteContent(post.id);
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل في حذف المنشور");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">حذف المنشور</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm text-amber-700 font-medium">هل تريد حذف هذا المنشور؟</p>
              <p className="text-xs text-amber-600 mt-0.5">المنشور بواسطة @{post.username || "مستخدم"} — لن يظهر للمستخدمين بعد الحذف.</p>
            </div>
          </div>
          {post.content && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-gray-600 line-clamp-3">{post.content}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
            <button onClick={handleDelete} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
              {busy ? "جاري الحذف..." : "حذف"}
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
    setBusy(true);
    setError("");
    try {
      await restoreContent(post.id);
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل في استعادة المنشور");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">استعادة المنشور</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm text-green-700 font-medium">هل تريد استعادة هذا المنشور؟</p>
              <p className="text-xs text-green-600 mt-0.5">المنشور بواسطة @{post.username || "مستخدم"} — سيعود مرئياً لجميع المستخدمين وسيتم إشعار صاحبه.</p>
            </div>
          </div>
          {post.content && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-gray-600 line-clamp-3">{post.content}</p>
            </div>
          )}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="flex gap-2">
              {post.media_urls.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-100" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ))}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
            <button onClick={handleRestore} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">
              {busy ? "جاري الاستعادة..." : "استعادة المنشور"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
