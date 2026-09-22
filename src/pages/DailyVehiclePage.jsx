import { useEffect, useMemo, useState } from "react";
import {
  BusFront,
  CalendarDays,
  CheckCircle2,
  CircleCheckBig,
  ClipboardCopy,
  FileSpreadsheet,
  FileWarning,
  LoaderCircle,
  Search,
  UploadCloud,
} from "lucide-react";
import { toast } from "react-toastify";
import ManagedGuideVideo from "../components/ManagedGuideVideo";
import NoData from "../components/NoData";
import Pagination, { pageItems } from "../components/Pagination";
import {
  inspectDailyVehicleGpsFile,
  inspectDailyVehicleSourceFile,
  processDailyVehicleFiles,
} from "../utils/dailyVehicleProcessor";

function FileStatus({ file, inspect }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let active = true;
    if (!file) {
      setState(null);
      return () => { active = false; };
    }
    setState({ checking: true });
    inspect(file)
      .then(result => { if (active) setState(result); })
      .catch(error => { if (active) setState({ valid: false, message: error.message || "Không thể kiểm tra file" }); });
    return () => { active = false; };
  }, [file, inspect]);

  if (!file || !state) return null;
  if (state.checking) return <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-400"><LoaderCircle className="animate-spin" size={14}/>Đang kiểm tra file...</div>;
  if (state.valid) return <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 shrink-0" size={15}/><span><b>{state.message}</b>{state.detail ? <span className="block opacity-80">{state.detail}</span> : null}</span></div>;
  return <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"><FileWarning className="mt-0.5 shrink-0" size={15}/><span><b>File chưa đúng cấu trúc.</b><span className="block">{state.message}</span></span></div>;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function copyNotesToClipboard(rows) {
  const notes = rows.map(row => String(row.note ?? ""));
  const plainText = notes.join("\r\n");
  const html = `<table><tbody>${notes.map(note => `<tr><td>${escapeHtml(note)}</td></tr>`).join("")}</tbody></table>`;

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([plainText], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      }),
    ]);
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plainText);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = plainText;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("Trình duyệt không cho phép sao chép");
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    amber: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  };
  return <div className={`rounded-2xl border px-4 py-4 ${tones[tone] || tones.slate}`}><strong className="block text-2xl font-bold">{value}</strong><span className="mt-1 block text-[11px] font-semibold uppercase tracking-[.08em] opacity-75">{label}</span></div>;
}

export default function DailyVehiclePage() {
  const [vehicleFile, setVehicleFile] = useState(null);
  const [gpsFile, setGpsFile] = useState(null);
  const [dateValue, setDateValue] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeGroupKey, setActiveGroupKey] = useState("");
  const [page, setPage] = useState(1);

  const activeGroup = useMemo(
    () => results?.groups?.find(group => group.key === activeGroupKey) || results?.groups?.[0] || null,
    [results, activeGroupKey],
  );
  const paged = pageItems(activeGroup?.rows || [], page, 25);

  const chooseFile = (event, setter, label) => {
    const selected = event.target.files?.[0] || null;
    if (selected && !selected.name.toLowerCase().endsWith(".xlsx")) {
      event.target.value = "";
      setter(null);
      toast.error(`${label}: chỉ chấp nhận định dạng .xlsx`);
      return;
    }
    setter(selected);
    setResults(null);
    setActiveGroupKey("");
    setPage(1);
  };

  const search = async () => {
    if (!vehicleFile || !gpsFile || !dateValue) return toast.warning("Vui lòng chọn đủ 2 file và ngày báo cáo");
    setLoading(true);
    setResults(null);
    try {
      const next = await processDailyVehicleFiles(vehicleFile, gpsFile, dateValue);
      setResults(next);
      setActiveGroupKey(next.groups[0]?.key || "");
      setPage(1);
      if (next.updated) {
        toast.success(`Đã đối chiếu ${next.total} xe · cập nhật ${next.updated} ghi chú · giữ nguyên ${next.preserved}`);
      } else {
        toast.warning("Đã đọc file GPS nhưng chưa tìm thấy xe khớp trong file phương tiện ở ngày đã chọn");
      }
    } catch (error) {
      toast.error(error.message || "Không thể xử lý dữ liệu phương tiện hằng ngày");
    } finally {
      setLoading(false);
    }
  };

  const copyNotes = async () => {
    if (!activeGroup?.rows?.length) return;
    try {
      await copyNotesToClipboard(activeGroup.rows);
      toast.success(`Đã copy ${activeGroup.rows.length} ô Ghi chú của ${activeGroup.title}, bao gồm cả các ô trống`);
    } catch (error) {
      toast.error(error.message || "Không thể copy Ghi chú");
    }
  };

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <span className="inline-flex rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold tracking-[.16em] text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">BÁO CÁO HẰNG NGÀY</span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Đối chiếu phương tiện và Ghi chú GPS</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">Đối chiếu đúng Chi nhánh + Biển số xe theo ngày, cập nhật Ghi chú và giữ nguyên thứ tự GPS để có thể copy/paste trực tiếp.</p>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <ManagedGuideVideo reportKey="daily-vehicle" description="Cách chuẩn bị file Phương tiện, GPS và copy Ghi chú"/>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-300"><BusFront size={20}/></span>
          <div><h2 className="font-bold text-ink dark:text-white">Dữ liệu phương tiện hằng ngày</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chỉ cần 2 file và một ngày báo cáo.</p></div>
        </div>

        <div className="mt-6">
          <label className="field-label"><UploadCloud size={17}/> File phương tiện — BÁO CÁO PHƯƠNG TIỆN HẰNG NGÀY</label>
          <label className="report-file-dropzone flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-teal-300 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-teal-700">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-teal-600 shadow-sm dark:bg-slate-900 dark:text-teal-300"><UploadCloud size={22}/></span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{vehicleFile ? vehicleFile.name : "Chọn file phương tiện"}</b><small className="mt-1 block text-xs text-slate-400">Mỗi sheet là một chi nhánh, trong sheet có các block ngày như 21-09.</small></span>
            {vehicleFile && <CircleCheckBig className="shrink-0 text-emerald-500" size={21}/>}
            <input className="sr-only" type="file" accept=".xlsx" onChange={event => chooseFile(event, setVehicleFile, "File phương tiện")}/>
          </label>
          <FileStatus file={vehicleFile} inspect={inspectDailyVehicleSourceFile}/>
        </div>

        <div className="mt-5">
          <label className="field-label"><UploadCloud size={17}/> File GPS — BA/VIETMAP hoặc TONGDA</label>
          <label className="report-file-dropzone flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-blue-700">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300"><FileSpreadsheet size={22}/></span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{gpsFile ? gpsFile.name : "Chọn file GPS"}</b><small className="mt-1 block text-xs text-slate-400">Tự nhận diện TỔNG HỢP BA + VIETMAP hoặc sheet GPS của TONGDA.</small></span>
            {gpsFile && <CircleCheckBig className="shrink-0 text-emerald-500" size={21}/>}
            <input className="sr-only" type="file" accept=".xlsx" onChange={event => chooseFile(event, setGpsFile, "File GPS")}/>
          </label>
          <FileStatus file={gpsFile} inspect={inspectDailyVehicleGpsFile}/>
        </div>

        <label className="mt-5 block"><span className="field-label"><CalendarDays size={17}/> Ngày báo cáo</span><input className="field-input report-input report-input-emerald" type="date" value={dateValue} onChange={event => { setDateValue(event.target.value); setResults(null); setPage(1); }}/></label>

        <button className="primary-button mt-6 w-full !bg-teal-600 !shadow-teal-200 hover:!bg-teal-700 dark:!bg-teal-800 dark:!shadow-none dark:hover:!bg-teal-700" disabled={!vehicleFile || !gpsFile || !dateValue || loading} onClick={search}>
          {loading ? <LoaderCircle className="animate-spin" size={18}/> : <Search size={18}/>}
          {loading ? "Đang đối chiếu..." : "Tìm kiếm"}
        </button>

        <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/70 px-3 py-2.5 text-xs leading-5 text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/25 dark:text-teal-300">
          <b>Quy tắc chống nhầm xe:</b> HCM → TP HỒ CHÍ MINH; ĐỒNG THÁP → dò cả CAO LÃNH và SA ĐÉC. Nếu không tìm thấy hoặc có nhiều kết quả mơ hồ, hệ thống giữ nguyên Ghi chú GPS.
        </div>
      </div>
    </div>

    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-ink dark:text-white">Kết quả đối chiếu</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Chi nhánh, Số xe và Tuyến chỉ dùng để kiểm tra. Nút Copy chỉ sao chép đúng cột Ghi chú và vẫn giữ các ô trống theo đúng thứ tự GPS.</p>
      </div>

      {results && <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Tổng xe GPS" value={results.total} tone="slate"/>
        <SummaryCard label="Đã cập nhật" value={results.updated} tone="emerald"/>
        <SummaryCard label="Giữ nguyên GPS" value={results.preserved} tone="amber"/>
      </div>}

      {results?.groups?.length > 1 && <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
        {results.groups.map(group => <button key={group.key} type="button" onClick={() => { setActiveGroupKey(group.key); setPage(1); }} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${activeGroup?.key === group.key ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-600 hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:text-teal-300"}`}>
          <FileSpreadsheet size={16}/>{group.title} ({group.total})
        </button>)}
      </div>}

      {loading
        ? <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-950/50 dark:text-slate-400"><LoaderCircle className="animate-spin text-teal-600" size={34}/><span className="mt-4 text-sm font-semibold">Đang tìm đúng Chi nhánh, ngày và Biển số xe...</span></div>
        : !activeGroup
          ? <div className="mt-5"><NoData searched={false} title="Chưa có kết quả" description="Chọn 2 file, ngày báo cáo và nhấn Tìm kiếm."/></div>
          : <div className="mt-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><h3 className="font-bold text-ink dark:text-white">{activeGroup.title}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nguồn: {activeGroup.sourceSheet} · {activeGroup.updated} xe cập nhật · {activeGroup.preserved} xe giữ nguyên.</p></div>
                <button type="button" className="primary-button !h-10 !bg-teal-600 !px-4 !shadow-none hover:!bg-teal-700" onClick={copyNotes}><ClipboardCopy size={17}/>Copy Ghi chú ({activeGroup.rows.length} ô)</button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[980px] border-collapse text-sm">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/70 dark:text-slate-300"><tr><th className="px-4 py-3 text-left font-semibold">Chi nhánh</th><th className="px-4 py-3 text-left font-semibold">Số xe</th><th className="px-4 py-3 text-left font-semibold">Tuyến</th><th className="px-4 py-3 text-left font-semibold">Ghi chú</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{paged.items.map((row, index) => <tr key={`${row.sourceRow}-${row.vehicle}-${index}`} className={`transition ${row.matchStatus === "updated" ? "hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20" : row.matchStatus === "ambiguous" ? "bg-amber-50/40 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.branch || "—"}</td>
                    <td className="px-4 py-3 font-bold tracking-wide text-slate-700 dark:text-slate-200">{row.vehicle || "—"}</td>
                    <td className="max-w-sm px-4 py-3 text-slate-600 dark:text-slate-300">{row.route || "—"}</td>
                    <td className="max-w-xl whitespace-normal px-4 py-3 leading-6 text-slate-600 dark:text-slate-300">
                      <div className="mb-1 flex flex-wrap gap-1.5">{row.matchStatus === "updated" && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">ĐÃ NỐI · {row.matchedSheet}</span>}{row.matchStatus === "ambiguous" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">GIỮ NGUYÊN · TRÙNG NHIỀU KẾT QUẢ</span>}{row.matchStatus === "preserved" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">GIỮ NGUYÊN GPS</span>}</div>
                      {row.note ? row.note : <span className="italic text-slate-400">Ô Ghi chú trống</span>}
                    </td>
                  </tr>)}</tbody>
                </table>
              </div>
              <Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/>
            </div>}
    </div>
  </section>;
}
