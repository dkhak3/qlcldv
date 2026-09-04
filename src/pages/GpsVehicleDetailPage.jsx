import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowLeft, Check, CircleAlert, ClipboardCopy, Download, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import NoData from "../components/NoData";
import { exportGpsVehicleDetails } from "../utils/exportGpsVehicleDetails";

const DETAIL_KEYS = ["BA", "BA35", "VIETMAP", "TONGDA"];
const STATUSES = [
  { key: "processed", label: "Đã xử lý", icon: Wrench, color: "text-emerald-600", box: "bg-emerald-50 border-emerald-100" },
  { key: "unprocessed", label: "Chưa xử lý", icon: CircleAlert, color: "text-rose-600", box: "bg-rose-50 border-rose-100" },
];

export default function GpsVehicleDetailPage() {
  const { results, startDate, endDate } = useSelector(state => state.gps);
  const groups = useMemo(() => results.filter(group => DETAIL_KEYS.includes(group.key)), [results]);
  const hasData = groups.some(group => group.rows.some(row => row.total > 0));
  const [activeKey, setActiveKey] = useState(groups[0]?.key || "BA");
  const [copiedBranch, setCopiedBranch] = useState("");
  const activeGroup = groups.find(group => group.key === activeKey) || groups[0];

  const copyBranch = async row => {
    const lines = STATUSES.flatMap(status => [`--- ${status.label.toUpperCase()} ---`, ...row.vehicles[status.key]]);
    const copyKey = `${activeGroup?.key}-${row.branch}`;
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedBranch(copyKey);
      toast.success(`Đã sao chép danh sách xe ${row.branch}`);
      window.setTimeout(() => setCopiedBranch(""), 1800);
    } catch { toast.error("Không thể sao chép danh sách xe"); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><Link to="/bao-cao-gps" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"><ArrowLeft size={17}/>Quay lại báo cáo GPS</Link><h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">Chi tiết các xe GPS</h1><p className="mt-2 text-sm text-slate-500">Biển số được phân theo nhóm, chi nhánh và trạng thái chốt kỳ.</p></div>
      <button className="primary-button !bg-blue-600 !shadow-blue-200 hover:!bg-blue-700 dark:!bg-blue-900 dark:!text-blue-100 dark:!shadow-none dark:hover:!bg-blue-800" disabled={!hasData} onClick={() => exportGpsVehicleDetails(groups, startDate, endDate).then(() => toast.success("Đã tạo file Excel chi tiết GPS")).catch(error => toast.error(error.message || "Không thể tạo file Excel"))}><Download size={18}/>Tải Excel chi tiết</button>
    </div>

    {!hasData ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card"><NoData searched/></div> : <>
      <div className="mt-8 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-card">{groups.map(group => <button key={group.key} onClick={() => setActiveKey(group.key)} className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition ${activeGroup?.key === group.key ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:shadow-none dark:ring-1 dark:ring-blue-800" : "text-slate-500 hover:bg-slate-50 hover:text-ink"}`}>{group.title}</button>)}</div>
      {!activeGroup?.rows.some(row => row.total > 0) ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card"><NoData searched/></div> : <div className="mt-6 grid gap-5">{activeGroup.rows.filter(row => row.total > 0).map(row => {
        const copyKey = `${activeGroup.key}-${row.branch}`;
        return <article key={row.branch} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-ink">{row.branch}</h2><p className="mt-1 text-xs text-slate-400">Tổng {row.total} phương tiện</p></div><button onClick={() => copyBranch(row)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-200">{copiedBranch === copyKey ? <Check size={15} className="text-emerald-500"/> : <ClipboardCopy size={15}/>}Sao chép</button></header>
          <div className="grid gap-4 p-5 lg:grid-cols-2">{STATUSES.map(({ key, label, icon: Icon, color, box }) => <section key={key} className={`rounded-xl border p-4 ${box}`}><div className={`mb-3 flex items-center justify-between ${color}`}><span className="flex items-center gap-2 text-sm font-bold"><Icon size={17}/>{label}</span><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold dark:bg-slate-950/70 dark:ring-1 dark:ring-slate-700">{row.vehicles[key].length}</span></div>{row.vehicles[key].length ? <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">{row.vehicles[key].map((vehicle, index) => <div key={vehicle} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"><span className="w-5 text-right text-xs text-slate-400">{index + 1}</span><b className="select-all font-semibold tracking-wide text-slate-700">{vehicle}</b></div>)}</div> : <p className="py-5 text-center text-xs italic text-slate-400">Không có xe</p>}</section>)}</div>
        </article>;
      })}</div>}
    </>}
  </section>;
}
