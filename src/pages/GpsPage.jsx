import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, CircleCheckBig, Download, Eye, FileSpreadsheet, LoaderCircle, Search, UploadCloud, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import NoData from "../components/NoData";
import ManagedGuideVideo from "../components/ManagedGuideVideo";
import SaveReportButton from "../components/SaveReportButton";
import { clearGpsResults, setGpsEmployees, setGpsEndDate, setGpsFile, setGpsResults, setGpsStartDate, setGpsTongdaFile } from "../store";
import { countUniqueBranches } from "../utils/cameraProcessor";
import { processGpsFiles } from "../utils/gpsProcessor";
import { exportGpsReport } from "../utils/exportGpsReport";

const totals = rows => rows.reduce((sum, row) => ({
  total: sum.total + row.total,
  processed: sum.processed + row.processed,
  unprocessed: sum.unprocessed + row.unprocessed,
}), { total: 0, processed: 0, unprocessed: 0 });

export default function GpsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const form = useSelector(state => state.gps);
  const [loading, setLoading] = useState(false);
  const hasData = form.results.some(group => group.rows.length > 0);
  const valid = form.file && form.tongdaFile && form.startDate && form.endDate && form.employees.trim() && form.startDate <= form.endDate;

  const chooseFile = (event, action, label) => {
    const selected = event.target.files?.[0] || null;
    if (selected && !selected.name.toLowerCase().endsWith(".xlsx")) {
      event.target.value = "";
      dispatch(action(null));
      toast.error(`${label}: chỉ chấp nhận định dạng .xlsx`);
      return;
    }
    dispatch(action(selected));
  };

  const search = async () => {
    if (!valid) return toast.warning("Vui lòng nhập đầy đủ file, khoảng ngày và tên nhân viên");
    dispatch(clearGpsResults());
    setLoading(true);
    try {
      const results = await processGpsFiles(form.file, form.tongdaFile, form.startDate, form.endDate);
      dispatch(setGpsResults(results));
      const branchCount = countUniqueBranches(results);
      if (branchCount) toast.success(`Hoàn tất! Đã tìm thấy dữ liệu của ${branchCount} chi nhánh`);
      else toast.info("File hợp lệ nhưng không có dữ liệu trong khoảng ngày đã chọn");
    } catch (error) {
      dispatch(clearGpsResults());
      toast.error(error.message || "Không thể đọc file Excel");
    } finally { setLoading(false); }
  };

  const download = async () => {
    setLoading(true);
    try {
      await exportGpsReport(form);
      toast.success("Báo cáo GPS đã được tạo theo đúng biểu mẫu");
    } catch (error) { toast.error(error.message || "Không thể xuất báo cáo GPS"); }
    finally { setLoading(false); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold tracking-[.16em] text-blue-600">BÁO CÁO TUẦN</span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Tổng hợp tình trạng GPS</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Tải hai file theo dõi, chọn tuần báo cáo và kiểm tra kết quả trước khi xuất Excel.</p>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <ManagedGuideVideo reportKey="gps" description="Cách chuẩn bị file và xuất báo cáo GPS"/>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><FileSpreadsheet size={20}/></span><div><h2 className="font-bold text-ink">Dữ liệu báo cáo GPS</h2><p className="mt-1 text-xs text-slate-500">Tất cả trường bên dưới đều bắt buộc</p></div></div>

        <div className="mt-6">
          <label className="field-label"><UploadCloud size={17}/> File 1 — QLCL - TỔNG HỢP BÁO CÁO SỬA CHỮA ĐỊNH VỊ</label>
          <label className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-blue-500 hover:bg-blue-50/50">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm"><UploadCloud size={22}/></span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm font-semibold text-slate-700">{form.file ? form.file.name : "Chọn file GPS chính"}</b><small className="mt-1 block text-xs text-slate-400">Dùng các sheet VIETMAP, BÌNH ANH, 16 TUYẾN HCM và 35 TUYẾN</small></span>
            {form.file && <CircleCheckBig className="shrink-0 text-emerald-500" size={21}/>}<input className="sr-only" type="file" accept=".xlsx" onChange={event => chooseFile(event, setGpsFile, "File GPS chính")}/>
          </label>
        </div>

        <div className="mt-5">
          <label className="field-label"><UploadCloud size={17}/> File 2 — QLCL - TỔNG HỢP SỬA CHỮA CAMERA &amp; ĐỊNH VỊ TONGDA</label>
          <label className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-blue-500 hover:bg-blue-50/50">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-cyan-600 shadow-sm"><UploadCloud size={22}/></span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm font-semibold text-slate-700">{form.tongdaFile ? form.tongdaFile.name : "Chọn file TONGDA"}</b><small className="mt-1 block text-xs text-slate-400">Dùng sheet Sổ theo dõi GPS</small></span>
            {form.tongdaFile && <CircleCheckBig className="shrink-0 text-emerald-500" size={21}/>}<input className="sr-only" type="file" accept=".xlsx" onChange={event => chooseFile(event, setGpsTongdaFile, "File TONGDA")}/>
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label><span className="field-label"><CalendarDays size={17}/> Từ ngày</span><input className="field-input" type="date" value={form.startDate} onChange={event => dispatch(setGpsStartDate(event.target.value))}/></label>
          <label><span className="field-label"><CalendarDays size={17}/> Đến ngày</span><input className="field-input" type="date" min={form.startDate} value={form.endDate} onChange={event => dispatch(setGpsEndDate(event.target.value))}/></label>
        </div>
        <label className="mt-5 block"><span className="field-label"><UserRound size={17}/> Tên nhân viên QLCL-DV</span><input className="field-input" type="text" placeholder="Ví dụ: Bùi Nguyễn Phúc An, Nguyễn Minh Huy" value={form.employees} onChange={event => dispatch(setGpsEmployees(event.target.value))}/></label>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><button className="primary-button" disabled={!valid || loading} onClick={search}>{loading ? <LoaderCircle className="animate-spin" size={18}/> : <Search size={18}/>} {loading ? "Đang xử lý..." : "Search"}</button><button className="secondary-button" disabled={!hasData || loading} onClick={download}><Download size={18}/>Tải báo cáo</button><button className="secondary-button" disabled={!hasData || loading} onClick={() => navigate("/bao-cao-gps/chi-tiet")}><Eye size={18}/>Xem chi tiết các xe</button><SaveReportButton type="gps" title="báo cáo GPS" form={form} disabled={!hasData || loading}/></div>
      </div>
    </div>

    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold text-ink">Kết quả tổng hợp GPS</h2><p className="mt-1 text-xs leading-5 text-slate-500">Xe được xóa trùng theo chi nhánh; trạng thái Chưa xử lý của ngày kết thúc được ưu tiên chốt kỳ.</p></div>{hasData && <div className="flex flex-wrap gap-2"><button className="secondary-button !h-10" disabled={loading} onClick={() => navigate("/bao-cao-gps/chi-tiet")}><Eye size={17}/>Xem chi tiết</button><button className="secondary-button !h-10" disabled={loading} onClick={download}><Download size={17}/>Tải Excel</button></div>}</div>

      {loading && !form.processed ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-500"><LoaderCircle className="animate-spin text-blue-600" size={34}/><span className="mt-4 text-sm font-semibold">Đang phân tích dữ liệu GPS...</span></div> : !hasData ? <NoData searched={form.processed}/> : form.results.map(group => {
        const sum = totals(group.rows);
        return group.rows.length > 0 && <div className="mt-7 first:mt-0" key={group.key}>
          <h3 className="mb-3 text-sm font-bold text-blue-600">{group.title}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[680px] border-collapse text-sm"><thead><tr className="bg-slate-50 text-slate-600"><th className="px-4 py-3 text-center font-semibold">STT</th><th className="px-4 py-3 text-left font-semibold">Chi nhánh</th><th className="px-4 py-3 text-center font-semibold">Số lượng phương tiện báo sửa chữa</th><th className="px-4 py-3 text-center font-semibold">Đã xử lý</th><th className="px-4 py-3 text-center font-semibold">Chưa xử lý</th></tr></thead><tbody className="divide-y divide-slate-100">{group.rows.map(row => <tr className="transition hover:bg-blue-50/40" key={`${group.key}-${row.branch}`}><td className="px-4 py-3 text-center text-slate-500">{row.stt}</td><td className="px-4 py-3 font-semibold text-slate-700">{row.branch}</td><td className="px-4 py-3 text-center">{row.total}</td><td className="px-4 py-3 text-center text-emerald-600">{row.processed}</td><td className="px-4 py-3 text-center text-rose-600">{row.unprocessed}</td></tr>)}</tbody><tfoot><tr className="border-t border-blue-100 bg-blue-50 font-bold"><td className="px-4 py-3 text-center text-blue-700" colSpan="2">Tổng</td><td className="px-4 py-3 text-center">{sum.total}</td><td className="px-4 py-3 text-center text-emerald-600">{sum.processed}</td><td className="px-4 py-3 text-center text-rose-600">{sum.unprocessed}</td></tr></tfoot></table></div>
        </div>;
      })}
    </div>
  </section>;
}
