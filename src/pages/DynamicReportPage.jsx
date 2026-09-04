import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, FileSpreadsheet, LoaderCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import ManagedGuideVideo from "../components/ManagedGuideVideo";
import { getReportBoxBySlug } from "../services/reportBoxService";
import CameraPage from "./CameraPage";
import GpsPage from "./GpsPage";
import TxdlPage from "./TxdlPage";
import Speed4hPage from "./Speed4hPage";
import GsttPage from "./GsttPage";

const SYSTEM_PAGES = { camera: CameraPage, gps: GpsPage, txdl: TxdlPage, "speed-4h": Speed4hPage, gstt: GsttPage };

export default function DynamicReportPage() {
  const { slug } = useParams();
  const auth = useAuth();
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getReportBoxBySlug(slug).then(data => { if (active) setBox(data); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);
  if (loading) return <div className="flex min-h-[65vh] items-center justify-center"><LoaderCircle className="animate-spin text-brand-500" size={36}/></div>;
  if (!box || (box.hidden && !auth.canManageReports)) return <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center"><FileSpreadsheet className="text-slate-300" size={56}/><h1 className="mt-5 text-3xl font-bold text-ink dark:text-white">Không tìm thấy báo cáo</h1><p className="mt-3 text-sm text-slate-500">Box báo cáo đã bị ẩn hoặc đường dẫn không tồn tại.</p><Link className="primary-button mt-7" to="/"><ArrowLeft size={18}/>Về trang chính</Link></section>;
  const SystemPage = SYSTEM_PAGES[box.key];
  if (SystemPage) return <SystemPage/>;
  return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"><Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600"><ArrowLeft size={17}/>Quay lại trang chính</Link><div className="mt-7 text-center"><span className="inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold tracking-[.16em] text-brand-600 dark:bg-orange-950/50 dark:text-orange-300">BÁO CÁO TUẦN</span><h1 className="mt-4 text-3xl font-bold text-ink dark:text-white sm:text-4xl">{box.title}</h1><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">{box.description}</p></div><div className="mx-auto mt-9 max-w-3xl"><ManagedGuideVideo reportKey={box.key} description={`Video hướng dẫn ${box.title}`} minHeight="min-h-80"/></div>{box.externalUrl && <div className="mt-6 text-center"><a href={box.externalUrl} target="_blank" rel="noreferrer" className="primary-button"><ExternalLink size={18}/>Mở công cụ báo cáo</a></div>}</section>;
}
