import { useEffect, useState } from "react";
import { fetchAdmins, fetchUsers, addAdmin, updateAdmin, deleteAdmin, type AdminRecord, type UserProfile } from "@/lib/admin-api";
import { Shield, Plus, Edit, Trash2, RefreshCw, XCircle, Crown, UserCheck } from "lucide-react";

const roleLabels: Record<string, string> = {
  super_admin: "مدير عام",
  admin: "مشرف",
  moderator: "مراقب",
};

const permissionLabels: Record<string, string> = {
  can_manage_users: "إدارة المستخدمين",
  can_manage_content: "إدارة المحتوى",
  can_manage_admins: "إدارة المشرفين",
  can_manage_reports: "إدارة البلاغات",
  can_view_analytics: "عرض الإحصائيات",
  can_manage_settings: "إدارة الإعدادات",
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRecord | null>(null);

  const loadAdmins = () => {
    setLoading(true);
    fetchAdmins()
      .then(setAdmins)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAdmins(); }, []);

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#262626]">إدارة المشرفين</h1>
          <p className="text-sm text-gray-500 mt-1">{admins.length} مشرف</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAdmins} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> إضافة مشرف
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#dbdbdb] rounded-lg p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-24 mb-2" /><div className="h-3 bg-gray-100 rounded w-16" /></div>
              </div>
            </div>
          ))
        ) : admins.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">لا يوجد مشرفين</div>
        ) : (
          admins.map((admin) => (
            <div key={admin.id} className="bg-white border border-[#dbdbdb] rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center text-white font-bold">
                    {(admin.username || admin.user_id || "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{admin.display_name || admin.username || "—"}</p>
                    <p className="text-xs text-gray-400" dir="ltr">@{admin.username || admin.user_id.slice(0, 8)}</p>
                  </div>
                </div>
                <RoleBadge role={admin.role} />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {Object.entries(permissionLabels).map(([key, label]) => {
                  const hasIt = admin.role === "super_admin" || (admin as unknown as Record<string, boolean>)[key];
                  return (
                    <span key={key} className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${hasIt ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"}`}>
                      {label}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-[10px] text-gray-400">{new Date(admin.created_at).toLocaleDateString("ar-EG")}</span>
                <div className="flex gap-1">
                  <button onClick={() => setEditAdmin(admin)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                  {admin.role !== "super_admin" && (
                    <button onClick={() => setDeleteTarget(admin)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onDone={loadAdmins} />}
      {editAdmin && <EditAdminModal admin={editAdmin} onClose={() => setEditAdmin(null)} onDone={loadAdmins} />}
      {deleteTarget && <DeleteAdminModal admin={deleteTarget} onClose={() => setDeleteTarget(null)} onDone={loadAdmins} />}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin: "bg-[#0095f6]/10 text-[#0095f6]",
    admin: "bg-blue-50 text-blue-600",
    moderator: "bg-teal-50 text-teal-600",
  };
  const icons: Record<string, React.ReactNode> = {
    super_admin: <Crown className="w-3 h-3" />,
    admin: <Shield className="w-3 h-3" />,
    moderator: <UserCheck className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${styles[role] || styles.moderator}`}>
      {icons[role]} {roleLabels[role] || role}
    </span>
  );
}

function AddAdminModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState("moderator");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    can_manage_users: false,
    can_manage_content: true,
    can_manage_admins: false,
    can_manage_reports: true,
    can_view_analytics: false,
    can_manage_settings: false,
  });
  const [busy, setBusy] = useState(false);
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error);
  }, []);

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchUser.toLowerCase())
  ).slice(0, 10);

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setBusy(true);
    try {
      await addAdmin({
        user_id: selectedUserId,
        role,
        can_manage_users: permissions.can_manage_users,
        can_manage_content: permissions.can_manage_content,
        can_manage_admins: permissions.can_manage_admins,
        can_manage_reports: permissions.can_manage_reports,
        can_view_analytics: permissions.can_view_analytics,
        can_manage_settings: permissions.can_manage_settings,
      });
      onDone();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title="إضافة مشرف جديد">
      <div className="space-y-4" dir="rtl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">بحث عن مستخدم</label>
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="اسم المستخدم..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0095f6]/20"
          />
          {searchUser && filteredUsers.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUserId(u.id); setSearchUser(`@${u.username}`); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedUserId === u.id ? "bg-blue-50" : ""}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(u.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">@{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0095f6]/20"
          >
            <option value="moderator">مراقب</option>
            <option value="admin">مشرف</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الصلاحيات</label>
          <div className="space-y-2">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissions[key]}
                  onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#0095f6] focus:ring-[#0095f6]"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
          <button onClick={handleAdd} disabled={busy || !selectedUserId} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0095f6] hover:bg-[#1877f2] transition-colors disabled:opacity-50">
            {busy ? "جاري الإضافة..." : "إضافة"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function EditAdminModal({ admin, onClose, onDone }: { admin: AdminRecord; onClose: () => void; onDone: () => void }) {
  const [role, setRole] = useState(admin.role);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    can_manage_users: admin.can_manage_users,
    can_manage_content: admin.can_manage_content,
    can_manage_admins: admin.can_manage_admins,
    can_manage_reports: admin.can_manage_reports,
    can_view_analytics: admin.can_view_analytics,
    can_manage_settings: admin.can_manage_settings,
  });
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateAdmin(admin.user_id, {
        role,
        can_manage_users: permissions.can_manage_users,
        can_manage_content: permissions.can_manage_content,
        can_manage_admins: permissions.can_manage_admins,
        can_manage_reports: permissions.can_manage_reports,
        can_view_analytics: permissions.can_view_analytics,
        can_manage_settings: permissions.can_manage_settings,
      });
      onDone();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title={`تعديل صلاحيات ${admin.username || admin.user_id.slice(0, 8)}`}>
      <div className="space-y-4" dir="rtl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0095f6]/20"
            disabled={admin.role === "super_admin"}
          >
            <option value="moderator">مراقب</option>
            <option value="admin">مشرف</option>
            <option value="super_admin">مدير عام</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الصلاحيات</label>
          <div className="space-y-2">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissions[key]}
                  onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#0095f6] focus:ring-[#0095f6]"
                  disabled={admin.role === "super_admin"}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
          <button onClick={handleSave} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0095f6] hover:bg-[#1877f2] transition-colors disabled:opacity-50">
            {busy ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function DeleteAdminModal({ admin, onClose, onDone }: { admin: AdminRecord; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteAdmin(admin.user_id);
      onDone();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title="إزالة مشرف">
      <div className="space-y-4" dir="rtl">
        <p className="text-sm text-gray-600">هل تريد إزالة صلاحيات الإشراف من @{admin.username || admin.user_id.slice(0, 8)}؟</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
          <button onClick={handleDelete} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
            {busy ? "جاري الإزالة..." : "إزالة"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><XCircle className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
