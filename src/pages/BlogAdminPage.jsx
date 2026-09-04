import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BookOpenText, CalendarDays, Check, ChevronDown, Database, Edit3, Eye, FileText, Image as ImageIcon, LoaderCircle, Plus, Search, ShieldCheck, Trash2, UploadCloud, Video, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import BlogCover from "../components/BlogCover";
import Pagination, { pageItems } from "../components/Pagination";
import { getBlogCategories } from "../services/blogCategoryService";
import { createBlogPost, deleteBlogPostRecord, getAllBlogPosts, updateBlogPostRecord, uploadBlogImage } from "../services/blogService";
import { addBlogPost, deleteBlogPost, setBlogError, setBlogLoading, setBlogPosts, updateBlogPost } from "../store";
import { calculateReadTime, createRandomBlogSlug, formatBlogDate, slugifyBlogTitle } from "../utils/blog";
import { isGoogleDriveUrl } from "../utils/media";
import { usePageSettings } from "../PageSettingsContext";

const makeEmptyForm = author => ({
  title: "", slug: "", excerpt: "", category: "Excel", tags: "", author: author || "QLCL-DV", status: "draft", featured: false, content: "", coverUrl: "", videoUrl: "",
});

const roleNames = { admin: "Admin", superadmin: "SuperAdmin" };

function MediaPicker({ icon: Icon, label, hint, accept, file, url, onChange, onRemove }) {
  const preview = useMemo(() => file ? URL.createObjectURL(file) : url, [file, url]);
  useEffect(() => () => { if (file && preview) URL.revokeObjectURL(preview); }, [file, preview]);
  return <div><span className="field-label"><Icon size={17}/>{label}</span><label className="group flex min-h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-orange-300 hover:bg-orange-50/40 dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-orange-800">
    {preview ? <img className="max-h-56 w-full object-cover" src={preview} alt="Xem trước ảnh bìa"/> : <><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-orange-300"><UploadCloud size={22}/></span><b className="mt-3 text-sm text-slate-700 dark:text-slate-200">Chọn {label.toLowerCase()}</b><small className="mt-1 px-4 text-xs text-slate-400">{hint}</small></>}
    <input className="sr-only" type="file" accept={accept} onChange={onChange}/>
  </label>{preview && <div className="mt-2 flex items-center justify-between gap-3"><span className="min-w-0 truncate text-xs text-slate-400">{file?.name || "Ảnh đang lưu trên ImgBB"}</span><button type="button" onClick={onRemove} className="shrink-0 text-xs font-bold text-rose-600 hover:text-rose-700">Xóa ảnh khỏi bài</button></div>}</div>;
}

function EditorModal({ post, author, onClose, onSave, posts, categories }) {
  const [form, setForm] = useState(post ? { ...post, tags: post.tags.join(", ") } : makeEmptyForm(author));
  const [coverFile, setCoverFile] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const changeTitle = value => setForm(current => ({ ...current, title: value, slug: slugTouched ? current.slug : slugifyBlogTitle(value) }));

  const chooseCover = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Ảnh bìa phải là file hình ảnh");
    if (file.size > 3 * 1024 * 1024) return toast.error("Ảnh bìa không được lớn hơn 3 MB");
    setCoverFile(file); setRemoveCover(false);
  };
  const submit = async event => {
    event.preventDefault();
    const baseSlug = slugifyBlogTitle(form.slug || form.title);
    const slug = post ? (posts.some(item => item.slug === baseSlug && item.id !== post.id) ? createRandomBlogSlug(baseSlug, posts.map(item => item.slug)) : baseSlug) : createRandomBlogSlug(baseSlug, posts.map(item => item.slug));
    if (!form.title.trim() || !slug || !form.excerpt.trim() || !form.content.trim()) return toast.warning("Vui lòng nhập đủ tiêu đề, mô tả và nội dung bài viết");
    if (!coverFile && (!form.coverUrl || removeCover)) return toast.warning("Mỗi bài Blog cần có một ảnh bìa");
    if (form.videoUrl && !isGoogleDriveUrl(form.videoUrl)) return toast.error("Video phải là liên kết file Google Drive");
    setSaving(true);
    try {
      await onSave({ ...form, slug, tags: form.tags.split(",").map(tag => tag.trim()).filter(Boolean), readTime: calculateReadTime(form.content) }, { coverFile, removeCover });
    } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="blog-editor-title">
    <form onSubmit={submit} className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-7"><div><h2 id="blog-editor-title" className="text-lg font-bold text-ink dark:text-white">{post ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}</h2><p className="mt-1 text-xs text-slate-500">Text lưu ở Firebase, ảnh ở ImgBB và video dùng liên kết Google Drive.</p></div><button type="button" onClick={onClose} aria-label="Đóng" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20}/></button></div>
      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-2">
        <label className="lg:col-span-2"><span className="field-label">Tiêu đề bài viết</span><input autoFocus className="field-input" value={form.title} onChange={event => changeTitle(event.target.value)} placeholder="Nhập tiêu đề rõ ràng, dễ tìm kiếm"/></label>
        <label><span className="field-label">Slug đường dẫn</span><input className="field-input" value={form.slug} onChange={event => { setSlugTouched(true); set("slug", event.target.value); }} placeholder="ten-bai-viet"/><small className="mt-1.5 block text-xs text-slate-400">/blog/{slugifyBlogTitle(form.slug || form.title) || "ten-bai-viet"}</small></label>
        <label><span className="field-label">Tác giả</span><input className="field-input" value={form.author} onChange={event => set("author", event.target.value)} /></label>
        <label><span className="field-label">Chuyên mục</span>{categories.length ? <span className="relative block"><select className="field-input appearance-none" value={form.category} onChange={event => set("category", event.target.value)}>{categories.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/></span> : <input className="field-input" value={form.category} onChange={event => set("category", event.target.value)} placeholder="Hãy tạo chuyên mục trước"/>}</label>
        <label><span className="field-label">Trạng thái</span><span className="relative block"><select className="field-input appearance-none" value={form.status} onChange={event => set("status", event.target.value)}><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option></select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/></span></label>
        <MediaPicker icon={ImageIcon} label="Ảnh bìa" hint="JPG, PNG, WebP hoặc GIF • tối đa 3 MB • lưu tại ImgBB" accept="image/jpeg,image/png,image/webp,image/gif" file={coverFile} url={removeCover ? "" : form.coverUrl} onChange={chooseCover} onRemove={() => { setCoverFile(null); setRemoveCover(true); }}/>
        <label><span className="field-label"><Video size={17}/>Video Google Drive (không bắt buộc)</span><input className="field-input" type="url" value={form.videoUrl} onChange={event => set("videoUrl", event.target.value)} placeholder="https://drive.google.com/file/d/.../view"/><small className="mt-1.5 block text-xs text-slate-400">Đặt quyền video là “Bất kỳ ai có đường liên kết – Người xem”.</small></label>
        <label className="lg:col-span-2"><span className="field-label">Mô tả ngắn</span><textarea className="field-input !h-24 !py-3" value={form.excerpt} onChange={event => set("excerpt", event.target.value)} placeholder="Tóm tắt nội dung hiển thị trên thẻ bài viết"/></label>
        <label className="lg:col-span-2"><span className="field-label">Nội dung</span><textarea className="field-input !h-64 !py-3 leading-7" value={form.content} onChange={event => set("content", event.target.value)} placeholder={"Nhập nội dung bài viết...\n\n## Tiêu đề mục\n\n- Một ý trong danh sách"}/><small className="mt-1.5 block text-xs text-slate-400">Hỗ trợ tiêu đề dạng <b>## Tiêu đề</b> và danh sách dạng <b>- Nội dung</b>.</small></label>
        <label className="lg:col-span-2"><span className="field-label">Thẻ nội dung</span><input className="field-input" value={form.tags} onChange={event => set("tags", event.target.value)} placeholder="Excel, Camera, Mẹo hay (phân cách bằng dấu phẩy)"/></label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60 lg:col-span-2"><input type="checkbox" checked={form.featured} onChange={event => set("featured", event.target.checked)} className="h-4 w-4 accent-orange-500"/><span><b className="block text-sm text-slate-700 dark:text-slate-200">Đặt làm bài viết nổi bật</b><small className="text-xs text-slate-400">Bài viết nổi bật cũ sẽ tự động được bỏ chọn.</small></span></label>
      </div>
      <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row sm:justify-end sm:px-7"><button type="button" onClick={onClose} className="secondary-button" disabled={saving}>Hủy</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={18}/> : <Check size={18}/>} {saving ? "Đang lưu..." : post ? "Lưu thay đổi" : "Tạo bài viết"}</button></div>
    </form>
  </div>;
}

function DeleteModal({ post, busy, onClose, onConfirm }) {
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 p-5 backdrop-blur-sm" role="alertdialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"><Trash2 size={23}/></span><h2 className="mt-5 text-xl font-bold text-ink dark:text-white">Xóa bài viết này?</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">“{post.title}” cùng ảnh/video của bài sẽ bị xóa khỏi database.</p><div className="mt-6 grid grid-cols-2 gap-3"><button className="secondary-button" onClick={onClose} disabled={busy}>Hủy</button><button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50" onClick={onConfirm} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17}/> : <Trash2 size={17}/>}Xóa bài</button></div></div></div>;
}

export default function BlogAdminPage() {
  const dispatch = useDispatch();
  const auth = useAuth();
  const pageSettings = usePageSettings();
  const { posts, loading, error } = useSelector(state => state.blog);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editor, setEditor] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);

  const loadPosts = async () => {
    dispatch(setBlogLoading(true));
    try { dispatch(setBlogPosts(await getAllBlogPosts())); }
    catch (loadError) { dispatch(setBlogError(loadError.message || "Không thể tải bài viết")); }
    finally { dispatch(setBlogLoading(false)); }
  };
  useEffect(() => { loadPosts(); getBlogCategories().then(setCategories).catch(error => toast.error(error.message || "Không thể tải chuyên mục")); }, []);

  const filtered = useMemo(() => posts.filter(post => {
    const matchesStatus = status === "all" || post.status === status;
    const keyword = query.trim().toLocaleLowerCase("vi");
    return matchesStatus && (!keyword || `${post.title} ${post.category} ${post.author}`.toLocaleLowerCase("vi").includes(keyword));
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)), [posts, query, status]);
  const published = posts.filter(post => post.status === "published").length;
  useEffect(() => setPage(1), [query, status]);
  const paged = pageItems(filtered, page, 10);

  const save = async (form, media) => {
    try {
      let coverUrl = media.removeCover ? "" : form.coverUrl;
      if (media.coverFile) coverUrl = await uploadBlogImage(media.coverFile);
      const payload = { ...form, coverUrl };
      const saved = editor ? await updateBlogPostRecord(payload) : await createBlogPost(payload, auth.user.uid);
      dispatch(editor ? updateBlogPost(saved) : addBlogPost(saved));
      setEditorOpen(false);
      toast.success(editor ? "Đã cập nhật bài viết trên database" : "Đã tạo bài viết trên database");
    } catch (saveError) {
      const message = saveError.code === "23505" ? "Slug bài viết đã tồn tại" : saveError.message;
      toast.error(message || "Không thể lưu bài viết");
      throw saveError;
    }
  };
  const remove = async () => {
    setDeleting(true);
    try {
      await deleteBlogPostRecord(deleteTarget.id);
      dispatch(deleteBlogPost(deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Đã xóa bài viết khỏi database");
    } catch (deleteError) { toast.error(deleteError.message || "Không thể xóa bài viết"); }
    finally { setDeleting(false); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><Link to={pageSettings.pathFor("blog")} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-orange-300"><BookOpenText size={17}/>Xem trang Blog</Link><h1 className="mt-4 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Quản lý Blog</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Thêm bài viết có ảnh, video và xuất bản cho người dùng.</p></div><div className="flex flex-wrap gap-3"><Link className="secondary-button" to={pageSettings.pathFor("category-admin")}>Quản lý chuyên mục</Link><button className="primary-button" onClick={() => { setEditor(null); setEditorOpen(true); }}><Plus size={18}/>Thêm bài viết</button></div></div>
    <div className="mt-7 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"><Database className="mt-0.5 shrink-0" size={19}/><p><b>Đã kết nối Firebase.</b> Bạn đang đăng nhập với quyền {roleNames[auth.role]}. Bài viết lưu ở Firestore; ảnh được tải lên ImgBB.</p></div>
    {error && <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

    <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng bài viết</span><strong className="mt-2 block text-3xl text-ink dark:text-white">{posts.length}</strong></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/70 dark:bg-emerald-950/40"><span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đã xuất bản</span><strong className="mt-2 block text-3xl text-emerald-700 dark:text-emerald-300">{published}</strong></div><div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-900/70 dark:bg-amber-950/40"><span className="text-xs font-bold uppercase tracking-wider text-amber-600">Bản nháp</span><strong className="mt-2 block text-3xl text-amber-700 dark:text-amber-300">{posts.length - published}</strong></div></div>

    <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-5"><label className="relative block flex-1 sm:max-w-md"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="field-input !pl-11" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tiêu đề, chuyên mục, tác giả..."/></label><div className="flex gap-2">{[{value:"all",label:"Tất cả"},{value:"published",label:"Đã đăng"},{value:"draft",label:"Bản nháp"}].map(item => <button type="button" key={item.value} onClick={() => setStatus(item.value)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${status === item.value ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>{item.label}</button>)}</div></div>
      {loading ? <div className="flex min-h-72 flex-col items-center justify-center text-slate-500"><LoaderCircle className="animate-spin text-brand-500" size={32}/><span className="mt-3 text-sm">Đang đồng bộ dữ liệu...</span></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/70 dark:text-slate-400"><tr><th className="px-5 py-3.5 font-semibold">Bài viết</th><th className="px-4 py-3.5 font-semibold">Chuyên mục</th><th className="px-4 py-3.5 font-semibold">Trạng thái</th><th className="px-4 py-3.5 font-semibold">Cập nhật</th><th className="px-5 py-3.5 text-right font-semibold">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{paged.items.map(post => <tr key={post.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"><td className="px-5 py-4"><div className="flex items-center gap-3"><BlogCover post={post} compact className="h-14 w-20 shrink-0 rounded-xl"/><div className="min-w-0"><b className="block max-w-md truncate text-sm text-slate-800 dark:text-slate-100">{post.title}</b><span className="mt-1 block max-w-sm truncate text-xs text-slate-400">/blog/{post.slug}</span></div></div></td><td className="px-4 py-4 font-semibold text-slate-600 dark:text-slate-300">{post.category}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${post.status === "published" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"}`}>{post.status === "published" ? "Đã xuất bản" : "Bản nháp"}</span></td><td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400"><span className="flex items-center gap-1.5"><CalendarDays size={14}/>{formatBlogDate(post.updatedAt)}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Link to={`/blog/${post.slug}`} title="Xem bài" aria-label="Xem bài" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"><Eye size={17}/></Link><button title="Sửa bài" aria-label="Sửa bài" onClick={() => { setEditor(post); setEditorOpen(true); }} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-orange-50 hover:text-brand-600 dark:hover:bg-orange-950/50 dark:hover:text-orange-300"><Edit3 size={17}/></button><button title="Xóa bài" aria-label="Xóa bài" onClick={() => setDeleteTarget(post)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"><Trash2 size={17}/></button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="flex min-h-56 flex-col items-center justify-center text-center"><FileText className="text-slate-300" size={38}/><b className="mt-3 text-sm text-slate-600 dark:text-slate-300">Không có bài viết phù hợp</b><span className="mt-1 text-xs text-slate-400">Hãy thử thay đổi từ khóa hoặc bộ lọc.</span></div>}</div>}
      <Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/>
    </div>
    {editorOpen && <EditorModal post={editor} author={auth.profile?.fullName} posts={posts} categories={categories} onClose={() => setEditorOpen(false)} onSave={save}/>} 
    {deleteTarget && <DeleteModal post={deleteTarget} busy={deleting} onClose={() => setDeleteTarget(null)} onConfirm={remove}/>} 
  </section>;
}
