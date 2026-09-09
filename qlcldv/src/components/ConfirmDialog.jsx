import { AlertTriangle, LoaderCircle, X } from "lucide-react";

export default function ConfirmDialog({ title, description, confirmLabel = "Xác nhận", busy = false, danger = false, onClose, onConfirm }) {
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${danger ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300" : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"}`}><AlertTriangle size={23}/></span><button type="button" onClick={onClose} disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={19}/></button></div>
      <h2 className="mt-5 text-xl font-bold text-ink dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Hủy</button><button type="button" onClick={onConfirm} disabled={busy} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition disabled:opacity-50 ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-500 hover:bg-brand-600"}`}>{busy && <LoaderCircle className="animate-spin" size={17}/>} {confirmLabel}</button></div>
    </div>
  </div>;
}
