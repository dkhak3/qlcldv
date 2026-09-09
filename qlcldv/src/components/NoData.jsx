import { Inbox } from "lucide-react";

export default function NoData({ searched = false, title = "No data", description = "" }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 text-center dark:border-slate-700 dark:bg-slate-950/60">
    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-800 dark:text-slate-500"><Inbox size={28}/></span>
    <h3 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-200">{title}</h3>
    <p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description || (searched ? "Không tìm thấy dữ liệu phù hợp trong khoảng ngày đã chọn." : "Chưa có dữ liệu. Hãy chọn file và nhấn Search để bắt đầu.")}</p>
  </div>;
}
