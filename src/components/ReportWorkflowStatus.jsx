import { CalendarCheck2, CheckCircle2, FileCheck2, SearchCheck, UserCheck } from "lucide-react";

export default function ReportWorkflowStatus({ files = [], startDate, endDate, employees, hasData, processing }) {
  const steps = [
    { label: "File", ok: files.length > 0 && files.every(Boolean), icon: FileCheck2 },
    { label: "Thời gian", ok: Boolean(startDate && endDate && startDate <= endDate), icon: CalendarCheck2 },
    { label: "Nhân viên", ok: Boolean(String(employees || "").trim()), icon: UserCheck },
    { label: hasData ? "Hoàn tất" : processing ? "Đang xử lý" : "Kết quả", ok: Boolean(hasData), icon: hasData ? CheckCircle2 : SearchCheck },
  ];
  return <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{steps.map(({ label, ok, icon: Icon }, index) => <div key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${ok ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300" : processing && index === 3 ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300" : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950/40"}`}><Icon size={16}/><span>{index + 1}. {label}</span></div>)}</div>;
}
