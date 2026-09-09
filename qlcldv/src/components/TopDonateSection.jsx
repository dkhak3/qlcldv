import { useEffect, useMemo, useState } from "react";
import { Crown, HeartHandshake, LoaderCircle, Medal, Quote, Sparkles, Trophy } from "lucide-react";
import { getTopDonates, rankTopDonates } from "../services/topDonateService";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const rankStyles = {
  1: {
    card: "border-amber-300/60 bg-gradient-to-br from-amber-300/20 via-amber-100/10 to-transparent",
    badge: "border-amber-200/50 bg-amber-300 text-amber-950 shadow-amber-500/20",
    amount: "text-amber-300",
  },
  2: {
    card: "border-slate-300/40 bg-gradient-to-br from-slate-200/15 via-white/5 to-transparent",
    badge: "border-white/30 bg-slate-200 text-slate-800 shadow-slate-300/10",
    amount: "text-slate-200",
  },
  3: {
    card: "border-orange-300/40 bg-gradient-to-br from-orange-400/15 via-amber-200/5 to-transparent",
    badge: "border-orange-200/40 bg-orange-400 text-orange-950 shadow-orange-500/20",
    amount: "text-orange-300",
  },
};

function RankIcon({ rank }) {
  if (rank === 1) return <Crown size={21}/>;
  if (rank === 2) return <Trophy size={20}/>;
  return <Medal size={20}/>;
}

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
      .catch(loadError => { if (active) setError(loadError.message || "Không thể tải Bảng Vàng Ủng Hộ"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const rankedItems = useMemo(() => rankTopDonates(items), [items]);
  const honoredItems = useMemo(() => rankedItems.filter(item => item.rank <= 10), [rankedItems]);
  const featuredItems = useMemo(() => honoredItems.filter(item => item.rank <= 3), [honoredItems]);
  const remainingItems = useMemo(() => honoredItems.filter(item => item.rank > 3), [honoredItems]);

  return <section className="relative mt-10 overflow-hidden rounded-[32px] border border-amber-300/30 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white shadow-[0_28px_80px_-35px_rgba(120,74,8,0.65)]">
    <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"/>
    <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl"/>
    <div className="relative border-b border-amber-200/15 px-6 py-9 text-center sm:px-10 sm:py-11">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-amber-200/40 bg-amber-300/10 text-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.16)]"><Trophy size={27}/></span>
      <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.28em] text-amber-300"><Sparkles size={13}/>Trân trọng ghi danh</span>
      <h2 className="mt-2 font-serif text-3xl font-bold tracking-wide text-white sm:text-4xl">BẢNG VÀNG ỦNG HỘ</h2>
      <div className="mx-auto mt-4 h-px w-28 bg-gradient-to-r from-transparent via-amber-300 to-transparent"/>
      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300">Mỗi sự ủng hộ là một niềm tin quý giá dành cho QLCL-DV. Xin trân trọng ghi nhận và chân thành cảm ơn những anh em đã đồng hành cùng dự án.</p>
      <p className="mt-3 text-xs font-semibold text-amber-200/80">Những anh em có cùng mức ủng hộ sẽ được trân trọng xếp cùng hạng.</p>
    </div>

    {loading ? <div className="relative flex min-h-64 items-center justify-center"><LoaderCircle className="animate-spin text-amber-300" size={34}/></div> : error ? <div className="relative px-6 py-16 text-center"><p className="text-sm font-semibold text-rose-300">{error}</p></div> : !honoredItems.length ? <div className="relative px-6 py-16 text-center"><HeartHandshake className="mx-auto text-amber-300/60" size={46}/><h3 className="mt-5 font-serif text-xl font-bold text-white">Bảng vàng đang chờ những dấu ấn đầu tiên</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">Dù là một lời động viên hay một sự ủng hộ, mọi tình cảm dành cho dự án đều luôn được trân trọng.</p></div> : <div className="relative p-5 sm:p-8">
      <div className="grid gap-4 lg:grid-cols-3">
        {featuredItems.map(item => {
          const style = rankStyles[item.rank] || rankStyles[3];
          return <article key={item.id} className={`relative overflow-hidden rounded-3xl border p-5 backdrop-blur-sm sm:p-6 ${style.card}`}>
            <div className="flex items-start justify-between gap-4">
              <span className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-black shadow-lg ${style.badge}`}><RankIcon rank={item.rank}/>HẠNG {item.rank}</span>
              <span className="font-serif text-4xl font-black text-white/10">#{item.rank}</span>
            </div>
            <h3 className="mt-7 truncate font-serif text-xl font-bold tracking-wide text-white" title={item.donorName}>{item.donorName}</h3>
            <p className={`mt-2 text-2xl font-black ${style.amount}`}>{currencyFormatter.format(item.amount)}</p>
            {item.message && <div className="mt-5 border-t border-white/10 pt-4"><Quote className="mb-2 text-amber-300/60" size={16}/><p className="line-clamp-3 text-sm italic leading-6 text-slate-300">“{item.message}”</p></div>}
            {item.donatedAt && <time className="mt-4 block text-xs text-slate-500">{formatDate(item.donatedAt)}</time>}
          </article>;
        })}
      </div>

      {remainingItems.length > 0 && <div className="mt-6 overflow-hidden rounded-3xl border border-amber-200/15 bg-white/[0.04]">
        <div className="border-b border-amber-200/15 px-5 py-4"><span className="text-[11px] font-bold uppercase tracking-[.2em] text-amber-300/80">Danh sách trân trọng ghi nhận</span></div>
        {remainingItems.map(item => <article key={item.id} className="grid grid-cols-[58px_1fr_auto] items-center gap-4 border-b border-white/[0.07] px-4 py-4 last:border-b-0 sm:px-6">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-amber-300/25 bg-amber-300/10 font-serif text-sm font-black text-amber-300">#{item.rank}</span>
          <div className="min-w-0">
            <h3 className="truncate font-serif font-bold tracking-wide text-slate-100">{item.donorName}</h3>
            {item.message && <p className="mt-1 truncate text-xs italic text-slate-500">“{item.message}”</p>}
          </div>
          <div className="text-right">
            <b className="text-sm text-amber-300">{currencyFormatter.format(item.amount)}</b>
            {item.donatedAt && <time className="mt-1 block text-[10px] text-slate-500">{formatDate(item.donatedAt)}</time>}
          </div>
        </article>)}
      </div>}
    </div>}
  </section>;
}
