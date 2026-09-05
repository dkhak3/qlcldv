import { useEffect, useState } from "react";
import { HeartHandshake, LoaderCircle, Medal, Sparkles, Trophy } from "lucide-react";
import { getTopDonates } from "../services/topDonateService";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const rankStyles = [
  "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100/70 dark:border-amber-800/60 dark:from-amber-950/40 dark:to-yellow-950/20",
  "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800",
  "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100/60 dark:border-orange-900/60 dark:from-orange-950/35 dark:to-amber-950/20",
];

const rankIconStyles = [
  "bg-amber-400 text-white shadow-amber-200",
  "bg-slate-400 text-white shadow-slate-200",
  "bg-orange-600 text-white shadow-orange-200",
];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function TopDonateSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getTopDonates()
      .then(data => { if (active) setItems(data); })
      .catch(loadError => { if (active) setError(loadError.message || "Không thể tải Top Donate"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section className="mt-8 overflow-hidden rounded-[28px] border border-amber-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-col gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-rose-50 px-6 py-6 dark:border-slate-800 dark:from-amber-950/30 dark:via-slate-900 dark:to-rose-950/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200 dark:shadow-none"><Trophy size={24}/></span>
        <div><span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-orange-600 dark:text-orange-300"><Sparkles size={13}/>Bảng vàng ủng hộ</span><h2 className="mt-1 text-2xl font-bold text-ink dark:text-white">Top Donate</h2></div>
      </div>
      <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Cảm ơn những anh em đã đồng hành và tiếp thêm động lực để QLCL-DV ngày càng hoàn thiện.</p>
    </div>

    {loading ? <div className="flex min-h-52 items-center justify-center"><LoaderCircle className="animate-spin text-orange-500" size={32}/></div> : error ? <div className="px-6 py-12 text-center"><p className="text-sm font-semibold text-rose-500">{error}</p></div> : !items.length ? <div className="px-6 py-12 text-center"><HeartHandshake className="mx-auto text-rose-300" size={42}/><h3 className="mt-4 font-bold text-slate-700 dark:text-slate-200">Chưa có dữ liệu Top Donate</h3><p className="mt-2 text-sm text-slate-400">Những lời cảm ơn đầu tiên đang chờ được ghi danh.</p></div> : <div className="p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        {items.slice(0, 3).map((item, index) => <article key={item.id} className={`relative overflow-hidden rounded-2xl border p-5 ${rankStyles[index]}`}>
          <div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl shadow-md ${rankIconStyles[index]}`}>{index === 0 ? <Trophy size={20}/> : <Medal size={20}/>}</span><b className="text-3xl font-black text-slate-300/80 dark:text-slate-600">#{index + 1}</b></div>
          <h3 className="mt-5 truncate text-lg font-bold text-ink dark:text-white" title={item.donorName}>{item.donorName}</h3>
          <p className="mt-1 text-xl font-black text-orange-600 dark:text-orange-300">{currencyFormatter.format(item.amount)}</p>
          {item.message && <p className="mt-3 line-clamp-2 text-sm italic leading-6 text-slate-500 dark:text-slate-400">“{item.message}”</p>}
          {item.donatedAt && <time className="mt-3 block text-xs text-slate-400">{formatDate(item.donatedAt)}</time>}
        </article>)}
      </div>

      {items.length > 3 && <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        {items.slice(3, 10).map((item, index) => <div key={item.id} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800 sm:px-5">
          <b className="text-sm text-slate-400">#{index + 4}</b><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{item.donorName}</p>{item.message && <p className="mt-0.5 truncate text-xs text-slate-400">{item.message}</p>}</div><div className="text-right"><b className="text-sm text-orange-600 dark:text-orange-300">{currencyFormatter.format(item.amount)}</b>{item.donatedAt && <time className="mt-0.5 block text-[10px] text-slate-400">{formatDate(item.donatedAt)}</time>}</div>
        </div>)}
      </div>}
    </div>}
  </section>;
}
