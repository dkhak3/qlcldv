import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  CircleCheckBig,
  Download,
  ExternalLink,
  FileSearch,
  FileSpreadsheet,
  FileWarning,
  FilterX,
  LoaderCircle,
  Search,
  ShieldCheck,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import ManagedGuideVideo from "../components/ManagedGuideVideo";
import ExcelSchemaStatus from "../components/ExcelSchemaStatus";
import ReportWorkflowStatus from "../components/ReportWorkflowStatus";
import SaveReportButton from "../components/SaveReportButton";
import NoData from "../components/NoData";
import Pagination, { pageItems } from "../components/Pagination";
import { getReportBoxByKey } from "../services/reportBoxService";
import {
  clearTxdlResults,
  setTxdlEmployees,
  setTxdlEndDate,
  setTxdlFile,
  setTxdlResults,
  setTxdlStartDate,
} from "../store";
import { processTxdlFile } from "../utils/txdlProcessor";
import { exportTxdlReport } from "../utils/exportTxdlReport";
import { exportTxdlLookupExcel, exportTxdlRemovedExcel } from "../utils/exportTxdlTables";

const DEFAULT_TXDL_URL = "https://txdl-project.vercel.app/";

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    rose: "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
    amber: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    blue: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
  };
  return <div className={`rounded-2xl border px-4 py-4 ${tones[tone] || tones.slate}`}>
    <strong className="block text-2xl font-bold">{value}</strong>
    <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[.08em] opacity-75">{label}</span>
  </div>;
}

function ResultHeader({ title, description, count, onDownload, disabled }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 className="font-bold text-ink dark:text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description} · {count} bản ghi</p>
    </div>
    <button type="button" className="secondary-button !h-10 shrink-0" disabled={disabled || count === 0} onClick={onDownload}><Download size={17}/>Tải Excel</button>
  </div>;
}

function LookupTable({ rows }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
    <table className="w-full min-w-[1250px] border-collapse text-sm">
      <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300">
        <tr>
          <th className="px-3 py-3 text-center font-semibold">STT JOB</th>
          <th className="px-3 py-3 text-center font-semibold">Ngày tiếp nhận DVKH</th>
          <th className="px-3 py-3 text-left font-semibold">Tên nhân viên DVKH</th>
          <th className="px-3 py-3 text-center font-semibold">Ngày phản hồi QLCL-DV</th>
          <th className="px-3 py-3 text-left font-semibold">Tên nhân viên QLCL-DV</th>
          <th className="px-3 py-3 text-left font-semibold">Nội dung phản ánh</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((row, index) => <tr key={`${row.jobStt}-${index}`} className="transition hover:bg-blue-50/40 dark:hover:bg-blue-950/20">
          <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-slate-200">{row.jobStt}</td>
          <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-300">{row.receivedDate || "—"}</td>
          <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.dvkhEmployee || "—"}</td>
          <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-300">{row.responseDate || "—"}</td>
          <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.qlclEmployee || "—"}</td>
          <td className="max-w-2xl whitespace-pre-wrap px-3 py-3 leading-6 text-slate-600 dark:text-slate-300">{row.content || "—"}</td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}

function MatchedTable({ rows }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
    <table className="w-full min-w-[1220px] border-collapse text-sm">
      <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300">
        <tr>
          <th className="px-3 py-3 text-center font-semibold">STT</th>
          <th className="px-3 py-3 text-left font-semibold">Chi nhánh</th>
          <th className="px-3 py-3 text-left font-semibold">Tuyến</th>
          <th className="px-3 py-3 text-left font-semibold">Biển kiểm soát</th>
          <th className="px-3 py-3 text-left font-semibold">Diễn giải chi tiết nội dung</th>
          <th className="px-3 py-3 text-left font-semibold">Nhân viên bị phản ánh</th>
          <th className="px-3 py-3 text-center font-semibold">Không vi phạm</th>
          <th className="px-3 py-3 text-center font-semibold">Vi phạm</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map(row => <tr key={`${row.jobStt}-${row.stt}`} className="transition hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20">
          <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">{row.stt}</td>
          <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.branch || "—"}</td>
          <td className="max-w-xs px-3 py-3 text-slate-600 dark:text-slate-300">{row.route || "—"}</td>
          <td className="px-3 py-3 font-semibold tracking-wide text-slate-700 dark:text-slate-200">{row.vehicle || "—"}</td>
          <td className="max-w-lg whitespace-normal px-3 py-3 leading-6 text-slate-600 dark:text-slate-300">{row.content || "—"}</td>
          <td className="max-w-xs px-3 py-3 text-slate-600 dark:text-slate-300">{row.employeeName || "—"}</td>
          {row.supportCustomer
            ? <td className="px-3 py-3 text-center font-bold text-rose-600 dark:text-rose-300" colSpan="2">HỖ TRỢ KHÁCH HÀNG</td>
            : <><td className="px-3 py-3 text-center font-bold text-emerald-600 dark:text-emerald-300">{row.noViolation || ""}</td><td className="px-3 py-3 text-center font-bold text-rose-600 dark:text-rose-300">{row.violation || ""}</td></>}
        </tr>)}
      </tbody>
    </table>
  </div>;
}

function RemovedTable({ rows }) {
  return <div className="overflow-x-auto rounded-xl border border-rose-200 dark:border-rose-900/60">
    <table className="w-full min-w-[1100px] border-collapse text-sm">
      <thead className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
        <tr>
          <th className="px-3 py-3 text-left font-semibold">STT JOB</th>
          <th className="px-3 py-3 text-left font-semibold">Ngày tiếp nhận</th>
          <th className="px-3 py-3 text-left font-semibold">Ngày phản hồi</th>
          <th className="px-3 py-3 text-left font-semibold">Nhân viên DVKH</th>
          <th className="px-3 py-3 text-left font-semibold">Nhân viên QLCL-DV</th>
          <th className="px-3 py-3 text-left font-semibold">Nội dung tiếp nhận</th>
          <th className="px-3 py-3 text-left font-semibold">Lý do loại</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40">
        {rows.map((row, index) => <tr key={`${row.jobStt}-${index}`} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20">
          <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-200">{row.jobStt}</td>
          <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.receivedDate || "—"}</td>
          <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.responseDate || "—"}</td>
          <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.dvkhEmployee || "—"}</td>
          <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.qlclEmployee || "—"}</td>
          <td className="max-w-lg whitespace-normal px-3 py-3 leading-6 text-slate-600 dark:text-slate-300">{row.content || "—"}</td>
          <td className="max-w-sm whitespace-normal px-3 py-3 font-semibold text-rose-600 dark:text-rose-300">{row.reason}</td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}

export default function TxdlPage() {
  const dispatch = useDispatch();
  const form = useSelector(state => state.txdl);
  const [loading, setLoading] = useState(false);
  const [externalUrl, setExternalUrl] = useState(DEFAULT_TXDL_URL);
  const [view, setView] = useState("lookup");
  const [lookupPage, setLookupPage] = useState(1);
  const [matchedPage, setMatchedPage] = useState(1);
  const [removedPage, setRemovedPage] = useState(1);

  useEffect(() => {
    getReportBoxByKey("txdl").then(box => {
      if (box?.externalUrl) setExternalUrl(box.externalUrl);
    }).catch(() => {});
  }, []);

  const lookupRows = form.results.lookupRows || [];
  const matchedRows = form.results.rows || [];
  const removedRows = form.results.removedRows || [];
  const hasData = matchedRows.length > 0;
  const hasProcessed = form.processed;
  const valid = form.file && form.startDate && form.endDate && form.employees.trim() && form.startDate <= form.endDate;
  const lookup = pageItems(lookupRows, lookupPage, 20);
  const matched = pageItems(matchedRows, matchedPage, 20);
  const removed = pageItems(removedRows, removedPage, 20);

  const chooseFile = event => {
    const selected = event.target.files?.[0] || null;
    if (selected && !selected.name.toLowerCase().endsWith(".xlsx")) {
      event.target.value = "";
      dispatch(setTxdlFile(null));
      toast.error("File TXDL: chỉ chấp nhận định dạng .xlsx");
      return;
    }
    dispatch(setTxdlFile(selected));
    setLookupPage(1);
    setMatchedPage(1);
    setRemovedPage(1);
  };

  const search = async () => {
    if (!valid) return toast.warning("Vui lòng nhập file, khoảng ngày và tên nhân viên");
    dispatch(clearTxdlResults());
    setLoading(true);
    try {
      const results = await processTxdlFile(form.file, form.startDate, form.endDate);
      dispatch(setTxdlResults(results));
      setLookupPage(1);
      setMatchedPage(1);
      setRemovedPage(1);
      setView("lookup");
      toast.success(`Hoàn tất! Tra cứu ${results.totalAfterFilter} phản ánh · ghép ${results.totalMatched} · loại ${results.totalRemoved}`);
    } catch (error) {
      dispatch(clearTxdlResults());
      toast.error(error.message || "Không thể xử lý file TXDL");
    } finally {
      setLoading(false);
    }
  };

  const runDownload = async (action, successMessage) => {
    setLoading(true);
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message || "Không thể tải file Excel");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => runDownload(() => exportTxdlReport(form), "Đã tạo báo cáo chính TXDL theo biểu mẫu");
  const downloadLookup = () => runDownload(() => exportTxdlLookupExcel(form.results), "Đã tải Excel kết quả tra cứu");
  const downloadRemoved = () => runDownload(() => exportTxdlRemovedExcel(form.results), "Đã tải Excel phản ánh bị loại");

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold tracking-[.16em] text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">BÁO CÁO TUẦN</span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Tổng hợp báo cáo TXDL</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">Tra cứu phản ánh theo ngày phản hồi, đối chiếu 2 sheet theo STT và xuất từng nhóm dữ liệu ngay trong QLCL-DV.</p>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <ManagedGuideVideo reportKey="txdl" description="Cách chuẩn bị file và xuất báo cáo TXDL"/>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"><FileSpreadsheet size={20}/></span>
          <div><h2 className="font-bold text-ink dark:text-white">Dữ liệu báo cáo TXDL</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">File nguồn cần tối thiểu 2 sheet; hệ thống tự nhận diện hàng tiêu đề.</p></div>
        </div>

        <div className="mt-6">
          <label className="field-label"><UploadCloud size={17}/> File dữ liệu TXDL</label>
          <label className="report-file-dropzone report-file-emerald flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition dark:border-slate-700 dark:bg-slate-950/50">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-300"><UploadCloud size={22}/></span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{form.file ? form.file.name : "Chọn file TXDL"}</b><small className="mt-1 block text-xs text-slate-400">Sheet 1: phản ánh · Sheet 2: kết quả xác định vi phạm</small></span>
            {form.file && <CircleCheckBig className="shrink-0 text-emerald-500" size={21}/>}
            <input className="sr-only" type="file" accept=".xlsx" onChange={chooseFile}/>
          </label>
          <ExcelSchemaStatus file={form.file} schemaKey="txdl"/>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label><span className="field-label"><CalendarDays size={17}/> Từ ngày</span><input className="field-input report-input report-input-emerald" type="date" value={form.startDate} onChange={event => dispatch(setTxdlStartDate(event.target.value))}/></label>
          <label><span className="field-label"><CalendarDays size={17}/> Đến ngày</span><input className="field-input report-input report-input-emerald" type="date" min={form.startDate} value={form.endDate} onChange={event => dispatch(setTxdlEndDate(event.target.value))}/></label>
        </div>

        <label className="mt-5 block"><span className="field-label"><UserRound size={17}/> Tên nhân viên QLCL-DV</span><input className="field-input report-input report-input-emerald" type="text" placeholder="Ví dụ: Nguyễn Hữu Duy Kha" value={form.employees} onChange={event => dispatch(setTxdlEmployees(event.target.value))}/></label>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="primary-button !bg-emerald-600 !shadow-emerald-200 hover:!bg-emerald-700 dark:!bg-emerald-800 dark:!shadow-none dark:hover:!bg-emerald-700" disabled={!valid || loading} onClick={search}>{loading ? <LoaderCircle className="animate-spin" size={18}/> : <Search size={18}/>} {loading ? "Đang xử lý..." : "Search"}</button>
          <button className="secondary-button" disabled={!hasData || loading} onClick={downloadReport}><Download size={18}/>Tải báo cáo chính</button>
          <SaveReportButton type="txdl" title="báo cáo TXDL" form={form} disabled={!hasData || loading} className="sm:col-span-2"/>
        </div>

        <ReportWorkflowStatus files={[form.file]} startDate={form.startDate} endDate={form.endDate} employees={form.employees} hasData={hasProcessed} processing={loading}/>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-500"/>
          <span>Luồng mới chạy trực tiếp trong QLCL-DV. <a href={externalUrl} target="_blank" rel="noreferrer" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-300">Mở hệ thống TXDL cũ <ExternalLink className="inline" size={13}/></a> nếu cần đối chiếu.</span>
        </div>
      </div>
    </div>

    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-ink dark:text-white">Kết quả xử lý TXDL</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Kết quả tra cứu là Sheet 1 sau khi lọc NGÀY PHẢN HỒI; báo cáo chính là phần ghép thành công với Sheet 2 theo STT.</p>
      </div>

      {hasProcessed && <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Kết quả tra cứu" value={form.results.totalAfterFilter} tone="slate"/>
        <StatCard label="Không vi phạm" value={form.results.totalNoViolation} tone="emerald"/>
        <StatCard label="Vi phạm" value={form.results.totalViolation} tone="rose"/>
        <StatCard label="Hỗ trợ khách hàng" value={form.results.totalSupportCustomer} tone="blue"/>
        <StatCard label="Phản ánh bị loại" value={form.results.totalRemoved} tone="amber"/>
      </div>}

      {hasProcessed && <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
        <button type="button" onClick={() => setView("lookup")} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${view === "lookup" ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300"}`}><FileSearch size={16}/>Kết quả tra cứu ({lookupRows.length})</button>
        <button type="button" onClick={() => setView("matched")} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${view === "matched" ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"}`}><FileSpreadsheet size={16}/>Báo cáo chính ({form.results.totalMatched})</button>
        <button type="button" onClick={() => setView("removed")} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${view === "removed" ? "bg-rose-600 text-white" : "border border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-700 dark:border-slate-700 dark:text-slate-300"}`}><FilterX size={16}/>Phản ánh bị loại ({form.results.totalRemoved})</button>
      </div>}

      <div className="mt-5">
        {loading && !hasProcessed
          ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-950/50 dark:text-slate-400"><LoaderCircle className="animate-spin text-emerald-600" size={34}/><span className="mt-4 text-sm font-semibold">Đang đọc và đối chiếu 2 sheet...</span></div>
          : !hasProcessed
            ? <NoData searched={false} title="Chưa có kết quả TXDL" description="Chọn file, khoảng ngày và nhấn Search để bắt đầu xử lý."/>
            : view === "lookup"
              ? lookupRows.length
                ? <><ResultHeader title="Kết quả tra cứu" description="Dữ liệu Sheet 1 sau khi lọc theo khoảng ngày" count={lookupRows.length} disabled={loading} onDownload={downloadLookup}/><LookupTable rows={lookup.items}/><Pagination page={lookup.safePage} pageCount={lookup.pageCount} onChange={setLookupPage}/></>
                : <NoData searched title="Không có kết quả tra cứu" description="Không có phản ánh trong khoảng ngày đã chọn."/>
              : view === "matched"
                ? matchedRows.length
                  ? <><ResultHeader title="Báo cáo chính" description="Các phản ánh đã ghép được với Sheet 2" count={matchedRows.length} disabled={loading} onDownload={downloadReport}/><MatchedTable rows={matched.items}/><Pagination page={matched.safePage} pageCount={matched.pageCount} onChange={setMatchedPage}/></>
                  : <NoData searched title="Không có phản ánh ghép được" description="Không có STT phù hợp trong khoảng ngày đã chọn."/>
                : removedRows.length
                  ? <><ResultHeader title="Phản ánh bị loại" description="Có ở Sheet 1 nhưng không tìm thấy STT tương ứng trong Sheet 2" count={removedRows.length} disabled={loading} onDownload={downloadRemoved}/><div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"><FileWarning size={16} className="mt-0.5 shrink-0"/><span>Các dòng bên dưới không được đưa vào báo cáo chính. Nút Tải Excel sẽ xuất toàn bộ danh sách bị loại.</span></div><RemovedTable rows={removed.items}/><Pagination page={removed.safePage} pageCount={removed.pageCount} onChange={setRemovedPage}/></>
                  : <NoData searched title="Không có phản ánh bị loại" description="Tất cả STT sau lọc ngày đều tìm thấy dữ liệu đối chiếu ở Sheet 2."/>}
      </div>
    </div>
  </section>;
}
