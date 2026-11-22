import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowLeft, Check, ClipboardCopy, Download, Wrench, CircleAlert, ScanSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import NoData from "../components/NoData";
import { exportVehicleDetails } from "../utils/exportVehicleDetails";

const DETAIL_KEYS = ["BA", "SOJI", "TONGDA"];
const STATUSES = [
  { key: "fixed", label: "Đã sửa", icon: Wrench, color: "text-emerald-600", box: "bg-emerald-50 border-emerald-100" },
  { key: "unfixed", label: "Chưa sửa", icon: CircleAlert, color: "text-rose-600", box: "bg-rose-50 border-rose-100" },
  { key: "checked", label: "Đã kiểm tra", icon: ScanSearch, color: "text-blue-600", box: "bg-blue-50 border-blue-100" },
];

export default function CameraVehicleDetailPage() {
  const { results, startDate, endDate } = useSelector(state => state.camera);
  const groups = useMemo(() => results.filter(group => DETAIL_KEYS.includes(group.key)), [results]);
  const hasData = groups.some(group => group.rows.some(row => row.total > 0));
  const [activeKey, setActiveKey] = useState(groups[0]?.key || "BA");
  const [copiedBranch, setCopiedBranch] = useState("");
  const [copiedSheet, setCopiedSheet] = useState("");
  const activeGroup = groups.find(group => group.key === activeKey) || groups[0];

  const copyBranch = async row => {
    const lines = STATUSES.flatMap(status => [STATUS_HEADING(status.label), ...row.vehicles[status.key]]);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedBranch(row.branch);
      toast.success(`Đã sao chép danh sách xe ${row.branch}`);
      window.setTimeout(() => setCopiedBranch(""), 1800);
    } catch { toast.error("Không thể sao chép danh sách xe"); }
  };

  const copySheet = async sheet => {
    const lines = [
      sheet.sheetName,
      `Tổng: ${sheet.total} xe`,
      ...STATUSES.flatMap(status => [
        `${STATUS_HEADING(status.label)} (${sheet.vehicles[status.key].length})`,
        ...sheet.vehicles[status.key],
      ]),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedSheet(sheet.sheetName);
      toast.success(`Đã sao chép danh sách xe từ ${sheet.sheetName}`);
      window.setTimeout(() => setCopiedSheet(""), 1800);
    } catch { toast.error("Không thể sao chép danh sách xe"); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><Link to="/bao-cao-camera" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"><ArrowLeft size={17}/>Quay lại báo cáo Camera</Link><h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">Chi tiết các xe</h1><p className="mt-2 text-sm text-slate-500">Biển số được phân theo nhóm, chi nhánh và trạng thái cuối cùng.</p></div>
      <button className="primary-button" disabled={!hasData} onClick={() => exportVehicleDetails(groups, startDate, endDate).then(() => toast.success("Đã tạo file Excel chi tiết")).catch(error => toast.error(error.message || "Không thể tạo file Excel"))}><Download size={18}/>Tải Excel chi tiết</button>
    </div>

    {!hasData ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card"><NoData searched/></div> : <>
      <div className="mt-8 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-card">{groups.map(group => <button key={group.key} onClick={() => setActiveKey(group.key)} className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition ${activeGroup?.key === group.key ? "bg-brand-500 text-white shadow-md shadow-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:shadow-none dark:ring-1 dark:ring-orange-800" : "text-slate-500 hover:bg-slate-50 hover:text-ink"}`}>{group.title}</button>)}</div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-5"><h2 className="text-lg font-bold text-ink">Thống kê theo từng sổ theo dõi</h2><p className="mt-1 text-sm text-slate-500">Danh sách xe được tổng hợp riêng theo từng sheet nguồn, không tách theo chi nhánh.</p></div>
        {!activeGroup?.sheetDetails?.length ? <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">Không có sheet theo dõi trong file đã chọn.</p> : <div className="grid gap-5">
          {activeGroup.sheetDetails.map(sheet => <article key={sheet.sheetName} className="overflow-hidden rounded-xl border border-slate-200">
            <header className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center">
              <div><h3 className="text-sm font-bold text-ink">{sheet.sheetName}</h3><p className="mt-1 text-xs text-slate-500">Tổng cộng <b className="text-ink">{sheet.total}</b> xe</p></div>
              <button onClick={() => copySheet(sheet)} className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-xl bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 sm:self-auto">{copiedSheet === sheet.sheetName ? <Check size={15} className="text-emerald-500"/> : <ClipboardCopy size={15}/>}Sao chép danh sách</button>
            </header>
            <div className="grid gap-3 p-4 lg:grid-cols-3">{STATUSES.map(({ key, label, icon: Icon, color, box }) => <section key={key} className={`rounded-xl border p-3 ${box}`}>
              <div className={`mb-3 flex items-center justify-between gap-2 ${color}`}><span className="flex items-center gap-2 text-sm font-bold"><Icon size={16}/>{label}</span><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold dark:bg-slate-950/70 dark:ring-1 dark:ring-slate-700">{sheet.vehicles[key].length}</span></div>
              {sheet.vehicles[key].length ? <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">{sheet.vehicles[key].map((vehicle, index) => <div key={vehicle} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"><span className="w-5 text-right text-xs text-slate-400">{index + 1}</span><b className="select-all font-semibold tracking-wide text-slate-700">{vehicle}</b></div>)}</div> : <p className="py-5 text-center text-xs italic text-slate-400">Không có xe</p>}
            </section>)}</div>
          </article>)}
        </div>}
      </section>

      <div className="mt-6 grid gap-5">{activeGroup?.rows.map(row => <article key={row.branch} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-ink">{row.branch}</h2><p className="mt-1 text-xs text-slate-400">Tổng {row.total} phương tiện</p></div><button onClick={() => copyBranch(row)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-200">{copiedBranch === row.branch ? <Check size={15} className="text-emerald-500"/> : <ClipboardCopy size={15}/>}Sao chép</button></header>
        <div className="grid gap-4 p-5 lg:grid-cols-3">{STATUSES.map(({ key, label, icon: Icon, color, box }) => <section key={key} className={`rounded-xl border p-4 ${box}`}><div className={`mb-3 flex items-center justify-between ${color}`}><span className="flex items-center gap-2 text-sm font-bold"><Icon size={17}/>{label}</span><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold dark:bg-slate-950/70 dark:ring-1 dark:ring-slate-700">{row.vehicles[key].length}</span></div>{row.vehicles[key].length ? <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">{row.vehicles[key].map((vehicle, index) => <div key={vehicle} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"><span className="w-5 text-right text-xs text-slate-400">{index + 1}</span><b className="select-all font-semibold tracking-wide text-slate-700">{vehicle}</b></div>)}</div> : <p className="py-5 text-center text-xs italic text-slate-400">Không có xe</p>}</section>)}</div>
      </article>)}</div>
    </>}
  </section>;
}

function STATUS_HEADING(label) { return `--- ${label.toUpperCase()} ---`; }
