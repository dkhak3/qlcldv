import { useState } from "react";
import { CalendarDays, CheckCircle2, Download, FileCheck2, FileSpreadsheet, LoaderCircle, Search, ShieldCheck, UploadCloud, UserRound, X } from "lucide-react";
import { toast } from "react-toastify";
import ManagedGuideVideo from "../components/ManagedGuideVideo";
import NoData from "../components/NoData";
import SaveReportButton from "../components/SaveReportButton";
import { exportHauKiemReport } from "../utils/exportHauKiemReport";
import { fingerprintHauKiemFile, processHauKiemFiles } from "../utils/hauKiemProcessor";

const EMPTY_RESULTS = { summary: [], detailRows: [], reportDetailRows: [], violations: [], fileSummaries: [], unmatchedCount: 0, ignoredOtherCount: 0 };

const formatDate = value => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value || "—";
};

function SummaryTable({ rows }) {
  const totals = rows.reduce((sum, row) => ({
    total: sum.total + row.total,
    finance: sum.finance + row.finance,
    atgt: sum.atgt + row.atgt,
    cldv: sum.cldv + row.cldv,
  }), { total: 0, finance: 0, atgt: 0, cldv: 0 });
  return <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
    <table className="w-full min-w-[780px] border-collapse text-sm">
      <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300"><tr><th className="px-3 py-3 text-center">STT</th><th className="px-3 py-3 text-left">Chi nhánh</th><th className="px-3 py-3 text-left">Tuyến</th><th className="px-3 py-3 text-center">Số lượng vi phạm</th><th className="px-3 py-3 text-center">Tài chính</th><th className="px-3 py-3 text-center">ATGT</th><th className="px-3 py-3 text-center">CLDV</th></tr></thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(row => <tr key={`${row.branch}-${row.route}`} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"><td className="px-3 py-3 text-center text-slate-500">{row.stt}</td><td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.branch}</td><td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.route}</td><td className="px-3 py-3 text-center font-bold text-emerald-700 dark:text-emerald-300">{row.total}</td><td className="px-3 py-3 text-center">{row.finance}</td><td className="px-3 py-3 text-center">{row.atgt}</td><td className="px-3 py-3 text-center">{row.cldv}</td></tr>)}</tbody>
      <tfoot><tr className="border-t border-emerald-100 bg-emerald-50 font-bold dark:border-emerald-900 dark:bg-emerald-950/30"><td className="px-3 py-3 text-center text-emerald-700 dark:text-emerald-300" colSpan="3">Tổng</td><td className="px-3 py-3 text-center">{totals.total}</td><td className="px-3 py-3 text-center">{totals.finance}</td><td className="px-3 py-3 text-center">{totals.atgt}</td><td className="px-3 py-3 text-center">{totals.cldv}</td></tr></tfoot>
    </table>
  </div>;
}

function ViolationTable({ rows, emptyMessage = "Không có vi phạm trong các file đã chọn." }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-950/40">{emptyMessage}</div>;
  return <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700"><table className="w-full min-w-[1540px] border-collapse text-sm"><thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300"><tr><th className="px-3 py-3 text-center">STT</th><th className="px-3 py-3 text-left">Nhóm</th><th className="px-3 py-3 text-left">Chi nhánh</th><th className="px-3 py-3 text-left">Tuyến</th><th className="px-3 py-3 text-left">Số xe</th><th className="px-3 py-3 text-left">Họ và tên</th><th className="px-3 py-3 text-left">Nội dung vi phạm M03</th><th className="px-3 py-3 text-center">Kết quả</th><th className="px-3 py-3 text-left">Dữ liệu M02 đối chiếu</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(row => {
    const matched = row.matchedM02Data;
    return <tr key={`${row.sourceFile}-${row.sourceRow}-${row.stt}`} className="align-top hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"><td className="px-3 py-3 text-center text-slate-500">{row.stt}</td><td className="px-3 py-3 font-semibold text-emerald-700 dark:text-emerald-300">{row.categoryLabel}</td><td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.branch}</td><td className="max-w-xs px-3 py-3 text-slate-600 dark:text-slate-300">{row.route}</td><td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.vehicle}</td><td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.employeeName || "—"}</td><td className="max-w-md whitespace-pre-wrap px-3 py-3 text-slate-600 dark:text-slate-300">{row.violation}</td><td className="px-3 py-3 text-center">{row.matchedM02 ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"><CheckCircle2 size={13}/>Trùng khớp</span> : <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">Chưa thấy trong M02</span>}</td><td className="w-[390px] px-3 py-3">{matched ? <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs leading-5 text-slate-600 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-slate-300"><div className="flex flex-wrap gap-x-4 gap-y-1"><b className="text-emerald-700 dark:text-emerald-300">Ngày {formatDate(matched.date)}</b><span>Dòng M02: {matched.sourceRow}</span></div><p className="mt-1"><b>Lái xe:</b> {matched.driver || "—"} · <b>Tiếp viên:</b> {matched.assistant || "—"}</p><p className="mt-2 whitespace-pre-wrap break-words border-t border-emerald-100 pt-2 dark:border-emerald-900/60"><b>Ghi chú M02:</b> {matched.note || "—"}</p><p className="mt-2 truncate text-[10px] text-slate-400" title={matched.sourceFile}>{matched.sourceFile}</p></div> : <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-xs leading-5 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300"><p>Không tìm thấy dòng M02 có cùng chi nhánh, tuyến, số xe, nhân viên và nội dung ghi chú.</p><p className="mt-2 border-t border-amber-100 pt-2 dark:border-amber-900/60"><b>File Hậu kiểm:</b> <span className="break-all">{row.sourceFile || "—"}</span></p></div>}</td></tr>;
  })}</tbody></table></div>;
}

export default function HauKiemPage() {
  const [files, setFiles] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [employees, setEmployees] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [processed, setProcessed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingFiles, setAddingFiles] = useState(false);
  // Từ ngày/Đến ngày chỉ dùng để in tiêu đề báo cáo, không tham gia lọc hay đối chiếu dữ liệu.
  const valid = files.length > 0 && startDate && endDate && employees.trim();
  const hasData = results.detailRows.length > 0 || results.violations.length > 0;
  const reportViolations = results.violations.filter(item => item.category !== "other");
  const otherViolations = results.violations.filter(item => item.category === "other");

  const resetResults = () => { setResults(EMPTY_RESULTS); setProcessed(false); };
  const chooseFiles = async event => {
    const selected = [...(event.target.files || [])];
    event.target.value = "";
    if (!selected.length) return;
    const invalid = selected.filter(file => !file.name.toLowerCase().endsWith(".xlsx"));
    if (invalid.length) toast.error(`Chỉ chấp nhận file .xlsx: ${invalid.map(file => file.name).join(", ")}`);
    setAddingFiles(true);
    try {
      const candidates = selected.filter(file => file.name.toLowerCase().endsWith(".xlsx"));
      const known = new Set(files.map(item => item.fingerprint));
      const added = [];
      const duplicates = [];
      for (const file of candidates) {
        const fingerprint = await fingerprintHauKiemFile(file).catch(() => `${file.name.toLowerCase()}-${file.size}-${file.lastModified}`);
        if (known.has(fingerprint)) duplicates.push(file.name);
        else {
          known.add(fingerprint);
          added.push({ file, fingerprint });
        }
      }
      const available = Math.max(0, 7 - files.length);
      const accepted = added.slice(0, available);
      if (duplicates.length) toast.warning(`Đã bỏ qua file nhập trùng: ${duplicates.join(", ")}`);
      if (added.length > available) toast.warning(`Chỉ nhận tối đa 7 file; đã bỏ qua ${added.length - available} file vượt giới hạn`);
      if (accepted.length) {
        setFiles(current => [...current, ...accepted]);
        resetResults();
        toast.success(`Đã thêm ${accepted.length} file Hậu kiểm`);
      }
    } finally { setAddingFiles(false); }
  };

  const removeFile = fingerprint => {
    setFiles(current => current.filter(item => item.fingerprint !== fingerprint));
    resetResults();
  };

  const search = async () => {
    if (!valid) return toast.warning("Vui lòng chọn ít nhất 1 file, khoảng ngày hợp lệ và nhập tên nhân viên");
    setLoading(true);
    resetResults();
    try {
      const data = await processHauKiemFiles(files.map(item => item.file));
      setResults(data);
      setProcessed(true);
      if (data.detailRows.length || data.violations.length) {
        toast.success(`Hoàn tất! ${data.detailRows.length} lượt hậu kiểm, ${data.violations.length} ghi nhận vi phạm`);
        if (data.unmatchedCount) toast.info(`${data.unmatchedCount} vi phạm có trong M03 nhưng chưa tìm thấy ghi chú trùng khớp ở M02; hệ thống vẫn ghi nhận`);
      } else toast.info("Các file hợp lệ nhưng không có dữ liệu Hậu kiểm");
    } catch (error) {
      setResults(EMPTY_RESULTS);
      setProcessed(false);
      toast.error(error.message || "Không thể đọc file Hậu kiểm");
    } finally { setLoading(false); }
  };

  const download = async () => {
    setLoading(true);
    try {
      await exportHauKiemReport({ results, startDate, endDate, employees });
      toast.success("Báo cáo Hậu kiểm đã được tạo theo đúng biểu mẫu");
    } catch (error) { toast.error(error.message || "Không thể xuất báo cáo Hậu kiểm"); }
    finally { setLoading(false); }
  };

  const saveForm = { startDate, endDate, employees, results };
  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="mx-auto mb-10 max-w-3xl text-center"><span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold tracking-[.16em] text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">BÁO CÁO TUẦN</span><h1 className="mt-4 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Tổng hợp báo cáo Hậu kiểm</h1><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">Gộp từ 1 đến 7 file Hậu kiểm, đối chiếu M02/M03 và xuất báo cáo tuần theo mẫu CITYBUS.</p></div>
    <div className="grid items-start gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <ManagedGuideVideo reportKey="hau-kiem" description="Cách chuẩn bị file và xuất báo cáo Hậu kiểm"/>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5 dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><FileSpreadsheet size={20}/></span><div><h2 className="font-bold text-ink dark:text-white">Dữ liệu báo cáo Hậu kiểm</h2><p className="mt-1 text-xs text-slate-500">Chọn từ 1 đến 7 file, mỗi file phải có sheet M02 và M03</p></div></div>
        <div className="mt-6"><label className="field-label"><UploadCloud size={17}/> File Hậu kiểm ({files.length}/7)</label><label className="report-file-dropzone report-file-emerald flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition dark:border-slate-700 dark:bg-slate-950/50"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">{addingFiles ? <LoaderCircle className="animate-spin" size={22}/> : <UploadCloud size={22}/>}</span><span className="min-w-0 flex-1"><b className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{files.length ? "Thêm file Hậu kiểm khác" : "Chọn các file Hậu kiểm"}</b><small className="mt-1 block text-xs text-slate-400">Có thể chọn nhiều file cùng lúc; file trùng sẽ tự động bị bỏ qua</small></span><input className="sr-only" type="file" accept=".xlsx" multiple disabled={addingFiles || files.length >= 7} onChange={chooseFiles}/></label>
          {files.length > 0 && <div className="mt-3 space-y-2">{files.map((item, index) => <div key={item.fingerprint} className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 dark:border-emerald-900/60 dark:bg-emerald-950/25"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">{index + 1}</span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{item.file.name}</span><button type="button" onClick={() => removeFile(item.fingerprint)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-rose-600 dark:hover:bg-slate-800" title="Bỏ file"><X size={16}/></button></div>)}</div>}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="field-label"><CalendarDays size={17}/>Từ ngày</span><input className="field-input report-input report-input-emerald" type="date" value={startDate} onChange={event => setStartDate(event.target.value)}/></label><label><span className="field-label"><CalendarDays size={17}/>Đến ngày</span><input className="field-input report-input report-input-emerald" type="date" value={endDate} onChange={event => setEndDate(event.target.value)}/></label></div>
        <p className="mt-2 text-xs leading-5 text-emerald-700 dark:text-emerald-300">Khoảng ngày này dùng để ghi tiêu đề tuần báo cáo; hệ thống vẫn tổng hợp toàn bộ dữ liệu trong các file đã nhập.</p>
        <label className="mt-5 block"><span className="field-label"><UserRound size={17}/>Tên nhân viên QLCL-DV</span><input className="field-input report-input report-input-emerald" value={employees} onChange={event => setEmployees(event.target.value)} placeholder="Ví dụ: Nguyễn Hữu Duy Kha"/></label>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><button className="primary-button !bg-emerald-700 !shadow-emerald-200 hover:!bg-emerald-800 dark:!shadow-none" disabled={!valid || loading || addingFiles} onClick={search}>{loading ? <LoaderCircle className="animate-spin" size={18}/> : <Search size={18}/>} {loading ? "Đang xử lý..." : "Search"}</button><button className="secondary-button" disabled={!hasData || loading} onClick={download}><Download size={18}/>Tải báo cáo</button><SaveReportButton type="haukiem" title="báo cáo Hậu kiểm" form={saveForm} disabled={!hasData || loading} className="sm:col-span-2"/></div>
      </div>
    </div>

    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><ShieldCheck size={20}/></span><div><h2 className="text-lg font-bold text-ink dark:text-white">Kết quả tổng hợp Hậu kiểm</h2><p className="mt-1 text-xs leading-5 text-slate-500">M03 có dữ liệu nhưng không trùng ghi chú M02 vẫn được ghi nhận. Mục IV được hiển thị riêng trên web để kiểm tra và không được đưa vào file Excel báo cáo.</p></div></div>{hasData && <button className="secondary-button !h-10 shrink-0" onClick={download} disabled={loading}><Download size={17}/>Tải Excel</button>}</div>
      {loading && !processed ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-950/50"><LoaderCircle className="animate-spin text-emerald-700" size={34}/><span className="mt-4 text-sm font-semibold">Đang đọc và đối chiếu M02/M03...</span></div> : !hasData ? <NoData searched={processed}/> : <div className="space-y-8"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50"><span className="text-xs font-semibold text-slate-400">FILE ĐÃ NHẬP</span><b className="mt-2 block text-2xl text-slate-800 dark:text-white">{results.fileSummaries.length}</b></div><div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30"><span className="text-xs font-semibold text-emerald-600">LƯỢT HẬU KIỂM</span><b className="mt-2 block text-2xl text-emerald-800 dark:text-emerald-300">{results.detailRows.length}</b></div><div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-950/30"><span className="text-xs font-semibold text-rose-600">GHI NHẬN VI PHẠM</span><b className="mt-2 block text-2xl text-rose-700 dark:text-rose-300">{results.violations.length}</b></div><div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30"><span className="text-xs font-semibold text-amber-600">M03 CHƯA KHỚP M02</span><b className="mt-2 block text-2xl text-amber-700 dark:text-amber-300">{results.unmatchedCount}</b></div></div>
        <section><h3 className="mb-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">1. Các file đã xử lý</h3><div className="grid gap-3 sm:grid-cols-2">{results.fileSummaries.map(item => <div key={item.fileName} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 shrink-0 text-emerald-600" size={19}/><div className="min-w-0"><b className="block truncate text-sm text-slate-700 dark:text-slate-200">{item.fileName}</b><span className="mt-1 block text-xs text-slate-400">{item.detailCount} lượt · {item.violationCount} vi phạm · {item.dates.length ? item.dates.map(formatDate).join(", ") : "không tìm thấy ngày trong file"}</span></div></div></div>)}</div></section>
        <section><h3 className="mb-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">2. BCTH.HKVP — Tổng hợp theo Chi nhánh/Tuyến</h3>{results.summary.length ? <SummaryTable rows={results.summary}/> : <NoData searched/>}</section>
        <section><h3 className="mb-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">3. Đối chiếu vi phạm M03 với ghi chú M02</h3><ViolationTable rows={reportViolations} emptyMessage="Không có vi phạm thuộc nhóm I, II hoặc III trong các file đã chọn."/></section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">4. IV. VI PHẠM KHÁC</h3><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-sm dark:bg-slate-900 dark:text-amber-300">CHỈ HIỂN THỊ WEB · KHÔNG XUẤT EXCEL</span></div><ViolationTable rows={otherViolations} emptyMessage="Không có dữ liệu tại mục IV. VI PHẠM KHÁC."/></section>
      </div>}
    </div>
  </section>;
}
