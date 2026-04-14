import { useEffect, useState, useMemo } from "react";
import { fetchContent, deleteContent, type PostRecord } from "@/lib/admin-api";
import { Search, Trash2, Eye, Image, Heart, MessageCircle, Share2, RefreshCw, XCircle, AlertTriangle } from "lucide-react";

export default function ContentPage() {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewPost, setViewPost] = useState<PostRecord | null>(null);
  const [deletePost, setDeletePost] = useState<PostRecord | null>(null);

  const loadPosts = () => {
    setLoading(true);
    fetchContent()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPosts(); }, []);

  const filtered = useMemo(() => {
    if (!search) return posts;
    const s = search.toLowerCase();
    return posts.filter(
      (p) => p.content?.toLowerCase().includes(s) || p.username?.toLowerCase().includes(s)
    );
  }, [posts, search]);

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المحتوى</h1>
          <p className="text-sm text-gray-500 mt-1">{posts.length} منشور</p>
        </div>
        <button onClick={loadPosts} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في المحتوى..."
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          dir="rtl"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
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
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">لا توجد نتائج</td></tr>
            ) : (
              filtered.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(post.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">@{post.username || "unknown"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-600 truncate max-w-[250px]">{post.content || "—"}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {post.media_urls?.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                        <Image className="w-3 h-3" /> {post.media_urls.length}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes_count || 0}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments_count || 0}</span>
                      <span className="inline-flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString("ar-EG")}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewPost(post)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => setDeletePost(post)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewPost && <ViewPostModal post={viewPost} onClose={() => setViewPost(null)} />}
      {deletePost && <DeletePostModal post={deletePost} onClose={() => setDeletePost(null)} onDone={loadPosts} />}
    </div>
  );
}

function ViewPostModal({ post, onClose }: { post: PostRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">تفاصيل المنشور</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">{(post.username || "?").charAt(0).toUpperCase()}</div>
            <div>
              <p className="font-semibold text-gray-800">@{post.username || "unknown"}</p>
              <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString("ar-EG")}</p>
            </div>
          </div>
          {post.content && <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>}
          {post.media_urls?.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.media_urls.map((url, i) => (
                <img key={i} src={url} alt="" className="rounded-xl object-cover w-full h-40" />
              ))}
            </div>
          )}
          <div className="flex gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1"><Heart className="w-4 h-4" />{post.likes_count}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="w-4 h-4" />{post.comments_count}</span>
            <span className="inline-flex items-center gap-1"><Share2 className="w-4 h-4" />{post.shares_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeletePostModal({ post, onClose, onDone }: { post: PostRecord; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteContent(post.id);
      onDone();
      onClose();
    } catch (e) {
      console.error(e);
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
            <p className="text-sm text-amber-700">سيتم حذف هذا المنشور نهائياً ولن يظهر للمستخدمين.</p>
          </div>
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
