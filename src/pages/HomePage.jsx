import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  Bus,
  CalendarRange,
  Camera,
  ChartNoAxesCombined,
  Check,
  Clapperboard,
  ClipboardCheck,
  Clock3,
  Copy,
  FileSpreadsheet,
  Gauge,
  Headphones,
  Layers3,
  LoaderCircle,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  Video,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { REPORT_APPEARANCES } from "../data/reportBoxes";
import { getReportBoxes } from "../services/reportBoxService";
import { formatDateVi, getWeekInfo } from "../utils/weekInfo";
import { usePageSettings } from "../PageSettingsContext";

const ICONS = {
  camera: Camera,
  "map-pin": MapPin,
  "file-spreadsheet": FileSpreadsheet,
  gauge: Gauge,
  headphones: Headphones,
  video: Video,
  bus: Bus,
  chart: ChartNoAxesCombined,
  radio: Radio,
  shield: ShieldCheck,
  wrench: Wrench,
  "clipboard-check": ClipboardCheck,
};

const LAST_REPORT_KEY = "qlcldv-last-report-key";
const QUICK_REPORT_KEYS = ["camera", "gps", "gstt"];

export default function HomePage() {
  const pageSettings = usePageSettings();
  const [copied, setCopied] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [lastReportKey, setLastReportKey] = useState("");
  const today = new Date();
  const weekend = today.getDay() === 0 || today.getDay() === 6;
  const week = getWeekInfo(today);

  useEffect(() => {
    try { setLastReportKey(window.localStorage.getItem(LAST_REPORT_KEY) || ""); }
    catch { setLastReportKey(""); }
  }, []);

  useEffect(() => {
    let active = true;
    getReportBoxes()
      .then(data => { if (active) setCards(data.filter(item => !item.hidden)); })
      .catch(() => toast.error("Không thể tải danh sách Box báo cáo"))
      .finally(() => { if (active) setLoadingCards(false); });
    return () => { active = false; };
  }, []);

  const lastReport = useMemo(
    () => cards.find(card => card.key === lastReportKey) || null,
    [cards, lastReportKey],
  );

  const quickReports = useMemo(
    () => QUICK_REPORT_KEYS.map(key => cards.find(card => card.key === key)).filter(Boolean),
    [cards],
  );

  const rememberReport = card => {
    try {
      window.localStorage.setItem(LAST_REPORT_KEY, card.key);
      setLastReportKey(card.key);
    } catch {
      // localStorage có thể bị chặn trong chế độ riêng tư; việc mở báo cáo vẫn tiếp tục.
    }
  };

  const copyWeek = async () => {
    try {
      await navigator.clipboard.writeText(week.copyText);
      setCopied(true);
      toast.success("Đã sao chép thông tin tuần");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Không thể sao chép. Vui lòng thử lại");
    }
  };

  const scrollToReports = () => {
    document.getElementById("report-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
    <div className="relative overflow-hidden rounded-[32px] border border-orange-100/80 bg-[linear-gradient(135deg,#fff_0%,#fffaf5_48%,#fff3df_100%)] shadow-[0_24px_80px_-42px_rgba(249,115,22,.45)] dark:border-slate-800 dark:bg-[linear-gradient(135deg,#0f172a_0%,#111827_52%,#24150f_100%)] dark:shadow-[0_24px_80px_-42px_rgba(0,0,0,.85)]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-700/10"/>
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-600/10"/>
      <div className="pointer-events-none absolute inset-0 opacity-[.22] dark:opacity-[.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(249,115,22,.32) 1px, transparent 0)", backgroundSize: "24px 24px" }}/>

      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.2fr_.8fr] lg:gap-7 lg:p-8 xl:p-10">
        <div className="flex min-h-[350px] flex-col justify-between rounded-[26px] border border-white/80 bg-white/72 p-6 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/45 sm:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-brand-600 dark:border-orange-900/70 dark:bg-orange-950/50 dark:text-orange-300">
              <Sparkles size={14}/>QLCL-DV Dashboard
            </span>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-[1.12] tracking-tight text-ink dark:text-white sm:text-4xl xl:text-[42px]">
              {weekend ? "Cuối tuần vui vẻ. " : "Chào bạn. "}
              Hôm nay là {formatDateVi(today)}, sẵn sàng bắt đầu báo cáo tuần.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Tổng hợp Camera, GPS, Tốc độ–4H, GSTT, Hậu kiểm và ATGT trong một không gian làm việc thống nhất, rõ ràng và dễ theo dõi.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                <CalendarRange size={15} className="text-brand-500"/>Hôm nay: {formatDateVi(today)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                <Clock3 size={15} className="text-blue-500"/>Tuần làm việc: {week.range}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Check size={15}/>Sẵn sàng xử lý báo cáo
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {lastReport
              ? <Link to={lastReport.route || `/bao-cao/${lastReport.slug}`} onClick={() => rememberReport(lastReport)} className="primary-button !h-12 !rounded-xl !px-5">
                  <Zap size={18}/>Mở báo cáo gần nhất<ArrowRight size={17}/>
                </Link>
              : <button type="button" onClick={scrollToReports} className="primary-button !h-12 !rounded-xl !px-5">
                  <Zap size={18}/>Bắt đầu làm báo cáo<ArrowRight size={17}/>
                </button>}
            <button type="button" onClick={scrollToReports} className="secondary-button !h-12 !rounded-xl !px-5">
              <Layers3 size={18}/>Xem tất cả báo cáo
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <button onClick={copyWeek} className="group relative overflow-hidden rounded-[24px] border border-orange-100 bg-white/90 p-5 text-left shadow-card backdrop-blur transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950/72 dark:hover:border-slate-600">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-brand-600 dark:bg-orange-950/50 dark:text-orange-300"><CalendarRange size={21}/></span>
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-orange-200 group-hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {copied ? <Check size={17} className="text-emerald-500"/> : <Copy size={17}/>}
              </span>
            </div>
            <span className="mt-5 block text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Tuần hiện tại</span>
            <strong className="mt-1.5 block text-xl leading-snug text-ink dark:text-white">{week.label}</strong>
            <span className="mt-2 block text-sm font-medium text-slate-500 dark:text-slate-400">{week.range}</span>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-orange-300">{copied ? "Đã sao chép" : "Nhấn để sao chép"}<ArrowRight size={14} className="transition group-hover:translate-x-0.5"/></span>
          </button>

          <div className="rounded-[24px] border border-slate-200 bg-white/88 p-5 shadow-card backdrop-blur dark:border-slate-700 dark:bg-slate-950/68">
            <div className="flex items-center justify-between gap-3">
              <div><span className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Tổng quan nhanh</span><h2 className="mt-1 text-base font-bold text-ink dark:text-white">Không gian làm việc</h2></div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><BarChart3 size={20}/></span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center dark:bg-slate-900"><b className="block text-lg text-ink dark:text-white">{loadingCards ? "—" : cards.length}</b><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Công cụ</span></div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center dark:bg-slate-900"><b className="block text-lg text-ink dark:text-white">2</b><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Chế độ</span></div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center dark:bg-slate-900"><ShieldCheck className="mx-auto text-emerald-500" size={20}/><span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Quản trị</span></div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Truy cập nhanh</span>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {quickReports.map(card => {
                  const Icon = ICONS[card.icon] || FileSpreadsheet;
                  return <Link key={card.key} to={card.route || `/bao-cao/${card.slug}`} onClick={() => rememberReport(card)} className="group flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-orange-300">
                    <Icon size={15} className="shrink-0"/><span className="truncate">{card.key === "camera" ? "Camera" : card.key === "gps" ? "GPS" : "GSTT"}</span>
                  </Link>;
                })}
                {!loadingCards && !quickReports.length && <span className="text-xs text-slate-400">Chưa có lối tắt đang hiển thị.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="report-list" className="mb-5 mt-12 scroll-mt-24"><h2 className="text-xl font-bold tracking-tight text-ink dark:text-white">Danh sách báo cáo</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chọn công cụ phù hợp để bắt đầu tổng hợp dữ liệu.</p></div>

    {loadingCards ? <div className="flex min-h-56 items-center justify-center"><LoaderCircle className="animate-spin text-brand-500" size={32}/></div> : cards.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card => {
      const Icon = ICONS[card.icon] || FileSpreadsheet;
      const body = <><span className={`grid h-12 w-12 place-items-center rounded-2xl ${REPORT_APPEARANCES[card.appearance] || REPORT_APPEARANCES.orange}`}><Icon size={25}/></span><h3 className="mt-6 text-lg font-bold text-ink dark:text-white">{card.title}</h3><p className="mt-2 min-h-11 text-sm leading-6 text-slate-500 dark:text-slate-400">{card.description}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-orange-300">Mở báo cáo <ArrowRight size={17} className="transition group-hover:translate-x-1"/></span></>;
      const className = "group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-black/20";
      return <Link key={card.id} className={className} to={card.route || `/bao-cao/${card.slug}`} onClick={() => rememberReport(card)}>{body}</Link>;
    })}</div> : <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 text-center dark:border-slate-700"><Clapperboard className="text-slate-300" size={42}/><b className="mt-3 text-slate-600 dark:text-slate-300">Chưa có Box báo cáo đang hiển thị</b></div>}

    {!pageSettings.getPage("blog")?.hidden && <div className="mt-8 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 px-6 py-7 shadow-card dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:px-8"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500 text-white"><BookOpenText size={24}/></span><div><span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.15em] text-orange-300"><Sparkles size={14}/>Góc chia sẻ</span><h2 className="mt-1.5 text-xl font-bold text-white">Blog Trick & Tool</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">Xem các mẹo Excel, xử lý dữ liệu và kinh nghiệm làm báo cáo từ đội ngũ QLCL-DV.</p></div></div><Link to={pageSettings.pathFor("blog")} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-900 transition hover:bg-orange-50">Xem bài viết <ArrowRight size={17}/></Link></div>}
  </section>;
}
