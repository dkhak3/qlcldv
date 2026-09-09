import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, Edit3, KeyRound, LoaderCircle, Plus, Search, ShieldCheck, Trash2, UserRound, UsersRound, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import { createManagedUser, deleteManagedUser, listManagedUsers, updateManagedUser } from "../services/userService";
import { formatBlogDate } from "../utils/blog";
import Pagination, { pageItems } from "../components/Pagination";

const roleLabels = { user: "User", admin: "Admin", superadmin: "SuperAdmin" };
const roleColors = {
  user: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  admin: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  superadmin: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
};

function UserEditor({ user, currentRole, onClose, onSave }) {
  const [form, setForm] = useState(user ? { ...user, password: "" } : { fullName: "", username: "", password: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const roleOptions = currentRole === "superadmin"
    ? [
        { value: "user", label: "User – sử dụng và xem nội dung" },
        { value: "admin", label: "Admin – quản lý Blog, Box và User" },
        { value: "superadmin", label: "SuperAdmin – toàn quyền hệ thống" },
      ]
    : [
        { value: "user", label: "User – sử dụng và xem nội dung" },
        { value: "admin", label: "Admin – quản lý Blog, Box và User" },
      ];
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async event => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.username.trim()) return toast.warning("Vui lòng nhập họ tên và tên đăng nhập");
    if (!/^[a-z0-9._-]{3,32}$/.test(form.username.trim().toLowerCase())) return toast.warning("Tên đăng nhập chưa đúng định dạng");
    if (!user && form.password.length < 8) return toast.warning("Mật khẩu phải có ít nhất 8 ký tự");
    if (user && form.password && form.password.length < 8) return toast.warning("Mật khẩu mới phải có ít nhất 8 ký tự");
    setSaving(true);
    try { await onSave({ ...form, username: form.username.trim().toLowerCase() }); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800"><div><h2 className="text-lg font-bold text-ink dark:text-white">{user ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</h2><p className="mt-1 text-xs text-slate-500">{user ? "Nhập mật khẩu mới nếu cần đổi; để trống để giữ nguyên." : "Người dùng đăng nhập bằng tên tài khoản này."}</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20}/></button></div>
      <div className="space-y-5 p-6">
        <label className="block"><span className="field-label"><UserRound size={17}/>Họ và tên</span><input autoFocus className="field-input" value={form.fullName} onChange={event => set("fullName", event.target.value)} placeholder="Nguyễn Văn A"/></label>
        <label className="block"><span className="field-label"><UserRound size={17}/>Tên đăng nhập</span><input className="field-input" value={form.username} onChange={event => set("username", event.target.value)} placeholder="nguyenvana"/><small className="mt-1.5 block text-xs text-slate-400">3–32 ký tự: chữ thường không dấu, số, dấu chấm, _ hoặc -.</small></label>
        <label className="block"><span className="field-label"><KeyRound size={17}/>{user ? "Đổi mật khẩu" : "Mật khẩu"}</span><input className="field-input" type="password" value={form.password} onChange={event => set("password", event.target.value)} placeholder={user ? "Để trống nếu không đổi" : "Tối thiểu 8 ký tự"}/></label>
        <label className="block"><span className="field-label"><ShieldCheck size={17}/>Phân quyền</span><span className="relative block"><select className="field-input appearance-none" value={form.role} onChange={event => set("role", event.target.value)}>{roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/></span></label>
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800"><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Hủy</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={18}/> : <Check size={18}/>}Lưu tài khoản</button></div>
    </form>
  </div>;
}

function DeleteUser({ user, busy, onClose, onConfirm }) {
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"><Trash2 size={23}/></span><h2 className="mt-5 text-xl font-bold text-ink dark:text-white">Xóa tài khoản?</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Tài khoản <b>@{user.username}</b> sẽ không thể đăng nhập sau khi bị xóa.</p><div className="mt-6 grid grid-cols-2 gap-3"><button className="secondary-button" onClick={onClose} disabled={busy}>Hủy</button><button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50" onClick={onConfirm} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17}/> : <Trash2 size={17}/>}Xóa User</button></div></div></div>;
}

export default function UserAdminPage() {
  const auth = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try { setUsers(await listManagedUsers()); }
    catch (error) { toast.error(error.message || "Không thể tải danh sách tài khoản"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return users.filter(user => !keyword || `${user.fullName} ${user.username} ${user.role}`.toLocaleLowerCase("vi").includes(keyword));
  }, [query, users]);
  useEffect(() => setPage(1), [query]);
  const paged = pageItems(filtered, page, 10);

  const save = async form => {
    try {
      const saved = editor ? await updateManagedUser({ ...form, id: editor.id }) : await createManagedUser(form);
      setUsers(current => editor ? current.map(user => user.id === saved.id ? { ...user, ...saved } : user) : [saved, ...current]);
      setEditorOpen(false);
      toast.success(editor ? "Đã cập nhật tài khoản" : "Đã tạo tài khoản mới");
    } catch (error) {
      toast.error(error.message || "Không thể lưu tài khoản");
      throw error;
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteManagedUser(deleteTarget.id);
      setUsers(current => current.filter(user => user.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Đã xóa tài khoản");
    } catch (error) {
      toast.error(error.message || "Không thể xóa tài khoản");
    } finally {
      setDeleting(false);
    }
  };

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-blue-600 dark:text-blue-300"><ShieldCheck size={16}/>{auth.isSuperAdmin ? "SuperAdmin" : "Admin"}</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Quản lý User</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Tạo tài khoản, đổi mật khẩu và phân quyền truy cập.</p></div><button className="primary-button" onClick={() => { setEditor(null); setEditorOpen(true); }}><Plus size={18}/>Thêm User</button></div>
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300"><ShieldCheck className="mt-0.5 shrink-0" size={18}/><p>{auth.isSuperAdmin ? "SuperAdmin có thể xem và phân quyền SuperAdmin, Admin, User; đồng thời đổi mật khẩu các tài khoản khác." : "Admin có thể xem và phân quyền User hoặc Admin. Tài khoản SuperAdmin được ẩn hoàn toàn."}</p></div>
    <div className={`mt-7 grid gap-4 ${auth.isSuperAdmin ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tài khoản hiển thị</span><strong className="mt-2 block text-3xl text-ink dark:text-white">{users.length}</strong></div>{auth.isSuperAdmin && <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 dark:border-violet-900/70 dark:bg-violet-950/40"><span className="text-xs font-bold uppercase tracking-wider text-violet-600">SuperAdmin</span><strong className="mt-2 block text-3xl text-violet-700 dark:text-violet-300">{users.filter(user => user.role === "superadmin").length}</strong></div>}<div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/70 dark:bg-blue-950/40"><span className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin</span><strong className="mt-2 block text-3xl text-blue-700 dark:text-blue-300">{users.filter(user => user.role === "admin").length}</strong></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/70 dark:bg-emerald-950/40"><span className="text-xs font-bold uppercase tracking-wider text-emerald-600">User</span><strong className="mt-2 block text-3xl text-emerald-700 dark:text-emerald-300">{users.filter(user => user.role === "user").length}</strong></div></div>
    <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5"><label className="relative block max-w-md"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="field-input !pl-11" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm họ tên, tài khoản hoặc vai trò..."/></label></div>{loading ? <div className="flex min-h-72 flex-col items-center justify-center text-slate-500"><LoaderCircle className="animate-spin text-brand-500" size={32}/><span className="mt-3 text-sm">Đang tải danh sách tài khoản...</span></div> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/70 dark:text-slate-400"><tr><th className="px-5 py-3.5">Người dùng</th><th className="px-4 py-3.5">Vai trò</th><th className="px-4 py-3.5">Ngày tạo</th><th className="px-4 py-3.5">Đăng nhập gần nhất</th><th className="px-5 py-3.5 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{paged.items.map(user => <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{(user.fullName || user.username || "U").charAt(0).toUpperCase()}</span><div><b className="block text-slate-800 dark:text-slate-100">{user.fullName || "Chưa đặt tên"}</b><span className="mt-0.5 block text-xs text-slate-400">@{user.username}</span></div></div></td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${roleColors[user.role]}`}>{roleLabels[user.role]}</span></td><td className="px-4 py-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays size={14}/>{formatBlogDate(user.createdAt)}</span></td><td className="px-4 py-4 text-xs text-slate-500">{user.lastSignInAt ? formatBlogDate(user.lastSignInAt) : "Chưa đăng nhập"}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => { setEditor(user); setEditorOpen(true); }} aria-label="Sửa User" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"><Edit3 size={17}/></button><button onClick={() => setDeleteTarget(user)} aria-label="Xóa User" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"><Trash2 size={17}/></button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="flex min-h-56 flex-col items-center justify-center text-center"><UsersRound className="text-slate-300" size={38}/><b className="mt-3 text-sm text-slate-600 dark:text-slate-300">Không tìm thấy User</b></div>}</div>}<Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/></div>
    {editorOpen && <UserEditor user={editor} currentRole={auth.role} onClose={() => setEditorOpen(false)} onSave={save}/>} {deleteTarget && <DeleteUser user={deleteTarget} busy={deleting} onClose={() => setDeleteTarget(null)} onConfirm={remove}/>} 
  </section>;
}
