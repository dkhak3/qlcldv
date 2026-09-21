import { useEffect, useState } from "react";
import { CheckCircle2, FileClock, FileSpreadsheet, History, LoaderCircle, RefreshCcw, ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "react-toastify";
import { getReportTemplates, getReportTemplateVersions, restoreReportTemplate, saveReportTemplate } from "../services/reportTemplateService";
import ConfirmDialog from "../components/ConfirmDialog";

const formatBytes = bytes => bytes ? `${(Number(bytes) / 1024).toFixed(1)} KB` : "—";
const formatDateTime = value => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Chưa cập nhật";

export default function ReportTemplateAdminPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [historyKey, setHistoryKey] = useState("");
  const [versions, setVersions] = useState([]);
  const [restoreTarget, setRestoreTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setTemplates(await getReportTemplates()); }
    catch (error) { toast.error(error.message || "Không thể tải danh sách template"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const upload = async (template, file) => {
    if (!file) return;
    setBusyKey(template.key);
    try {
      await saveReportTemplate(template.key, file);
      toast.success(`Đã cập nhật mẫu ${template.label}`);
      await load();
      if (historyKey === template.key) setVersions(await getReportTemplateVersions(template.key));
    } catch (error) { toast.error(error.message || "Không thể cập nhật template"); }
    finally { setBusyKey(""); }
  };

  const openHistory = async key => {
    setHistoryKey(key);
    setVersions([]);
    try { setVersions(await getReportTemplateVersions(key)); }
    catch (error) { toast.error(error.message || "Không thể tải lịch sử template"); }
  };

  const restore = async () => {
    if (!restoreTarget) return;
    setBusyKey(restoreTarget.templateKey);
    try {
      await restoreReportTemplate(restoreTarget.templateKey, restoreTarget.version);
      toast.success("Đã khôi phục phiên bản template");
      setRestoreTarget(null);
      await load();
      setVersions(await getReportTemplateVersions(restoreTarget.templateKey));
    } catch (error) { toast.error(error.message || "Không thể khôi phục template"); }
    finally { setBusyKey(""); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-violet-600 dark:text-violet-300"><ShieldCheck size={16}/>Chỉ SuperAdmin</span>
    <h1 className="mt-3 text-3xl font-bold text-ink dark:text-white">Quản lý Template Excel</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Thay mẫu báo cáo mà không cần sửa code. Mỗi lần tải lên sẽ lưu một phiên bản để có thể xem lịch sử và khôi phục khi cần.</p>

    {loading ? <div className="mt-8 grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-brand-500" size={34}/></div> : <div className="mt-7 grid gap-5 lg:grid-cols-2">{templates.map(template => <article key={template.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"><FileSpreadsheet size={23}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-ink dark:text-white">{template.label}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${template.source === "firestore" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>{template.source === "firestore" ? "Đang quản lý" : "File mặc định"}</span></div><p className="mt-1 truncate text-xs text-slate-400">{template.originalName || template.staticPath}</p></div></div>
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs dark:bg-slate-950/50"><div><span className="text-slate-400">Dung lượng</span><b className="mt-1 block text-slate-700 dark:text-slate-200">{formatBytes(template.size)}</b></div><div><span className="text-slate-400">Cập nhật</span><b className="mt-1 block text-slate-700 dark:text-slate-200">{formatDateTime(template.updatedAt)}</b></div><div className="col-span-2"><span className="text-slate-400">Sheet</span><b className="mt-1 block text-slate-700 dark:text-slate-200">{template.sheetNames?.join(", ") || template.requiredSheets.join(", ")}</b></div>{template.hash && <div className="col-span-2"><span className="text-slate-400">SHA-256</span><code className="mt-1 block truncate text-[10px] text-slate-500">{template.hash}</code></div>}</div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2"><label className="primary-button cursor-pointer"><UploadCloud size={17}/>{busyKey === template.key ? "Đang kiểm tra..." : "Thay mẫu"}<input className="sr-only" type="file" accept=".xlsx" disabled={busyKey === template.key} onChange={event => { upload(template, event.target.files?.[0]); event.target.value = ""; }}/></label><button className="secondary-button" onClick={() => openHistory(template.key)}><History size={17}/>Lịch sử phiên bản</button></div>
    </article>)}</div>}

    {historyKey && <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><h2 className="flex items-center gap-2 font-bold text-ink dark:text-white"><FileClock size={18}/>Lịch sử · {templates.find(item => item.key === historyKey)?.label}</h2><p className="mt-1 text-xs text-slate-500">Phiên bản mới nhất nằm trên cùng.</p></div><button className="text-xs font-bold text-slate-500" onClick={() => setHistoryKey("")}>Đóng</button></div><div className="divide-y divide-slate-100 dark:divide-slate-800">{versions.length ? versions.map(version => <div key={version.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><b className="block truncate text-sm text-slate-700 dark:text-slate-200">{version.originalName}</b><span className="mt-1 block text-xs text-slate-400">{formatDateTime(version.createdAt)} · {formatBytes(version.size)} · {version.sheetNames?.join(", ")}</span></div><button className="secondary-button !h-10 shrink-0" disabled={busyKey === historyKey} onClick={() => setRestoreTarget({ templateKey: historyKey, version })}><RefreshCcw size={16}/>Khôi phục</button></div>) : <div className="px-5 py-10 text-center text-sm text-slate-400">Chưa có phiên bản được tải lên.</div>}</div></div>}

    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 shrink-0" size={17}/><span>Trước khi lưu, hệ thống tự kiểm tra file XLSX, dung lượng và các sheet bắt buộc. Nếu chưa có template trên Firestore, hệ thống vẫn tự dùng file mặc định trong mã nguồn.</span></div>
    {restoreTarget && <ConfirmDialog title="Khôi phục template?" description={`Hệ thống sẽ dùng lại file “${restoreTarget.version.originalName}”. Phiên bản hiện tại không bị xóa khỏi lịch sử.`} confirmLabel="Khôi phục" busy={Boolean(busyKey)} onClose={() => setRestoreTarget(null)} onConfirm={restore}/>}
  </section>;
}
