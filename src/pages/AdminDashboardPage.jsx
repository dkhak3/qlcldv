import { useEffect, useState } from "react";
import { Activity, BookOpenText, Boxes, FileClock, FileSpreadsheet, LoaderCircle, PartyPopper, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import { useTetTheme } from "../TetThemeContext";
import { getAllBlogPosts } from "../services/blogService";
import { getReportBoxes } from "../services/reportBoxService";
import { getReportTemplates } from "../services/reportTemplateService";
import { getVisibleSavedReports } from "../services/savedReportService";
import { listManagedUsers } from "../services/userService";
import { getAuditLogs } from "../services/auditLogService";

const formatTime = value => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

export default function AdminDashboardPage() {
  const auth = useAuth();
  const tet = useTetTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [users, posts, savedReports, boxes, templates, logs] = await Promise.all([
          listManagedUsers(),
          getAllBlogPosts(),
          getVisibleSavedReports(auth),
          getReportBoxes(),
          getReportTemplates(),
          getAuditLogs(8),
        ]);
        if (active) setData({ users, posts, savedReports, boxes, templates, logs });
      } catch (error) {
        toast.error(error.message || "Không thể tải Dashboard quản trị");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  if (loading) return <section className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4"><div className="text-center text-slate-500"><LoaderCircle className="mx-auto animate-spin text-brand-500" size={34}/><p className="mt-3 text-sm">Đang tổng hợp dữ liệu hệ thống...</p></div></section>;

  const cards = [
    { label: "Tài khoản", value: data?.users.length || 0, icon: UsersRound, tone: "blue", href: "/admin/users" },
    { label: "Bài viết", value: data?.posts.length || 0, icon: BookOpenText, tone: "violet", href: "/admin/blog" },
    { label: "Báo cáo đã lưu", value: data?.savedReports.length || 0, icon: FileClock, tone: "emerald", href: "/bao-cao-da-luu" },
    { label: "Box báo cáo", value: data?.boxes.length || 0, icon: Boxes, tone: "amber", href: "/admin/report-boxes" },
    { label: "Template quản lý", value: data?.templates.filter(item => item.source === "firestore").length || 0, icon: FileSpreadsheet, tone: "rose", href: "/admin/report-templates" },
  ];
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  };

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-violet-600 dark:text-violet-300"><ShieldCheck size={16}/>SuperAdmin Center</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Tổng quan hệ thống</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Theo dõi nhanh người dùng, nội dung, báo cáo, template Excel và hoạt động quản trị gần nhất.</p></div>
      <div className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-amber-50 px-4 py-3 dark:border-red-900/50 dark:from-red-950/30 dark:to-amber-950/30"><span className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300"><PartyPopper size={16}/>Giao diện Tết: {tet.enabled ? `Đang bật · ${tet.year} · ${tet.zodiac.name}` : "Đang tắt"}</span></div>
    </div>

    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(card => <Link key={card.label} to={card.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[card.tone]}`}><card.icon size={20}/></span><strong className="mt-4 block text-3xl text-ink dark:text-white">{card.value}</strong><span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{card.label}</span></Link>)}</div>

    <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><h2 className="font-bold text-ink dark:text-white">Template Excel</h2><p className="mt-1 text-xs text-slate-500">Trạng thái mẫu báo cáo đang sử dụng</p></div><Link to="/admin/report-templates" className="text-xs font-bold text-brand-600">Quản lý</Link></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">{data?.templates.map(item => <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-3.5"><div className="min-w-0"><b className="block truncate text-sm text-slate-700 dark:text-slate-200">{item.label}</b><span className="mt-1 block truncate text-xs text-slate-400">{item.originalName || item.staticPath}</span></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${item.source === "firestore" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>{item.source === "firestore" ? "Quản lý" : "Mặc định"}</span></div>)}</div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><h2 className="flex items-center gap-2 font-bold text-ink dark:text-white"><Activity size={18}/>Hoạt động gần đây</h2><p className="mt-1 text-xs text-slate-500">Audit Log của thao tác quản trị</p></div><Link to="/admin/audit-logs" className="text-xs font-bold text-brand-600">Xem tất cả</Link></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">{data?.logs.length ? data.logs.map(log => <div key={log.id} className="px-5 py-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><b className="block truncate text-sm text-slate-700 dark:text-slate-200">{log.actorName}</b><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{log.label || log.entityType} · {log.action}</span></div><time className="shrink-0 text-[10px] text-slate-400">{formatTime(log.createdAt)}</time></div></div>) : <div className="px-5 py-10 text-center text-sm text-slate-400">Chưa có hoạt động quản trị được ghi lại.</div>}</div>
      </div>
    </div>
  </section>;
}
