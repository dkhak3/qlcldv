import { useEffect, useState } from "react";
import { BookOpenText, FileSpreadsheet, Gauge, ImageOff, Lightbulb, Sparkles } from "lucide-react";
import { blogCategoryStyles } from "../utils/blog";

const icons = {
  Excel: FileSpreadsheet,
  "Dữ liệu": Gauge,
  "Quy trình": BookOpenText,
  "Báo cáo": Sparkles,
  "Năng suất": Lightbulb,
};

export default function BlogCover({ post, compact = false, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = icons[post.category] || Lightbulb;
  const gradient = blogCategoryStyles[post.category] || "from-slate-500 to-slate-700";
  const hasImage = Boolean(post.coverUrl) && !imageFailed;

  useEffect(() => setImageFailed(false), [post.coverUrl]);

  if (hasImage) return <div className={`relative isolate overflow-hidden bg-slate-900 ${className}`}>
    <img aria-hidden="true" src={post.coverUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-2xl"/>
    <div className="absolute inset-0 bg-slate-950/15"/>
    <img src={post.coverUrl} alt={`Ảnh bìa: ${post.title}`} onError={() => setImageFailed(true)} className="relative h-full w-full object-contain transition duration-500 group-hover:scale-[1.015]" loading={compact ? "lazy" : "eager"} decoding="async"/>
    {!compact && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent p-6 pt-24 sm:p-8"><span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-white ring-1 ring-white/20 backdrop-blur">Trick &amp; Tool</span><p className="mt-3 max-w-2xl text-lg font-bold leading-snug text-white drop-shadow sm:text-xl">{post.title}</p></div>}
  </div>;

  return <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
    <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[28px] border-white/10" />
    <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    <div className={`relative flex h-full flex-col justify-between ${compact ? "p-4" : "p-6 sm:p-8"}`}>
      <span className={`${compact ? "h-10 w-10 rounded-xl" : "h-14 w-14 rounded-2xl"} grid place-items-center bg-white/15 text-white ring-1 ring-white/20 backdrop-blur`}>{imageFailed ? <ImageOff size={compact ? 20 : 27}/> : <Icon size={compact ? 20 : 27}/>}</span>
      {compact ? <div><span className="text-[9px] font-black uppercase tracking-[.2em] text-white/70">QLCL-DV</span><p className="mt-1 line-clamp-2 text-xs font-bold leading-4 text-white">{post.title}</p></div> : <div><span className="inline-flex rounded-full bg-slate-950/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-white/90 backdrop-blur">{imageFailed ? "Ảnh bìa đang tạm lỗi" : "Trick & Tool"}</span><p className="mt-3 max-w-md text-lg font-bold leading-snug text-white sm:text-xl">{post.title}</p></div>}
    </div>
  </div>;
}
