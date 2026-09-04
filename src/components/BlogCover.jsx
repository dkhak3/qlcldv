import { BookOpenText, FileSpreadsheet, Gauge, Lightbulb, Sparkles } from "lucide-react";
import { blogCategoryStyles } from "../utils/blog";

const icons = {
  Excel: FileSpreadsheet,
  "Dữ liệu": Gauge,
  "Quy trình": BookOpenText,
  "Báo cáo": Sparkles,
  "Năng suất": Lightbulb,
};

export default function BlogCover({ post, compact = false, className = "" }) {
  const Icon = icons[post.category] || Lightbulb;
  const gradient = blogCategoryStyles[post.category] || "from-slate-500 to-slate-700";

  if (post.coverUrl) return <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
    <img src={post.coverUrl} alt={`Ảnh bìa: ${post.title}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading={compact ? "lazy" : "eager"}/>
    {!compact && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent p-6 pt-24 sm:p-8"><span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-white ring-1 ring-white/20 backdrop-blur">Trick & Tool</span><p className="mt-3 max-w-2xl text-lg font-bold leading-snug text-white drop-shadow sm:text-xl">{post.title}</p></div>}
  </div>;

  return <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
    <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[28px] border-white/10" />
    <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    <div className={`relative flex h-full flex-col justify-between ${compact ? "p-4" : "p-6 sm:p-8"}`}>
      <span className={`${compact ? "h-10 w-10 rounded-xl" : "h-14 w-14 rounded-2xl"} grid place-items-center bg-white/15 text-white ring-1 ring-white/20 backdrop-blur`}><Icon size={compact ? 20 : 27}/></span>
      {!compact && <div><span className="inline-flex rounded-full bg-slate-950/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-white/90 backdrop-blur">Trick & Tool</span><p className="mt-3 max-w-md text-lg font-bold leading-snug text-white sm:text-xl">{post.title}</p></div>}
    </div>
  </div>;
}
