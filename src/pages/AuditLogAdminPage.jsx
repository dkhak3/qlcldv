import { useEffect, useMemo, useState } from "react";
import { Activity, LoaderCircle, Search, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { AUDIT_ACTION_LABELS, getAuditLogs } from "../services/auditLogService";
import Pagination, { pageItems } from "../components/Pagination";

const formatDateTime = value => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value)) : "—";

export default function AuditLogAdminPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getAuditLogs(300).then(setLogs).catch(error => toast.error(error.message || "Không thể tải Audit Log")).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const key = keyword.trim().toLocaleLowerCase("vi");
    if (!key) return logs;
    return logs.filter(log => `${log.actorName} ${log.actorUsername} ${log.action} ${log.entityType} ${log.label}`.toLocaleLowerCase("vi").includes(key));
  }, [keyword, logs]);
  useEffect(() => setPage(1), [keyword]);
  const paged = pageItems(filtered, page, 15);

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-violet-600 dark:text-violet-300"><ShieldCheck size={16}/>SuperAdmin</span>
    <h1 className="mt-3 text-3xl font-bold text-ink dark:text-white">Nhật ký hoạt động</h1>
    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Theo dõi các thay đổi quản trị quan trọng. Nhật ký chỉ đọc và không thể chỉnh sửa từ giao diện.</p>

    <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5"><label className="relative block max-w-lg"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="field-input !pl-11" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="Tìm người thao tác, chức năng, đối tượng..."/></label></div>
      {loading ? <div className="grid min-h-72 place-items-center"><LoaderCircle className="animate-spin text-brand-500" size={32}/></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/70"><tr><th className="px-5 py-3.5">Thời gian</th><th className="px-4 py-3.5">Người thao tác</th><th className="px-4 py-3.5">Hành động</th><th className="px-4 py-3.5">Đối tượng</th><th className="px-5 py-3.5">Chi tiết</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{paged.items.map(log => <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"><td className="px-5 py-4 text-xs text-slate-500">{formatDateTime(log.createdAt)}</td><td className="px-4 py-4"><b className="block text-slate-700 dark:text-slate-200">{log.actorName}</b><span className="text-xs text-slate-400">@{log.actorUsername} · {log.actorRole}</span></td><td className="px-4 py-4"><span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{AUDIT_ACTION_LABELS[log.action] || log.action}</span></td><td className="px-4 py-4"><b className="block text-slate-700 dark:text-slate-200">{log.label || log.entityType}</b><span className="text-xs text-slate-400">{log.entityType}{log.entityId ? ` · ${log.entityId}` : ""}</span></td><td className="max-w-md px-5 py-4 text-xs leading-5 text-slate-500">{Object.entries(log.details || {}).map(([key, value]) => <span key={key} className="mr-2 inline-block"><b>{key}:</b> {String(value)}</span>)}</td></tr>)}</tbody></table>{!filtered.length && <div className="grid min-h-56 place-items-center text-sm text-slate-400"><div className="text-center"><Activity className="mx-auto mb-3" size={36}/>Chưa có dữ liệu phù hợp</div></div>}</div>}
      {!loading && <Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/>}
    </div>
  </section>;
}
