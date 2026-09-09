import { useEffect, useState } from "react";
import { ArrowUpRight, ExternalLink, FileSpreadsheet, ShieldCheck, Sparkles } from "lucide-react";
import ManagedGuideVideo from "../components/ManagedGuideVideo";
import { getReportBoxByKey } from "../services/reportBoxService";

const DEFAULT_TXDL_URL = "https://txdl-project.vercel.app/";

export default function TxdlPage() {
  const [externalUrl, setExternalUrl] = useState(DEFAULT_TXDL_URL);
  useEffect(() => {
    getReportBoxByKey("txdl").then(box => {
      if (box?.externalUrl) setExternalUrl(box.externalUrl);
    }).catch(() => {});
  }, []);

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="mx-auto mb-10 max-w-3xl text-center"><span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold tracking-[.16em] text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">BÁO CÁO TUẦN</span><h1 className="mt-4 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Báo cáo tuần TXDL</h1><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">Xem video hướng dẫn hoặc truy cập trực tiếp hệ thống TXDL để xử lý báo cáo.</p></div>
    <div className="grid items-stretch gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <ManagedGuideVideo reportKey="txdl" description="Cách sử dụng hệ thống Báo cáo tuần TXDL" minHeight="min-h-80"/>
      <article className="relative isolate overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-xl shadow-emerald-200/60 dark:border-emerald-800 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-900 dark:shadow-black/20 sm:p-8"><div className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-white/20 blur-3xl"/><div className="absolute -bottom-24 -left-16 -z-10 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl"/><span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/25 bg-white/15 shadow-lg backdrop-blur"><FileSpreadsheet size={28}/></span><div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide backdrop-blur"><Sparkles size={14}/> HỆ THỐNG TXDL</div><h2 className="mt-4 max-w-xl text-2xl font-bold leading-tight sm:text-3xl">Mở công cụ tổng hợp và xử lý dữ liệu</h2><p className="mt-3 max-w-xl text-sm leading-7 text-emerald-50/90">Trang TXDL được vận hành tại hệ thống riêng. Liên kết sẽ mở trong một tab mới để dữ liệu trên trang báo cáo hiện tại không bị mất.</p><div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-950/15 p-4 backdrop-blur"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15"><ShieldCheck size={21}/></span><span className="min-w-0"><small className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-100">Đường dẫn hệ thống</small><b className="mt-1 block truncate text-sm font-semibold">{externalUrl}</b></span></div><a href={externalUrl} target="_blank" rel="noreferrer" className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-5 text-sm font-bold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl dark:!bg-white dark:!text-emerald-800 dark:hover:!bg-emerald-50 sm:w-auto"><ExternalLink size={19}/>Truy cập Báo cáo TXDL<ArrowUpRight size={18} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></a></article>
    </div>
  </section>;
}
