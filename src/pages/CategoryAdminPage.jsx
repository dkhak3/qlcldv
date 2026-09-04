import { useEffect, useMemo, useState } from "react";
import { Edit3, LoaderCircle, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination, { pageItems } from "../components/Pagination";
import { createBlogCategory, deleteBlogCategory, getBlogCategories, updateBlogCategory } from "../services/blogCategoryService";

export default function CategoryAdminPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const load = async () => {
    setLoading(true);
    try { setCategories(await getBlogCategories()); }
    catch (error) { toast.error(error.message || "Không thể tải chuyên mục"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const sorted = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name, "vi")), [categories]);
  const paged = pageItems(sorted, page, 10);
  const save = async event => {
    event.preventDefault();
    const clean = name.replace(/\s+/g, " ").trim();
    if (!clean) return toast.warning("Vui lòng nhập tên chuyên mục");
    if (categories.some(item => item.name.toLocaleLowerCase("vi") === clean.toLocaleLowerCase("vi") && item.id !== editing?.id)) return toast.warning("Chuyên mục này đã tồn tại");
    setBusy(true);
    try {
      const saved = editing ? await updateBlogCategory(editing.id, clean) : await createBlogCategory(clean);
      setCategories(current => editing ? current.map(item => item.id === editing.id ? saved : item) : [...current, saved]);
      setEditing(null); setName(""); toast.success(editing ? "Đã đổi tên chuyên mục" : "Đã thêm chuyên mục");
    } catch (error) { toast.error(error.message || "Không thể lưu chuyên mục"); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await deleteBlogCategory(target.id); setCategories(current => current.filter(item => item.id !== target.id)); setTarget(null); toast.success("Đã xóa chuyên mục"); }
    catch (error) { toast.error(error.message || "Không thể xóa chuyên mục"); }
    finally { setBusy(false); }
  };
  return <section className="mx-auto max-w-5xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-violet-600 dark:text-violet-300"><Tags size={16}/>Nội dung Blog</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Quản lý chuyên mục</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Admin và SuperAdmin có thể thêm, đổi tên hoặc xóa chuyên mục dùng trong bài viết.</p>
    <form onSubmit={save} className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:flex-row"><input className="field-input flex-1" value={name} onChange={event => setName(event.target.value)} placeholder="Tên chuyên mục mới"/><button className="primary-button shrink-0" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17}/> : editing ? <Edit3 size={17}/> : <Plus size={17}/>} {editing ? "Lưu tên mới" : "Thêm chuyên mục"}</button>{editing && <button type="button" className="secondary-button shrink-0" onClick={() => { setEditing(null); setName(""); }}>Hủy</button>}</form>
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">{loading ? <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="animate-spin text-brand-500" size={32}/></div> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{paged.items.map(item => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4"><b className="text-sm text-slate-800 dark:text-white">{item.name}</b><div className="flex gap-1"><button type="button" onClick={() => { setEditing(item); setName(item.name); }} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40"><Edit3 size={17}/></button><button type="button" onClick={() => setTarget(item)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"><Trash2 size={17}/></button></div></div>)}</div>}<Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/></div>
    {target && <ConfirmDialog danger title="Xóa chuyên mục?" description={`Chuyên mục “${target.name}” sẽ bị xóa. Các bài cũ vẫn giữ tên chuyên mục đã chọn.`} confirmLabel="Xóa chuyên mục" busy={busy} onClose={() => setTarget(null)} onConfirm={remove}/>} 
  </section>;
}
