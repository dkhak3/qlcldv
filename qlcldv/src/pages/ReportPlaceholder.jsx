import { Construction } from "lucide-react";

export default function ReportPlaceholder({ title, description }) {
  return <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-28 text-center sm:px-6">
    <span className="grid h-20 w-20 place-items-center rounded-3xl bg-orange-50 text-brand-500"><Construction size={38}/></span>
    <span className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-brand-600">Đang phát triển</span>
    <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
    <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">{description}</p>
  </section>;
}
