import { useEffect, useMemo, useState } from "react";
import { Clock3, Database, Download, Eye, FileClock, LoaderCircle, Search, Trash2, UserRound, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import NoData from "../components/NoData";
import Pagination, { pageItems } from "../components/Pagination";
import { canDeleteSavedReport, deleteSavedReport, getVisibleSavedReports } from "../services/savedReportService";
import { formatDateTimeVi } from "../utils/blog";
import { exportSavedReport } from "../utils/exportSavedReport";

const roleNames = { user: "User", admin: "Admin", superadmin: "SuperAdmin" };
const cellClass = "px-3 py-3 text-slate-600 dark:text-slate-300";
const headClass = "px-3 py-3 text-left font-semibold";

function CameraGpsDetail({ report }) {
  const groups = report.data || [];
  return <div className="space-y-6">{groups.map(group => <section key={group.key}>
    <h3 className="mb-3 text-sm font-bold text-brand-600 dark:text-orange-300">{group.title}</h3>
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full min-w-[650px] text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/70 dark:text-slate-300"><tr><th className="px-4 py-3 text-left">Chi nhánh</th><th className="px-4 py-3 text-center">Tổng</th><th className="px-4 py-3 text-center">{report.type === "camera" ? "Đã sửa" : "Đã xử lý"}</th><th className="px-4 py-3 text-center">{report.type === "camera" ? "Chưa sửa" : "Chưa xử lý"}</th>{report.type === "camera" && <th className="px-4 py-3 text-center">Đã kiểm tra</th>}</tr></thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{(group.rows || []).map((row, index) => <tr key={`${group.key}-${row.branch}-${index}`}><td className="px-4 py-3 font-semibold dark:text-slate-200">{row.branch}</td><td className="px-4 py-3 text-center dark:text-slate-300">{row.total}</td><td className="px-4 py-3 text-center text-emerald-600">{report.type === "camera" ? row.fixed : row.processed}</td><td className="px-4 py-3 text-center text-rose-600">{report.type === "camera" ? row.unfixed : row.unprocessed}</td>{report.type === "camera" && <td className="px-4 py-3 text-center text-blue-600">{row.checked}</td>}</tr>)}</tbody>
      </table>
    </div>
  </section>)}</div>;
}

const speedTotals = rows => rows.reduce((sum, row) => ({
  violations: sum.violations + (Number(row.violationCount) || 0),
  noAnswers: sum.noAnswers + (Number(row.noAnswerCount) || 0),
}), { violations: 0, noAnswers: 0 });

function SpeedRows({ rows }) {
  const totals = speedTotals(rows);
  return <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
    <table className="w-full min-w-[1180px] border-collapse text-sm">
      <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300"><tr><th className="px-3 py-3 text-center font-semibold">STT</th><th className={headClass}>Đối tác</th><th className={headClass}>Chi nhánh</th><th className={headClass}>Tuyến (Theo hướng)</th><th className={headClass}>BKS</th><th className={headClass}>Tên nhân viên</th><th className="px-3 py-3 text-center font-semibold">Số lần vi phạm</th><th className={headClass}>Nhân viên không nghe máy</th><th className="px-3 py-3 text-center font-semibold">Số lần không nghe máy</th></tr></thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row, index) => <tr key={`${row.vehicle}-${row.employeeName}-${index}`} className="hover:bg-violet-50/40 dark:hover:bg-violet-950/20"><td className="px-3 py-3 text-center text-slate-500">{row.stt || index + 1}</td><td className={cellClass}>{row.partner || "—"}</td><td className={cellClass}>{row.branch || "—"}</td><td className={cellClass}>{row.route || "—"}</td><td className="px-3 py-3 font-semibold tracking-wide text-slate-700 dark:text-slate-200">{row.vehicle || "—"}</td><td className={cellClass}>{row.employeeName || "—"}</td><td className="px-3 py-3 text-center font-semibold text-violet-600 dark:text-violet-300">{Number(row.violationCount) || 0}</td><td className={cellClass}>{row.noAnswerEmployee || "—"}</td><td className="px-3 py-3 text-center font-semibold text-rose-600 dark:text-rose-300">{Number(row.noAnswerCount) || 0}</td></tr>)}</tbody>
      <tfoot><tr className="border-t border-violet-100 bg-violet-50 font-bold dark:border-violet-900 dark:bg-violet-950/30"><td className="px-3 py-3 text-center text-violet-700 dark:text-violet-300" colSpan="6">Tổng</td><td className="px-3 py-3 text-center text-violet-700 dark:text-violet-300">{totals.violations}</td><td/><td className="px-3 py-3 text-center text-rose-600 dark:text-rose-300">{totals.noAnswers}</td></tr></tfoot>
    </table>
  </div>;
}

function Speed4hDetail({ report }) {
  const sections = [
    { title: "1. Công việc gọi tốc độ", rows: report.data?.speed || [] },
    { title: "2. Công việc gọi 4H", rows: report.data?.fourHour || [] },
  ];
  return <div className="space-y-8">{sections.map(section => <section key={section.title}><h3 className="mb-3 text-sm font-bold text-violet-600 dark:text-violet-300">{section.title}</h3>{section.rows.length ? <SpeedRows rows={section.rows}/> : <div className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-sm text-slate-400 dark:border-slate-700">Không có dữ liệu</div>}</section>)}</div>;
}

const gsttTotals = rows => rows.reduce((sum, row) => ({
  fixed: sum.fixed + (Number(row.fixed) || 0),
  pending: sum.pending + (Number(row.pending) || 0),
  checked: sum.checked + (Number(row.checked) || 0),
  unrecoverable: sum.unrecoverable + (Number(row.unrecoverable) || 0),
}), { fixed: 0, pending: 0, checked: 0, unrecoverable: 0 });

function GsttDetail({ report }) {
  const rows = Array.isArray(report.data) ? report.data : [];
  const totals = gsttTotals(rows);
  return <section>
    <h3 className="mb-3 text-sm font-bold text-cyan-700 dark:text-cyan-300">Hỗ trợ GSTT</h3>
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full min-w-[1180px] border-collapse text-sm">
        <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300"><tr><th className="px-3 py-3 text-center font-semibold">STT</th><th className={headClass}>Chi nhánh</th><th className={headClass}>Biển kiểm soát</th><th className={headClass}>Tuyến</th><th className="px-3 py-3 text-center font-semibold">Đã sửa</th><th className="px-3 py-3 text-center font-semibold">Chưa sửa</th><th className="px-3 py-3 text-center font-semibold">Đã kiểm tra</th><th className="px-3 py-3 text-center font-semibold">Không thể khắc phục</th><th className={headClass}>Lý do Không thể khắc phục</th></tr></thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row, index) => <tr key={`${row.vehicle}-${index}`} className="hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20"><td className="px-3 py-3 text-center text-slate-500">{row.stt || index + 1}</td><td className={cellClass}>{row.branch || "HCM"}</td><td className="px-3 py-3 font-semibold tracking-wide text-slate-700 dark:text-slate-200">{row.vehicle || "—"}</td><td className={cellClass}>{row.route || "—"}</td><td className="px-3 py-3 text-center font-semibold text-emerald-600">{Number(row.fixed) || 0}</td><td className="px-3 py-3 text-center font-semibold text-rose-600">{Number(row.pending) || 0}</td><td className="px-3 py-3 text-center font-semibold text-blue-600">{Number(row.checked) || 0}</td><td className="px-3 py-3 text-center font-semibold text-amber-600">{Number(row.unrecoverable) || 0}</td><td className="max-w-md whitespace-normal px-3 py-3 text-slate-600 dark:text-slate-300">{row.reason || "—"}</td></tr>)}</tbody>
        <tfoot><tr className="border-t border-cyan-100 bg-cyan-50 font-bold dark:border-cyan-900 dark:bg-cyan-950/30"><td className="px-3 py-3 text-center text-cyan-800 dark:text-cyan-300" colSpan="4">Tổng</td><td className="px-3 py-3 text-center text-emerald-700">{totals.fixed}</td><td className="px-3 py-3 text-center text-rose-700">{totals.pending}</td><td className="px-3 py-3 text-center text-blue-700">{totals.checked}</td><td className="px-3 py-3 text-center text-amber-700">{totals.unrecoverable}</td><td/></tr></tfoot>
      </table>
    </div>
  </section>;
}

function DetailRows({ report }) {
  if (report.type === "camera" || report.type === "gps") return <CameraGpsDetail report={report}/>;
  if (report.type === "speed4h") return <Speed4hDetail report={report}/>;
  if (report.type === "gstt") return <GsttDetail report={report}/>;
  return <NoData searched title="Không đọc được dữ liệu" description="Loại báo cáo này chưa được hỗ trợ."/>;
}

function ReportDetail({ report, exporting, onClose, onExport }) {
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[94vh] w-full max-w-7xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl"><div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="truncate font-bold text-ink dark:text-white">{report.title}</h2><p className="mt-1 text-xs text-slate-400">Lưu bởi {report.ownerName} · {formatDateTimeVi(report.createdAt)}</p></div><div className="flex items-center gap-2"><button type="button" className="secondary-button !h-10" disabled={exporting} onClick={() => onExport(report)}>{exporting ? <LoaderCircle className="animate-spin" size={17}/> : <Download size={17}/>}Tải Excel</button><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20}/></button></div></div><div className="p-5 sm:p-7"><DetailRows report={report}/></div></div></div>;
}

export default function SavedReportsPage() {
  const auth = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [exportingId, setExportingId] = useState("");

  const load = async () => {
    setLoading(true);
    try { setReports(await getVisibleSavedReports(auth)); }
    catch (error) { toast.error(error.message || "Không thể tải báo cáo đã lưu"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [auth.role, auth.user?.uid]);
  const owners = useMemo(() => {
    const unique = new Map();
    reports.forEach(report => {
      const id = report.ownerId || report.ownerUsername;
      if (id && !unique.has(id)) unique.set(id, { id, name: report.ownerName || report.ownerUsername, username: report.ownerUsername });
    });
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [reports]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return reports.filter(item => {
      const ownerId = item.ownerId || item.ownerUsername;
      const matchesOwner = !ownerFilter || ownerId === ownerFilter;
      const matchesKeyword = !keyword || `${item.title} ${item.ownerName} ${item.ownerUsername} ${item.typeLabel}`.toLocaleLowerCase("vi").includes(keyword);
      return matchesOwner && matchesKeyword;
    });
  }, [ownerFilter, query, reports]);
  useEffect(() => setPage(1), [ownerFilter, query]);
  const paged = pageItems(filtered, page, 10);
  useEffect(() => { if (page !== paged.safePage) setPage(paged.safePage); }, [page, paged.safePage]);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteSavedReport(target.id);
      setReports(current => current.filter(item => item.id !== target.id));
      setTarget(null);
      toast.success("Đã xóa báo cáo đã lưu");
    } catch (error) {
      toast.error(error.message || "Không thể xóa báo cáo");
    } finally {
      setDeleting(false);
    }
  };

  const download = async report => {
    setExportingId(report.id);
    try {
      await exportSavedReport(report);
      toast.success("Đã tạo file Excel theo đúng biểu mẫu báo cáo chính");
    } catch (error) {
      toast.error(error.message || "Không thể xuất báo cáo đã lưu");
    } finally {
      setExportingId("");
    }
  };

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-amber-600 dark:text-amber-300"><FileClock size={16}/>Kho dữ liệu cá nhân</span>
    <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Báo cáo đã lưu</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{auth.role === "user" ? "Bạn chỉ nhìn thấy những báo cáo do chính mình lưu." : auth.role === "admin" ? "Admin nhìn thấy báo cáo của Admin và User, không nhìn thấy dữ liệu SuperAdmin." : "SuperAdmin nhìn thấy báo cáo của toàn hệ thống."}</p>
    <div className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5 lg:flex-row lg:items-end lg:justify-between"><div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_280px] lg:max-w-3xl"><label className="block"><span className="field-label">Tìm báo cáo</span><span className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="field-input !pl-11" value={query} onChange={event => setQuery(event.target.value)} placeholder="Loại báo cáo hoặc người lưu..."/></span></label><label className="block"><span className="field-label"><UserRound size={16}/>Người lưu</span><select className="field-input" value={ownerFilter} onChange={event => setOwnerFilter(event.target.value)}><option value="">Tất cả người lưu</option>{owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}{owner.username ? ` (@${owner.username})` : ""}</option>)}</select></label></div><span className="pb-1 text-xs font-semibold text-slate-400">{filtered.length} báo cáo · 10 báo cáo/trang</span></div>
      {loading ? <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="animate-spin text-brand-500" size={34}/></div> : paged.items.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{paged.items.map(report => <article key={report.id} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"><Database size={21}/></span><div className="min-w-0"><h2 className="truncate font-bold text-slate-800 dark:text-white">{report.title}</h2><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5"><Clock3 size={13}/>{formatDateTimeVi(report.createdAt)}</span><span className="inline-flex items-center gap-1.5"><UserRound size={13}/>{report.ownerName} · {roleNames[report.ownerRole]}</span><span>{report.rowCount || 0} dòng kết quả</span></div></div></div><div className="flex flex-wrap gap-2"><button type="button" className="secondary-button !h-10 shrink-0" onClick={() => setDetail(report)}><Eye size={16}/>Xem</button><button type="button" className="secondary-button !h-10 shrink-0 !text-emerald-600" disabled={exportingId === report.id} onClick={() => download(report)}>{exportingId === report.id ? <LoaderCircle className="animate-spin" size={16}/> : <Download size={16}/>}Tải Excel</button>{canDeleteSavedReport(report, auth) && <button type="button" className="secondary-button !h-10 shrink-0 !text-rose-600" onClick={() => setTarget(report)}><Trash2 size={16}/>Xóa</button>}</div></article>)}</div> : <div className="p-5"><NoData searched title="Chưa có báo cáo đã lưu" description="Sau khi xử lý dữ liệu tại một Box báo cáo, nhấn “Lưu báo cáo” để xem lại tại đây."/></div>}
      <Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/>
    </div>
    {target && <ConfirmDialog danger title="Xóa báo cáo đã lưu?" description={`“${target.title}” sẽ bị xóa vĩnh viễn khỏi Firebase.`} confirmLabel="Xóa báo cáo" busy={deleting} onClose={() => setTarget(null)} onConfirm={remove}/>}
    {detail && <ReportDetail report={detail} exporting={exportingId === detail.id} onClose={() => setDetail(null)} onExport={download}/>}
  </section>;
}
