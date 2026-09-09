import { useEffect } from "react";
import { Heart, X } from "lucide-react";
import { formatDateTimeVi } from "../utils/blog";

const roleLabels = { user: "User", admin: "Admin", superadmin: "SuperAdmin" };
const roleStyles = {
  user: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  admin: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  superadmin: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
};

export default function BlogPeopleDialog({ title, description, people = [], onClose }) {
  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <section className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900" onMouseDown={event => event.stopPropagation()}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div><h3 className="flex items-center gap-2 text-lg font-bold text-ink dark:text-white"><Heart className="text-rose-500" fill="currentColor" size={19}/>{title}</h3>{description && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>}</div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Đóng"><X size={18}/></button>
      </header>
      <div className="max-h-[55vh] space-y-2 overflow-y-auto p-4">
        {people.length ? people.map(person => <div key={person.id || person.ownerId} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-amber-400 text-sm font-black text-white">{String(person.ownerName || "N").charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="truncate text-sm text-slate-800 dark:text-white">{person.ownerName || "Người dùng QLCL-DV"}</b><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${roleStyles[person.ownerRole] || roleStyles.user}`}>{roleLabels[person.ownerRole] || "User"}</span></div>{person.ownerUsername && <span className="mt-0.5 block truncate text-[11px] text-slate-400">@{person.ownerUsername}</span>}{person.createdAt && <time className="mt-0.5 block text-[10px] text-slate-400">{formatDateTimeVi(person.createdAt)}</time>}</div>
        </div>) : <div className="py-10 text-center"><Heart className="mx-auto text-slate-300" size={32}/><p className="mt-3 text-sm font-semibold text-slate-500">Chưa có tài khoản nào</p></div>}
      </div>
    </section>
  </div>;
}
