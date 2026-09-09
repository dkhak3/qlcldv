import { useEffect, useState } from "react";
import { Eye, EyeOff, Link2, LoaderCircle, Save } from "lucide-react";
import { toast } from "react-toastify";
import { usePageSettings } from "../PageSettingsContext";
import { saveSitePage } from "../services/sitePageService";
import { slugifyBlogTitle } from "../utils/blog";

export default function PageSettingsAdminPage() {
  const pageSettings = usePageSettings();
  const [pages, setPages] = useState(pageSettings.pages);
  const [busy, setBusy] = useState("");
  useEffect(() => setPages(pageSettings.pages), [pageSettings.pages]);
  const set = (key, field, value) => setPages(current => current.map(item => item.key === key ? { ...item, [field]: value } : item));
  const save = async page => {
    const slug = slugifyBlogTitle(page.slug);
    if (!slug) return toast.warning("Slug không được để trống");
    if (pages.some(item => item.key !== page.key && slugifyBlogTitle(item.slug) === slug)) return toast.error("Slug này đang được một trang khác sử dụng");
    setBusy(page.key);
    try { await saveSitePage({ ...page, slug }); await pageSettings.refresh(); toast.success(`Đã cập nhật trang “${page.title}”`); }
    catch (error) { toast.error(error.message || "Không thể cập nhật trang"); }
    finally { setBusy(""); }
  };
  return <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-indigo-600 dark:text-indigo-300"><Link2 size={16}/>SuperAdmin</span><h1 className="mt-3 text-3xl font-bold text-ink dark:text-white">Quản lý trang &amp; slug</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Đổi tên hiển thị, đường dẫn hoặc ẩn trang. Slug của các Box báo cáo được chỉnh tại “Quản lý Box báo cáo”.</p><div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"><div className="divide-y divide-slate-100 dark:divide-slate-800">{pages.map(page => <div key={page.key} className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end"><label><span className="field-label">Tên trang</span><input className="field-input" value={page.title} onChange={event => set(page.key, "title", event.target.value)}/></label><label><span className="field-label">Slug</span><input className="field-input" value={page.slug} onChange={event => set(page.key, "slug", event.target.value)}/></label><button type="button" disabled={page.key === "page-admin"} title={page.key === "page-admin" ? "Trang quản lý slug luôn được giữ hiển thị để tránh tự khóa quyền truy cập" : ""} onClick={() => set(page.key, "hidden", !page.hidden)} className={`secondary-button disabled:cursor-not-allowed disabled:opacity-40 ${page.hidden ? "!text-slate-500" : "!text-emerald-600"}`}>{page.hidden ? <EyeOff size={17}/> : <Eye size={17}/>} {page.hidden ? "Đang ẩn" : "Đang hiện"}</button><button type="button" className="primary-button" onClick={() => save(page)} disabled={busy === page.key}>{busy === page.key ? <LoaderCircle className="animate-spin" size={17}/> : <Save size={17}/>}Lưu</button></div>)}</div></div></section>;
}
