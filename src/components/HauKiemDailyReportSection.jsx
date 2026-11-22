import { useEffect, useRef, useState } from "react";
import {
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import ConfirmDialog from "./ConfirmDialog";
import {
  deleteHauKiemDailyReport,
  downloadHauKiemDailyReport,
  setHauKiemDailyReportVisibility,
  subscribeHauKiemDailyReport,
  uploadHauKiemDailyReport,
} from "../services/hauKiemDailyReportService";
import {
  formatHauKiemDailyReportDate,
  formatHauKiemDailyReportSize,
} from "../utils/hauKiemDailyReport";

const ACCEPTED_FILES = ".xlsx,.xls,.xlsm,.pdf,.doc,.docx";

export default function HauKiemDailyReportSection() {
  const { isSuperAdmin, profile } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeHauKiemDailyReport(
      value => {
        setReport(value);
        setLoading(false);
      },
      error => {
        setLoading(false);
        if (error?.code !== "permission-denied") {
          console.error("Không thể tải thông tin File Báo cáo ngày:", error);
          toast.error(error.message || "Không thể tải File Báo cáo ngày");
        }
      },
    );
    return unsubscribe;
  }, []);

  const upload = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy("upload");
    try {
      await uploadHauKiemDailyReport(file, profile);
      toast.success("Đã tải File Báo cáo ngày lên Firebase");
    } catch (error) {
      toast.error(error.message || "Không thể tải File Báo cáo ngày lên");
    } finally {
      setBusy("");
    }
  };

  const download = async () => {
    setBusy("download");
    try {
      await downloadHauKiemDailyReport(report);
      toast.success("Đang tải File Báo cáo ngày về máy");
    } catch (error) {
      toast.error(error.message || "Không thể tải File Báo cáo ngày");
    } finally {
      setBusy("");
    }
  };

  const toggleVisibility = async () => {
    setBusy("visibility");
    try {
      const nextVisibility = report?.isVisible === false;
      await setHauKiemDailyReportVisibility(nextVisibility, profile);
      toast.success(nextVisibility ? "Đã hiển thị File Báo cáo ngày" : "Đã ẩn File Báo cáo ngày");
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật trạng thái hiển thị");
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await deleteHauKiemDailyReport();
      setConfirmDelete(false);
      toast.success("Đã xóa File Báo cáo ngày khỏi Firebase");
    } catch (error) {
      toast.error(error.message || "Không thể xóa File Báo cáo ngày");
    } finally {
      setBusy("");
    }
  };

  const publicCard = report && report.isVisible !== false;

  return <>
    {publicCard && <article className="mt-7 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-card dark:border-emerald-900/60 dark:bg-slate-900">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><FileSpreadsheet size={23}/></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold tracking-[.16em] text-emerald-700 dark:text-emerald-300">TÀI LIỆU HẬU KIỂM</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">ĐANG PHÁT HÀNH</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-ink dark:text-white">File Báo cáo ngày</h2>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400" title={report.originalName}>{report.originalName}</p>
            <p className="mt-1 text-[11px] text-slate-400">{formatHauKiemDailyReportSize(report.size)} · Cập nhật {formatHauKiemDailyReportDate(report.updatedAt)}</p>
          </div>
        </div>
        <button type="button" onClick={download} disabled={Boolean(busy)} className="primary-button shrink-0 !bg-emerald-700 hover:!bg-emerald-800 disabled:opacity-60">
          {busy === "download" ? <LoaderCircle className="animate-spin" size={18}/> : <Download size={18}/>}
          {busy === "download" ? "Đang tải..." : "Tải File Báo cáo ngày"}
        </button>
      </div>
    </article>}

    {isSuperAdmin && <section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/40 p-5 dark:border-violet-900/60 dark:bg-violet-950/15 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"><ShieldCheck size={20}/></span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Chỉ SuperAdmin</span>
            <h2 className="mt-1 text-lg font-bold text-ink dark:text-white">Quản lý File Báo cáo ngày</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Tải file lên Firebase, thay file hiện tại hoặc chủ động ẩn/hiển thị với người dùng.</p>
          </div>
        </div>
        {report && <span className={`inline-flex h-fit items-center rounded-full px-3 py-1.5 text-[11px] font-bold ${report.isVisible === false ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"}`}>
          {report.isVisible === false ? "ĐANG ẨN" : "ĐANG HIỂN THỊ"}
        </span>}
      </div>

      {loading ? <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/70 px-4 py-4 text-sm text-slate-500 dark:bg-slate-900/60"><LoaderCircle className="animate-spin" size={17}/>Đang tải thông tin file...</div> : report ? <div className="mt-5 rounded-xl border border-violet-100 bg-white p-4 dark:border-violet-900/50 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 shrink-0 text-emerald-600" size={20}/>
          <div className="min-w-0 flex-1">
            <b className="block break-all text-sm text-slate-700 dark:text-slate-200">{report.originalName}</b>
            <span className="mt-1 block text-xs text-slate-400">{formatHauKiemDailyReportSize(report.size)} · Cập nhật {formatHauKiemDailyReportDate(report.updatedAt)}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="secondary-button !h-10" disabled={Boolean(busy)} onClick={() => inputRef.current?.click()}>
            {busy === "upload" ? <LoaderCircle className="animate-spin" size={16}/> : <UploadCloud size={16}/>}Thay file
          </button>
          <button type="button" className="secondary-button !h-10" disabled={Boolean(busy)} onClick={toggleVisibility}>
            {report.isVisible === false ? <Eye size={16}/> : <EyeOff size={16}/>}
            {report.isVisible === false ? "Hiển thị" : "Ẩn"}
          </button>
          <button type="button" className="secondary-button !h-10 !text-rose-600" disabled={Boolean(busy)} onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16}/>Xóa file
          </button>
        </div>
      </div> : <div className="mt-5 rounded-xl border border-dashed border-violet-200 bg-white/70 p-5 text-center dark:border-violet-900/60 dark:bg-slate-900/60">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"><UploadCloud size={21}/></span>
        <b className="mt-3 block text-sm text-slate-700 dark:text-slate-200">Chưa có File Báo cáo ngày</b>
        <p className="mt-1 text-xs text-slate-400">Bạn có thể tải file lên ngay tại đây. Sau khi tải lên, người dùng sẽ thấy mục tải xuống.</p>
        <button type="button" className="primary-button mt-4" disabled={Boolean(busy)} onClick={() => inputRef.current?.click()}>
          {busy === "upload" ? <LoaderCircle className="animate-spin" size={17}/> : <UploadCloud size={17}/>}Tải file đầu tiên
        </button>
      </div>}
      <input ref={inputRef} className="sr-only" type="file" accept={ACCEPTED_FILES} disabled={Boolean(busy)} onChange={upload}/>
      <p className="mt-3 text-[11px] leading-5 text-slate-400">Hỗ trợ Excel, PDF, Word · Tối đa 25 MB. Khi thay file, file cũ sẽ được dọn khỏi Firebase Storage sau khi file mới được lưu thành công.</p>
    </section>}

    {confirmDelete && <ConfirmDialog
      title="Xóa File Báo cáo ngày?"
      description={`File “${report?.originalName || "Báo cáo ngày"}” sẽ bị xóa khỏi Firebase Storage và không còn xuất hiện với người dùng.`}
      confirmLabel="Xóa file"
      busy={busy === "delete"}
      danger
      onClose={() => setConfirmDelete(false)}
      onConfirm={remove}
    />}
  </>;
}
