import { ChevronLeft, ChevronRight } from "lucide-react";

export const DEFAULT_PAGE_SIZE = 9;

export function pageItems(items, page, pageSize = DEFAULT_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  return { pageCount, safePage, items: items.slice((safePage - 1) * pageSize, safePage * pageSize) };
}

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(item => item === 1 || item === pageCount || Math.abs(item - page) <= 1);
  const controls = [];
  pages.forEach((item, index) => {
    if (index && item - pages[index - 1] > 1) controls.push(`gap-${item}`);
    controls.push(item);
  });
  return <nav className="flex flex-wrap items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-4 dark:border-slate-800" aria-label="Phân trang">
    <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước"><ChevronLeft size={17}/></button>
    {controls.map(item => typeof item === "string" ? <span key={item} className="px-1 text-slate-400">…</span> : <button type="button" key={item} onClick={() => onChange(item)} className={`h-9 min-w-9 rounded-lg px-2 text-xs font-bold transition ${page === item ? "bg-brand-500 text-white" : "border border-slate-200 text-slate-600 hover:border-orange-200 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"}`} aria-current={page === item ? "page" : undefined}>{item}</button>)}
    <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Trang sau"><ChevronRight size={17}/></button>
  </nav>;
}
