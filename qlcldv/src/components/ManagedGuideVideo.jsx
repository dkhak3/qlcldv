import { useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, Video } from "lucide-react";
import { getReportBoxByKey } from "../services/reportBoxService";
import { toGoogleDrivePreviewUrl } from "../utils/media";

export default function ManagedGuideVideo({ reportKey, description = "Cách chuẩn bị file và xuất báo cáo", minHeight = "min-h-72" }) {
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getReportBoxByKey(reportKey)
      .then(data => { if (active) setBox(data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reportKey]);

  const previewUrl = toGoogleDrivePreviewUrl(box?.videoUrl);
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-6">
    <div className="flex items-start gap-3 border-b border-slate-100 pb-5 dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"><Video size={20}/></span><div><h2 className="font-bold text-ink dark:text-white">Video hướng dẫn</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p></div></div>
    {loading ? <div className={`mt-5 flex ${minHeight} items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-950/60`}><LoaderCircle className="animate-spin" size={30}/></div> : previewUrl ? <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-slate-700"><iframe className="aspect-video w-full" src={previewUrl} title={`Video hướng dẫn ${box.title}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/><a href={box.videoUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 border-t border-white/10 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white">Mở video trên Google Drive <ExternalLink size={15}/></a></div> : <div className={`mt-5 flex ${minHeight} flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-500`}><Video size={38}/><span className="mt-3 text-sm font-medium">Video hướng dẫn sẽ được cập nhật</span></div>}
  </div>;
}
