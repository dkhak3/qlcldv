import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, CircleCheckBig, Download, FileSpreadsheet, Headphones, LoaderCircle, Search, UploadCloud, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import NoData from "../components/NoData";
import ManagedGuideVideo from "../components/ManagedGuideVideo";
import SaveReportButton from "../components/SaveReportButton";
import {
  clearGsttResults,
  setGsttEmployees,
  setGsttEndDate,
  setGsttFile,
  setGsttResults,
  setGsttStartDate,
} from "../store";
import { exportGsttReport } from "../utils/exportGsttReport";
import { processGsttFile } from "../utils/gsttProcessor";

const sumRows = rows => rows.reduce((sum, row) => ({
  fixed: sum.fixed + row.fixed,
  pending: sum.pending + row.pending,
  checked: sum.checked + row.checked,
  unrecoverable: sum.unrecoverable + row.unrecoverable,
}), { fixed: 0, pending: 0, checked: 0, unrecoverable: 0 });

function ResultTable({ rows }) {
  const totals = sumRows(rows);
  return <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full min-w-[1180px] border-collapse text-sm">
      <thead className="bg-slate-50 text-slate-600">
        <tr>
          <th className="px-3 py-3 text-center font-semibold">STT</th>
          <th className="px-3 py-3 text-left font-semibold">Chi nhánh</th>
          <th className="px-3 py-3 text-left font-semibold">Biển kiểm soát</th>
          <th className="px-3 py-3 text-left font-semibold">Tuyến</th>
          <th className="px-3 py-3 text-center font-semibold">Đã sửa</th>
          <th className="px-3 py-3 text-center font-semibold">Chưa sửa</th>
          <th className="px-3 py-3 text-center font-semibold">Đã kiểm tra</th>
          <th className="px-3 py-3 text-center font-semibold">Không thể khắc phục</th>
          <th className="px-3 py-3 text-left font-semibold">Lý do Không thể khắc phục</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map(row => <tr className="transition hover:bg-cyan-50/40" key={`${row.sourceSheet}-${row.sourceRow}`}>
          <td className="px-3 py-3 text-center text-slate-500">{row.stt}</td>
          <td className="px-3 py-3 font-semibold text-slate-700">{row.branch}</td>
          <td className="px-3 py-3 font-semibold tracking-wide text-slate-700">{row.vehicle}</td>
          <td className="max-w-sm px-3 py-3 text-slate-600">{row.route || "—"}</td>
          <td className="px-3 py-3 text-center font-semibold text-emerald-600">{row.fixed}</td>
          <td className="px-3 py-3 text-center font-semibold text-rose-600">{row.pending}</td>
          <td className="px-3 py-3 text-center font-semibold text-blue-600">{row.checked}</td>
          <td className="px-3 py-3 text-center font-semibold text-amber-600">{row.unrecoverable}</td>
          <td className="max-w-md px-3 py-3 text-slate-600">{row.reason || "—"}</td>
        </tr>)}
      </tbody>
      <tfoot><tr className="border-t border-cyan-100 bg-cyan-50 font-bold"><td className="px-3 py-3 text-center text-cyan-800" colSpan="4">Tổng</td><td className="px-3 py-3 text-center text-emerald-700">{totals.fixed}</td><td className="px-3 py-3 text-center text-rose-700">{totals.pending}</td><td className="px-3 py-3 text-center text-blue-700">{totals.checked}</td><td className="px-3 py-3 text-center text-amber-700">{totals.unrecoverable}</td><td/></tr></tfoot>
    </table>
  </div>;
}

export default function GsttPage() {
  const dispatch = useDispatch();
  const form = useSelector(state => state.gstt);
  const [loading, setLoading] = useState(false);
  const hasData = form.results.length > 0;
  const valid = form.file && form.startDate && form.endDate && form.employees.trim() && form.startDate <= form.endDate;

  const chooseFile = event => {
    const selected = event.target.files?.[0] || null;
    if (selected && !selected.name.toLowerCase().endsWith(".xlsx")) {
      event.target.value = "";
      dispatch(setGsttFile(null));
      toast.error("File Hỗ trợ GSTT: chỉ chấp nhận định dạng .xlsx");
      return;
    }
    dispatch(setGsttFile(selected));
  };

  const search = async () => {
    if (!valid) return toast.warning("Vui lòng nhập file, khoảng ngày và tên nhân viên");
    dispatch(clearGsttResults());
    setLoading(true);
    try {
      const results = await processGsttFile(form.file, form.startDate, form.endDate);
      dispatch(setGsttResults(results));
      if (results.length) toast.success(`Hoàn tất! Tìm thấy ${results.length} yêu cầu Hỗ trợ GSTT`);
      else toast.info("File hợp lệ nhưng không có dữ liệu trong khoảng ngày đã chọn");
    } catch (error) {
      dispatch(clearGsttResults());
      toast.error(error.message || "Không thể đọc file Hỗ trợ GSTT");
    } finally { setLoading(false); }
  };

  const download = async () => {
    setLoading(true);
    try {
      await exportGsttReport(form);
      toast.success("Báo cáo Hỗ trợ GSTT đã được tạo theo đúng biểu mẫu");
    } catch (error) { toast.error(error.message || "Không thể xuất báo cáo Hỗ trợ GSTT"); }
    finally { setLoading(false); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold tracking-[.16em] text-cyan-700">BÁO CÁO TUẦN</span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Tổng hợp báo cáo Hỗ trợ GSTT</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Tải file theo dõi, chọn tuần báo cáo và kiểm tra dữ liệu trước khi xuất Excel.</p>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <ManagedGuideVideo reportKey="gstt" description="Cách chuẩn bị file và xuất báo cáo Hỗ trợ GSTT"/>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><FileSpreadsheet size={20}/></span><div><h2 className="font-bold text-ink">Dữ liệu báo cáo Hỗ trợ GSTT</h2><p className="mt-1 text-xs text-slate-500">Tất cả trường bên dưới đều bắt buộc</p></div></div>
        <div className="mt-6">
          <label className="field-label"><UploadCloud size={17}/> QLCL - HỖ TRỢ GSTT (Buýt trợ giá HCM)</label>
          <label className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-cyan-500 hover:bg-cyan-50/50">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-cyan-600 shadow-sm"><UploadCloud size={22}/></span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm font-semibold text-slate-700">{form.file ? form.file.name : "Chọn file Hỗ trợ GSTT"}</b><small className="mt-1 block text-xs text-slate-400">Tự tìm sheet tháng theo khoảng ngày đã chọn</small></span>
            {form.file && <CircleCheckBig className="shrink-0 text-emerald-500" size={21}/>}<input className="sr-only" type="file" accept=".xlsx" onChange={chooseFile}/>
          </label>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label><span className="field-label"><CalendarDays size={17}/> Từ ngày</span><input className="field-input" type="date" value={form.startDate} onChange={event => dispatch(setGsttStartDate(event.target.value))}/></label>
          <label><span className="field-label"><CalendarDays size={17}/> Đến ngày</span><input className="field-input" type="date" min={form.startDate} value={form.endDate} onChange={event => dispatch(setGsttEndDate(event.target.value))}/></label>
        </div>
        <label className="mt-5 block"><span className="field-label"><UserRound size={17}/> Tên nhân viên QLCL-DV</span><input className="field-input" type="text" placeholder="Ví dụ: Nguyễn Hữu Duy Kha" value={form.employees} onChange={event => dispatch(setGsttEmployees(event.target.value))}/></label>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="primary-button !bg-cyan-700 !shadow-cyan-200 hover:!bg-cyan-800 dark:!bg-cyan-900 dark:!shadow-none dark:hover:!bg-cyan-800" disabled={!valid || loading} onClick={search}>{loading ? <LoaderCircle className="animate-spin" size={18}/> : <Search size={18}/>} {loading ? "Đang xử lý..." : "Search"}</button>
          <button className="secondary-button" disabled={!hasData || loading} onClick={download}><Download size={18}/>Tải báo cáo</button>
          <SaveReportButton type="gstt" title="báo cáo Hỗ trợ GSTT" form={form} disabled={!hasData || loading} className="sm:col-span-2"/>
        </div>
      </div>
    </div>

    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><Headphones size={20}/></span><div><h2 className="text-lg font-bold text-ink">Kết quả tổng hợp Hỗ trợ GSTT</h2><p className="mt-1 text-xs leading-5 text-slate-500">Dữ liệu được lấy từ đúng các sheet tháng nằm trong khoảng ngày đã chọn.</p></div></div>
        {hasData && <button className="secondary-button !h-10 shrink-0" disabled={loading} onClick={download}><Download size={17}/>Tải Excel</button>}
      </div>
      {loading && !form.processed ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-500"><LoaderCircle className="animate-spin text-cyan-600" size={34}/><span className="mt-4 text-sm font-semibold">Đang phân tích dữ liệu...</span></div> : !hasData ? <NoData searched={form.processed}/> : <ResultTable rows={form.results}/>} 
    </div>
  </section>;
}
