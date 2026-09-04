import { useEffect, useMemo, useState } from "react";
import { Bus, Camera, ChartNoAxesCombined, ChevronDown, Clapperboard, Edit3, Eye, EyeOff, FileSpreadsheet, Gauge, Headphones, LoaderCircle, LockKeyhole, MapPin, Plus, Radio, Save, Search, ShieldCheck, Trash2, Video, Wrench, X } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "../components/ConfirmDialog";
import { REPORT_APPEARANCES, isCoreReportBox } from "../data/reportBoxes";
import Pagination, { pageItems } from "../components/Pagination";
import { deleteReportBox, getReportBoxes, saveReportBox } from "../services/reportBoxService";
import { slugifyBlogTitle } from "../utils/blog";
import { isGoogleDriveUrl, toGoogleDrivePreviewUrl } from "../utils/media";

const ICONS = { camera: Camera, "map-pin": MapPin, "file-spreadsheet": FileSpreadsheet, gauge: Gauge, headphones: Headphones, video: Video, bus: Bus, chart: ChartNoAxesCombined, radio: Radio, shield: ShieldCheck, wrench: Wrench };
const ICON_LABELS = { camera: "Camera", "map-pin": "Định vị", "file-spreadsheet": "Bảng tính", gauge: "Tốc độ", headphones: "Hỗ trợ", video: "Video", bus: "Xe buýt", chart: "Biểu đồ", radio: "Giám sát", shield: "Kiểm tra", wrench: "Sửa chữa" };
const COLOR_LABELS = { orange: "Cam", blue: "Xanh dương", emerald: "Xanh lá", violet: "Tím", cyan: "Xanh ngọc", rose: "Đỏ hồng", amber: "Hổ phách", indigo: "Chàm", teal: "Xanh teal", pink: "Hồng" };
const emptyBox = () => ({ key: "", slug: "", title: "", description: "", route: "", externalUrl: "", videoUrl: "", appearance: "orange", icon: "file-spreadsheet", hidden: false, sortOrder: 99, system: false });

function BoxEditor({ box, boxes, onClose, onSave }) {
  const [form, setForm] = useState(box || emptyBox());
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const previewUrl = toGoogleDrivePreviewUrl(form.videoUrl);
  const submit = async event => {
    event.preventDefault();
    const slug = slugifyBlogTitle(form.slug || form.title);
    if (!form.title.trim() || !slug) return toast.warning("Vui lòng nhập tên Box và slug");
    if (boxes.some(item => item.slug === slug && item.id !== form.id)) return toast.error("Slug của Box đã tồn tại");
    if (form.videoUrl && !isGoogleDriveUrl(form.videoUrl)) return toast.error("Video hướng dẫn phải là liên kết file Google Drive");
    setSaving(true);
    try {
      await onSave({ ...form, slug, key: form.key || `custom-${slug}` });
    } finally {
      setSaving(false);
    }
  };

  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-5"><form onSubmit={submit} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"><div><h2 className="text-lg font-bold text-ink dark:text-white">{box ? "Chỉnh sửa Box báo cáo" : "Thêm Box báo cáo"}</h2><p className="mt-1 text-xs text-slate-500">Tên, mô tả, video và trạng thái sẽ cập nhật trên trang chính.</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20}/></button></div>
    <div className="grid gap-5 p-6 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="field-label">Tên Box báo cáo</span><input autoFocus className="field-input" value={form.title} onChange={event => set("title", event.target.value)} placeholder="Báo cáo tuần ..."/></label>
      <label><span className="field-label">Slug</span><input className="field-input" value={form.slug} onChange={event => set("slug", event.target.value)} placeholder="bao-cao-ten-moi"/><small className="mt-1.5 block text-xs text-slate-400">/bao-cao/{slugifyBlogTitle(form.slug || form.title) || "slug"}</small></label>
      <label><span className="field-label">Thứ tự hiển thị</span><input className="field-input" type="number" min="1" value={form.sortOrder} onChange={event => set("sortOrder", Number(event.target.value))}/></label>
      <label className="sm:col-span-2"><span className="field-label">Mô tả ngắn</span><textarea className="field-input !h-24 !py-3" value={form.description} onChange={event => set("description", event.target.value)} placeholder="Mô tả chức năng của báo cáo"/></label>
      <label><span className="field-label">Biểu tượng</span><span className="relative block"><select className="field-input appearance-none" value={form.icon} onChange={event => set("icon", event.target.value)}>{Object.keys(ICONS).map(item => <option key={item} value={item}>{ICON_LABELS[item]}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/></span></label>
      <label><span className="field-label">Màu sắc</span><span className="relative block"><select className="field-input appearance-none" value={form.appearance} onChange={event => set("appearance", event.target.value)}>{Object.keys(REPORT_APPEARANCES).map(item => <option key={item} value={item}>{COLOR_LABELS[item] || item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/></span></label>
      <label className="sm:col-span-2"><span className="field-label"><Video size={17}/>Video hướng dẫn trên Google Drive</span><input className="field-input" type="url" value={form.videoUrl} onChange={event => set("videoUrl", event.target.value)} placeholder="https://drive.google.com/file/d/.../view"/><small className="mt-1.5 block text-xs text-slate-400">Video phải đặt quyền “Bất kỳ ai có đường liên kết – Người xem”.</small></label>
      {form.key === "txdl" && <label className="sm:col-span-2"><span className="field-label">Liên kết hệ thống TXDL</span><input className="field-input" type="url" value={form.externalUrl} onChange={event => set("externalUrl", event.target.value)} placeholder="https://txdl-project.vercel.app/"/></label>}
      {previewUrl && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 sm:col-span-2"><iframe className="aspect-video w-full" src={previewUrl} title="Xem trước video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div>}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60 sm:col-span-2"><input type="checkbox" checked={form.hidden} onChange={event => set("hidden", event.target.checked)} className="h-4 w-4 accent-orange-500"/><span><b className="block text-sm text-slate-700 dark:text-slate-200">Ẩn Box khỏi trang chính</b><small className="text-xs text-slate-400">Dữ liệu cấu hình vẫn được giữ lại để bật lại sau.</small></span></label>
    </div><div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Hủy</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={18}/> : <Save size={18}/>}Lưu Box</button></div></form></div>;
}

export default function ReportBoxAdminPage() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [editor, setEditor] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const load = () => {
    setLoading(true);
    getReportBoxes().then(setBoxes).catch(error => toast.error(error.message || "Không thể tải danh sách Box")).finally(() => setLoading(false));
  };
  useEffect(load, []);
  const filtered = useMemo(() => {
    const keyword = queryText.trim().toLocaleLowerCase("vi");
    return boxes.filter(box => !keyword || `${box.title} ${box.description} ${box.slug}`.toLocaleLowerCase("vi").includes(keyword));
  }, [boxes, queryText]);
  useEffect(() => setPage(1), [queryText]);
  const paged = pageItems(filtered, page, 9);

  const save = async form => {
    try {
      await saveReportBox(form);
      setEditorOpen(false);
      await load();
      toast.success(editor ? "Đã cập nhật Box báo cáo" : "Đã thêm Box báo cáo");
    } catch (error) {
      toast.error(error.message || "Không thể lưu Box báo cáo");
      throw error;
    }
  };
  const toggle = async box => {
    try {
      await saveReportBox({ ...box, hidden: !box.hidden });
      setBoxes(current => current.map(item => item.id === box.id ? { ...item, hidden: !item.hidden } : item));
      toast.success(box.hidden ? "Đã hiện Box trên trang chính" : "Đã ẩn Box khỏi trang chính");
    } catch (error) { toast.error(error.message || "Không thể đổi trạng thái Box"); }
  };
  const remove = async () => {
    setDeleting(true);
    try {
      await deleteReportBox(deleteTarget);
      setBoxes(current => current.filter(item => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Đã xóa Box báo cáo");
    } catch (error) {
      toast.error(error.message || "Không thể xóa Box báo cáo");
    } finally {
      setDeleting(false);
    }
  };

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-violet-600 dark:text-violet-300"><Clapperboard size={16}/>Nội dung trang chính</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Quản lý Box báo cáo tuần</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Thêm, sửa, xóa, sắp xếp, ẩn Box và cập nhật video hướng dẫn Google Drive. Năm Box chính được khóa xóa.</p></div><button className="primary-button" onClick={() => { setEditor(null); setEditorOpen(true); }}><Plus size={18}/>Thêm Box</button></div>
    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5"><label className="relative block max-w-md"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="field-input !pl-11" value={queryText} onChange={event => setQueryText(event.target.value)} placeholder="Tìm tên hoặc slug Box..."/></label></div>
    {loading ? <div className="mt-6 flex min-h-72 items-center justify-center"><LoaderCircle className="animate-spin text-brand-500" size={34}/></div> : <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{paged.items.map(box => { const Icon = ICONS[box.icon] || FileSpreadsheet; const core = isCoreReportBox(box); return <article key={box.id} className={`rounded-2xl border bg-white p-5 shadow-card transition dark:bg-slate-900 ${box.hidden ? "border-slate-200 opacity-65 dark:border-slate-800" : "border-slate-200 dark:border-slate-800"}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${REPORT_APPEARANCES[box.appearance] || REPORT_APPEARANCES.orange}`}><Icon size={24}/></span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${box.hidden ? "bg-slate-100 text-slate-500 dark:bg-slate-800" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"}`}>{box.hidden ? <EyeOff size={13}/> : <Eye size={13}/>} {box.hidden ? "Đang ẩn" : "Đang hiện"}</span></div><h2 className="mt-5 text-lg font-bold text-ink dark:text-white">{box.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500 dark:text-slate-400">{box.description}</p><div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-400"><span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">#{box.sortOrder}</span><span className="max-w-[190px] truncate rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">/{box.slug}</span>{box.videoUrl && <span className="rounded-lg bg-violet-50 px-2 py-1 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"><Video className="mr-1 inline" size={12}/>Có video</span>}{core && <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"><LockKeyhole size={12}/>Box chính</span>}</div><div className={`mt-5 grid gap-2 ${core ? "grid-cols-2" : "grid-cols-3"}`}><button className="secondary-button !h-10 !px-2" onClick={() => { setEditor(box); setEditorOpen(true); }}><Edit3 size={16}/><span className="hidden min-[420px]:inline">Sửa</span></button><button className="secondary-button !h-10 !px-2" onClick={() => toggle(box)}>{box.hidden ? <Eye size={16}/> : <EyeOff size={16}/>} {box.hidden ? "Hiện" : "Ẩn"}</button>{!core && <button className="secondary-button !h-10 !px-2 !text-rose-600" onClick={() => setDeleteTarget(box)}><Trash2 size={16}/>Xóa</button>}</div></article>; })}</div>}
    {!loading && <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/></div>}
    {!loading && !filtered.length && <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-400 dark:border-slate-700"><Clapperboard size={38}/><b className="mt-3 text-sm">Không tìm thấy Box phù hợp</b></div>}
    {editorOpen && <BoxEditor box={editor} boxes={boxes} onClose={() => setEditorOpen(false)} onSave={save}/>}
    {deleteTarget && <ConfirmDialog danger title="Xóa Box báo cáo?" description={`“${deleteTarget.title}” sẽ bị xóa vĩnh viễn. Thao tác này không ảnh hưởng 5 Box báo cáo chính.`} confirmLabel="Xóa Box" busy={deleting} onClose={() => setDeleteTarget(null)} onConfirm={remove}/>}
  </section>;
}
