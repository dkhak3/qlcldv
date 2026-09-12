import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Crown,
  Gem,
  HeartHandshake,
  LoaderCircle,
  Medal,
  Quote,
  Sparkles,
  Trophy,
} from "lucide-react";
import { getTopDonates, rankTopDonates } from "../services/topDonateService";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const rankStyles = {
  1: {
    card: "border-amber-300/80 bg-gradient-to-br from-amber-50 via-white to-amber-100/70 dark:border-amber-500/35 dark:from-amber-950/45 dark:via-slate-900 dark:to-amber-950/25",
    emblem: "border-amber-300 bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 shadow-amber-300/30 dark:border-amber-400",
    label: "text-amber-700 dark:text-amber-300",
    amount: "text-amber-700 dark:text-amber-300",
    glow: "bg-amber-300/30 dark:bg-amber-500/15",
  },
  2: {
    card: "border-slate-300/90 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:border-slate-500/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800/80",
    emblem: "border-slate-300 bg-gradient-to-br from-slate-100 to-slate-300 text-slate-700 shadow-slate-300/25 dark:border-slate-400",
    label: "text-slate-600 dark:text-slate-300",
    amount: "text-slate-700 dark:text-slate-200",
    glow: "bg-slate-300/30 dark:bg-slate-400/10",
  },
  3: {
    card: "border-orange-300/80 bg-gradient-to-br from-orange-50 via-white to-amber-100/60 dark:border-orange-500/35 dark:from-orange-950/40 dark:via-slate-900 dark:to-orange-950/20",
    emblem: "border-orange-300 bg-gradient-to-br from-orange-300 to-amber-600 text-orange-950 shadow-orange-300/25 dark:border-orange-400",
    label: "text-orange-700 dark:text-orange-300",
    amount: "text-orange-700 dark:text-orange-300",
    glow: "bg-orange-300/25 dark:bg-orange-500/10",
  },
};

function RankIcon({ rank, size = 20 }) {
  if (rank === 1) return <Crown size={size}/>;
  if (rank === 2) return <Trophy size={size}/>;
  return <Medal size={size}/>;
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

function FeaturedDonor({ item }) {
  const style = rankStyles[item.rank] || rankStyles[3];

  return <article className={`group relative isolate flex min-h-[310px] flex-col overflow-hidden rounded-[28px] border p-5 shadow-[0_22px_55px_-38px_rgba(15,23,42,.5)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_65px_-35px_rgba(146,91,14,.42)] sm:p-6 ${style.card}`}>
    <div className={`pointer-events-none absolute -right-16 -top-16 -z-10 h-44 w-44 rounded-full blur-3xl ${style.glow}`}/>
    <div className="flex items-center justify-between gap-4">
      <span className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] ${style.label}`}>
        <Sparkles size={13}/>Danh dự hạng {String(item.rank).padStart(2, "0")}
      </span>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border shadow-lg ${style.emblem}`}>
        <RankIcon rank={item.rank}/>
      </span>
    </div>

    <div className="mt-10">
      <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400 dark:text-slate-500">Trân trọng ghi danh</span>
      <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-7 text-slate-900 dark:text-white" title={item.donorName}>{item.donorName}</h3>
      <p className={`mt-3 text-2xl font-bold tabular-nums tracking-tight ${style.amount}`}>{currencyFormatter.format(item.amount)}</p>
    </div>

    <div className="mt-auto pt-7">
      {item.message && <div className="border-t border-slate-900/[0.07] pt-4 dark:border-white/10">
        <div className="flex items-start gap-2.5">
          <Quote className="mt-0.5 shrink-0 text-amber-500/70" size={15}/>
          <p className="line-clamp-3 text-sm italic leading-6 text-slate-500 dark:text-slate-400">“{item.message}”</p>
        </div>
      </div>}
      {item.donatedAt && <time className={`${item.message ? "mt-4" : "border-t border-slate-900/[0.07] pt-4 dark:border-white/10"} flex items-center gap-1.5 text-[11px] font-medium text-slate-400`}>
        <CalendarDays size={13}/>{formatDate(item.donatedAt)}
      </time>}
    </div>
  </article>;
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

  return <section className="relative mt-10 overflow-hidden rounded-[36px] border border-amber-200/80 bg-[#fffdf8] shadow-[0_32px_90px_-52px_rgba(120,74,8,.45)] dark:border-amber-900/50 dark:bg-slate-900">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"/>
    <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl dark:bg-amber-600/10"/>
    <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-orange-100/50 blur-3xl dark:bg-orange-700/10"/>

    <header className="relative px-6 pb-8 pt-10 sm:px-9 sm:pb-10 sm:pt-12 lg:px-12">
      <div className="grid items-end gap-7 lg:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 shadow-lg shadow-amber-200/50 dark:shadow-none"><Gem size={23}/></span>
            <span className="text-[11px] font-bold uppercase tracking-[.24em] text-amber-700 dark:text-amber-300">Trân trọng ghi danh</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-[-.035em] text-slate-950 dark:text-white sm:text-4xl lg:text-[42px]">Bảng Vàng Ủng Hộ</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">Mỗi sự ủng hộ là một niềm tin quý giá dành cho QLCL-DV. Xin trân trọng ghi nhận và chân thành cảm ơn những anh em đã đồng hành cùng dự án.</p>
        </div>
        <div className="max-w-sm rounded-2xl border border-amber-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-amber-900/60 dark:bg-slate-950/45">
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={19}/>
            <p className="text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">Những anh em có cùng mức ủng hộ luôn được trân trọng xếp <b className="font-bold text-amber-700 dark:text-amber-300">cùng hạng</b>.</p>
          </div>
        </div>
      </div>
    </header>

    <div className="relative border-t border-amber-200/70 bg-white/45 p-5 dark:border-amber-900/45 dark:bg-slate-950/20 sm:p-8 lg:p-10">
      {loading ? <div className="flex min-h-64 flex-col items-center justify-center rounded-[28px] border border-dashed border-amber-200 bg-white/60 text-slate-400 dark:border-amber-900/50 dark:bg-slate-950/30">
        <LoaderCircle className="animate-spin text-amber-500" size={32}/>
        <span className="mt-4 text-sm font-semibold">Đang chuẩn bị bảng danh dự...</span>
      </div> : error ? <div className="rounded-[28px] border border-rose-200 bg-rose-50/70 px-6 py-14 text-center dark:border-rose-900/60 dark:bg-rose-950/20"><p className="text-sm font-semibold text-rose-600 dark:text-rose-300">{error}</p></div> : !honoredItems.length ? <div className="rounded-[28px] border border-dashed border-amber-200 bg-white/60 px-6 py-14 text-center dark:border-amber-900/50 dark:bg-slate-950/30">
        <HeartHandshake className="mx-auto text-amber-500/60" size={45}/>
        <h3 className="mt-5 text-xl font-bold text-slate-800 dark:text-white">Bảng vàng đang chờ những dấu ấn đầu tiên</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">Dù là một lời động viên hay một sự ủng hộ, mọi tình cảm dành cho dự án đều luôn được trân trọng.</p>
      </div> : <>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredItems.map(item => <FeaturedDonor key={item.id} item={item}/>)}
        </div>

        {remainingItems.length > 0 && <div className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-200 dark:to-amber-900"/>
            <span className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">Danh sách trân trọng ghi nhận</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-200 dark:to-amber-900"/>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {remainingItems.map(item => <article key={item.id} className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_15px_36px_-30px_rgba(15,23,42,.45)] transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_20px_42px_-28px_rgba(146,91,14,.35)] dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-amber-700">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-200 bg-amber-50 text-sm font-bold tabular-nums text-amber-700 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-300">#{item.rank}</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-slate-800 dark:text-white" title={item.donorName}>{item.donorName}</h3>
                {item.message && <p className="mt-1 truncate text-xs italic text-slate-400">“{item.message}”</p>}
                {item.donatedAt && <time className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-slate-400"><CalendarDays size={11}/>{formatDate(item.donatedAt)}</time>}
              </div>
              <b className="shrink-0 text-right text-sm font-bold tabular-nums text-amber-700 dark:text-amber-300">{currencyFormatter.format(item.amount)}</b>
            </article>)}
          </div>
        </div>}
      </>}
    </div>
  </section>;
}
