import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, CircleCheckBig, Download, FileSpreadsheet, Gauge, LoaderCircle, Search, UploadCloud, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import NoData from "../components/NoData";
import ManagedGuideVideo from "../components/ManagedGuideVideo";
import SaveReportButton from "../components/SaveReportButton";
import {
  clearSpeed4hResults,
  setSpeed4hEmployees,
  setSpeed4hEndDate,
  setSpeed4hFile,
  setSpeed4hResults,
  setSpeed4hStartDate,
} from "../store";
import { exportSpeed4hReport } from "../utils/exportSpeed4hReport";
import { processSpeed4hFile } from "../utils/speed4hProcessor";

const SECTIONS = [
  { key: "speed", title: "1. Công việc gọi tốc độ" },
  { key: "fourHour", title: "2. Công việc gọi 4H" },
];

const totals = rows => rows.reduce((sum, row) => ({
  violations: sum.violations + row.violationCount,
  noAnswers: sum.noAnswers + row.noAnswerCount,
}), { violations: 0, noAnswers: 0 });

function ResultTable({ rows }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5"><NoData searched/></div>;
  const sum = totals(rows);
  return <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full min-w-[1180px] border-collapse text-sm">
      <thead className="bg-slate-50 text-slate-600">
        <tr>
          <th className="px-3 py-3 text-center font-semibold">STT</th>
          <th className="px-3 py-3 text-left font-semibold">Đối tác</th>
          <th className="px-3 py-3 text-left font-semibold">Chi nhánh</th>
          <th className="px-3 py-3 text-left font-semibold">Tuyến (Theo hướng)</th>
          <th className="px-3 py-3 text-left font-semibold">BKS</th>
          <th className="px-3 py-3 text-left font-semibold">Tên nhân viên</th>
          <th className="px-3 py-3 text-center font-semibold">Số lần vi phạm</th>
          <th className="px-3 py-3 text-left font-semibold">Nhân viên không nghe máy</th>
          <th className="px-3 py-3 text-center font-semibold">Số lần không nghe máy</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map(row => <tr className="transition hover:bg-violet-50/40" key={`${row.stt}-${row.employeeName}-${row.vehicle}`}>
          <td className="px-3 py-3 text-center text-slate-500">{row.stt}</td>
          <td className="px-3 py-3 font-semibold text-slate-700">{row.partner}</td>
          <td className="px-3 py-3 font-semibold text-slate-700">{row.branch}</td>
          <td className="max-w-xs px-3 py-3 text-slate-600">{row.route}</td>
          <td className="px-3 py-3 font-semibold tracking-wide text-slate-700">{row.vehicle}</td>
          <td className="px-3 py-3 text-slate-700">{row.employeeName}</td>
          <td className="px-3 py-3 text-center font-semibold text-violet-600">{row.violationCount}</td>
          <td className="px-3 py-3 text-slate-700">{row.noAnswerEmployee || "—"}</td>
          <td className="px-3 py-3 text-center text-rose-600">{row.noAnswerCount || 0}</td>
        </tr>)}
      </tbody>
      <tfoot><tr className="border-t border-violet-100 bg-violet-50 font-bold"><td className="px-3 py-3 text-center text-violet-700" colSpan="6">Tổng</td><td className="px-3 py-3 text-center text-violet-700">{sum.violations}</td><td/><td className="px-3 py-3 text-center text-rose-600">{sum.noAnswers}</td></tr></tfoot>
    </table>
  </div>;
}

export default function Speed4hPage() {
  const dispatch = useDispatch();
  const form = useSelector(state => state.speed4h);
  const [loading, setLoading] = useState(false);
  const hasData = form.results.speed.length > 0 || form.results.fourHour.length > 0;
  const valid = form.file && form.startDate && form.endDate && form.employees.trim() && form.startDate <= form.endDate;

  const chooseFile = event => {
    const selected = event.target.files?.[0] || null;
    if (selected && !selected.name.toLowerCase().endsWith(".xlsx")) {
      event.target.value = "";
      dispatch(setSpeed4hFile(null));
      toast.error("File Tốc độ, 4H: chỉ chấp nhận định dạng .xlsx");
      return;
    }
    dispatch(setSpeed4hFile(selected));
  };

  const search = async () => {
    if (!valid) return toast.warning("Vui lòng nhập file, khoảng ngày và tên nhân viên");
    dispatch(clearSpeed4hResults());
    setLoading(true);
    try {
      const results = await processSpeed4hFile(form.file, form.startDate, form.endDate);
      dispatch(setSpeed4hResults(results));
      const totalRows = results.speed.length + results.fourHour.length;
      if (totalRows) toast.success(`Hoàn tất! Tìm thấy ${results.speed.length} dòng Tốc độ và ${results.fourHour.length} dòng 4H`);
      else toast.info("File hợp lệ nhưng không có dữ liệu trong khoảng ngày đã chọn");
    } catch (error) {
      dispatch(clearSpeed4hResults());
      toast.error(error.message || "Không thể đọc file Tốc độ, 4H");
    } finally { setLoading(false); }
  };

  const download = async () => {
    setLoading(true);
    try {
      await exportSpeed4hReport(form);
      toast.success("Báo cáo Tốc độ, 4H đã được tạo theo đúng biểu mẫu");
    } catch (error) { toast.error(error.message || "Không thể xuất báo cáo Tốc độ, 4H"); }
    finally { setLoading(false); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold tracking-[.16em] text-violet-600">BÁO CÁO TUẦN</span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Tổng hợp báo cáo Tốc độ, 4H</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Tải file theo dõi, chọn tuần báo cáo và kiểm tra dữ liệu trước khi xuất Excel.</p>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <ManagedGuideVideo reportKey="speed-4h" description="Cách chuẩn bị file và xuất báo cáo Tốc độ, 4H"/>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><FileSpreadsheet size={20}/></span><div><h2 className="font-bold text-ink">Dữ liệu báo cáo Tốc độ, 4H</h2><p className="mt-1 text-xs text-slate-500">Tất cả trường bên dưới đều bắt buộc</p></div></div>

        <div className="mt-6">
          <label className="field-label"><UploadCloud size={17}/> QLCL - GỌI TỐC ĐỘ, 4H</label>
          <label className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-violet-500 hover:bg-violet-50/50">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm"><UploadCloud size={22}/></span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm font-semibold text-slate-700">{form.file ? form.file.name : "Chọn file Tốc độ, 4H"}</b><small className="mt-1 block text-xs text-slate-400">Dùng hai sheet TỐC ĐỘ và 4H</small></span>
            {form.file && <CircleCheckBig className="shrink-0 text-emerald-500" size={21}/>}<input className="sr-only" type="file" accept=".xlsx" onChange={chooseFile}/>
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label><span className="field-label"><CalendarDays size={17}/> Từ ngày</span><input className="field-input" type="date" value={form.startDate} onChange={event => dispatch(setSpeed4hStartDate(event.target.value))}/></label>
          <label><span className="field-label"><CalendarDays size={17}/> Đến ngày</span><input className="field-input" type="date" min={form.startDate} value={form.endDate} onChange={event => dispatch(setSpeed4hEndDate(event.target.value))}/></label>
        </div>
        <label className="mt-5 block"><span className="field-label"><UserRound size={17}/> Tên nhân viên QLCL-DV</span><input className="field-input" type="text" placeholder="Ví dụ: Võ Văn Khải, Đỗ Văn Bình" value={form.employees} onChange={event => dispatch(setSpeed4hEmployees(event.target.value))}/></label>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="primary-button !bg-violet-600 !shadow-violet-200 hover:!bg-violet-700 dark:!bg-violet-900 dark:!shadow-none dark:hover:!bg-violet-800" disabled={!valid || loading} onClick={search}>{loading ? <LoaderCircle className="animate-spin" size={18}/> : <Search size={18}/>} {loading ? "Đang xử lý..." : "Search"}</button>
          <button className="secondary-button" disabled={!hasData || loading} onClick={download}><Download size={18}/>Tải báo cáo</button>
          <SaveReportButton type="speed4h" title="báo cáo Tốc độ, 4H" form={form} disabled={!hasData || loading} className="sm:col-span-2"/>
        </div>
      </div>
    </div>

    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><Gauge size={20}/></span><div><h2 className="text-lg font-bold text-ink">Kết quả tổng hợp Tốc độ, 4H</h2><p className="mt-1 text-xs leading-5 text-slate-500">Dữ liệu được gộp theo Lái xe + BKS; riêng 4H chỉ đếm những dòng có dấu X tại cột VI PHẠM 4 GIỜ.</p></div></div>
        {hasData && <button className="secondary-button !h-10 shrink-0" disabled={loading} onClick={download}><Download size={17}/>Tải Excel</button>}
      </div>
      {loading && !form.processed ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-500"><LoaderCircle className="animate-spin text-violet-600" size={34}/><span className="mt-4 text-sm font-semibold">Đang phân tích dữ liệu...</span></div> : !hasData ? <NoData searched={form.processed}/> : <div className="space-y-8">{SECTIONS.map(section => <section key={section.key}><h3 className="mb-3 text-sm font-bold text-violet-600">{section.title}</h3><ResultTable rows={form.results[section.key]}/></section>)}</div>}
    </div>
  </section>;
}
