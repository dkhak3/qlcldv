import { ArrowRight, BookOpenText, Bus, Camera, ChartNoAxesCombined, Check, Clapperboard, Copy, FileSpreadsheet, Gauge, Headphones, LoaderCircle, MapPin, Radio, ShieldCheck, Smile, Sparkles, Video, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { REPORT_APPEARANCES } from "../data/reportBoxes";
import { getReportBoxes } from "../services/reportBoxService";
import { formatDateVi, getWeekInfo } from "../utils/weekInfo";
import { usePageSettings } from "../PageSettingsContext";

const ICONS = { camera: Camera, "map-pin": MapPin, "file-spreadsheet": FileSpreadsheet, gauge: Gauge, headphones: Headphones, video: Video, bus: Bus, chart: ChartNoAxesCombined, radio: Radio, shield: ShieldCheck, wrench: Wrench };

export default function HomePage() {
  const pageSettings = usePageSettings();
  const [copied, setCopied] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const today = new Date();
  const weekend = today.getDay() === 0 || today.getDay() === 6;
  const week = getWeekInfo(today);

  useEffect(() => {
    let active = true;
    getReportBoxes()
      .then(data => { if (active) setCards(data.filter(item => !item.hidden)); })
      .catch(() => toast.error("Không thể tải danh sách Box báo cáo"))
      .finally(() => { if (active) setLoadingCards(false); });
    return () => { active = false; };
  }, []);

  const copyWeek = async () => {
    try {
      await navigator.clipboard.writeText(week.copyText);
      setCopied(true);
      toast.success("Đã sao chép thông tin tuần");
      window.setTimeout(() => setCopied(false), 1800);
    } catch { toast.error("Không thể sao chép. Vui lòng thử lại"); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
    <div className="relative overflow-hidden rounded-[28px] border border-orange-100 bg-gradient-to-br from-white via-orange-50/60 to-amber-50 px-6 py-9 shadow-soft transition-colors dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/40 sm:px-10 sm:py-12">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-700/15" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div><span className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-wider text-brand-600 dark:border-orange-900/70 dark:bg-slate-950/70 dark:text-orange-300">QLCL-DV <Smile size={15}/></span><h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-ink dark:text-white sm:text-4xl">Chào bạn, hôm nay là {formatDateVi(today)},<br className="hidden sm:block"/> {weekend ? "cuối tuần vui vẻ nhé bạn" : "làm báo cáo sớm thế"} <span aria-hidden="true">😊</span></h1><p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">Chọn loại báo cáo bên dưới để bắt đầu tổng hợp dữ liệu.</p></div>
        <button onClick={copyWeek} className="group min-w-[250px] rounded-2xl border border-white bg-white/85 p-5 text-left shadow-card backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950/75 dark:hover:border-slate-600"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{week.range}</span><span className="mt-2 flex items-center justify-between gap-4 text-base font-bold text-ink dark:text-white">Tuần này là {week.label}{copied ? <Check className="shrink-0 text-emerald-500" size={20}/> : <Copy className="shrink-0 text-brand-500 transition group-hover:scale-110" size={20}/>}</span><span className="mt-2 block text-xs text-slate-400 dark:text-slate-500">Nhấn để sao chép</span></button>
      </div>
    </div>

    <div className="mb-5 mt-12"><h2 className="text-xl font-bold tracking-tight text-ink dark:text-white">Danh sách báo cáo</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Các công cụ tổng hợp dành cho bộ phận QLCL-DV.</p></div>
    {loadingCards ? <div className="flex min-h-56 items-center justify-center"><LoaderCircle className="animate-spin text-brand-500" size={32}/></div> : cards.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card => {
      const Icon = ICONS[card.icon] || FileSpreadsheet;
      const body = <><span className={`grid h-12 w-12 place-items-center rounded-2xl ${REPORT_APPEARANCES[card.appearance] || REPORT_APPEARANCES.orange}`}><Icon size={25}/></span><h3 className="mt-6 text-lg font-bold text-ink dark:text-white">{card.title}</h3><p className="mt-2 min-h-11 text-sm leading-6 text-slate-500 dark:text-slate-400">{card.description}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-orange-300">Mở báo cáo <ArrowRight size={17} className="transition group-hover:translate-x-1"/></span></>;
      const className = "group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-black/20";
      return <Link key={card.id} className={className} to={card.route || `/bao-cao/${card.slug}`}>{body}</Link>;
    })}</div> : <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 text-center dark:border-slate-700"><Clapperboard className="text-slate-300" size={42}/><b className="mt-3 text-slate-600 dark:text-slate-300">Chưa có Box báo cáo đang hiển thị</b></div>}
    {!pageSettings.getPage("blog")?.hidden && <div className="mt-8 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 px-6 py-7 shadow-card dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:px-8"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500 text-white"><BookOpenText size={24}/></span><div><span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.15em] text-orange-300"><Sparkles size={14}/>Góc chia sẻ</span><h2 className="mt-1.5 text-xl font-bold text-white">Blog Trick & Tool</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">Xem các mẹo Excel, xử lý dữ liệu và kinh nghiệm làm báo cáo từ đội ngũ QLCL-DV.</p></div></div><Link to={pageSettings.pathFor("blog")} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-900 transition hover:bg-orange-50">Xem bài viết <ArrowRight size={17}/></Link></div>}
  </section>;
}
