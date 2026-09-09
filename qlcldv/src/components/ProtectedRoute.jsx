import { LoaderCircle, LockKeyhole, ServerCog } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

export function ProtectedRoute({ roles, children }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.configured) return <SetupRequired/>;
  if (auth.loading) return <div className="flex min-h-[60vh] flex-col items-center justify-center text-slate-500"><LoaderCircle className="animate-spin text-brand-500" size={34}/><span className="mt-4 text-sm font-semibold">Đang kiểm tra phiên đăng nhập...</span></div>;
  if (!auth.user) return <Navigate replace to="/login" state={{ from: location.pathname }}/>;
  if (roles?.length && !roles.includes(auth.role)) return <AccessDenied/>;
  return children;
}

export function SetupRequired() {
  return <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28"><span className="grid h-20 w-20 place-items-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><ServerCog size={38}/></span><span className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-blue-600 dark:text-blue-300">Cần cấu hình một lần</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-ink dark:text-white">Chưa kết nối Firebase</h1><p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">Sao chép <b>.env.example</b> thành <b>.env.local</b>, điền cấu hình Firebase Web App rồi khởi động lại dự án. Hướng dẫn đầy đủ nằm trong file <b>FIREBASE_SETUP.md</b>.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link className="secondary-button" to="/blog">Xem Blog demo</Link><Link className="primary-button" to="/">Về trang chính</Link></div></section>;
}

function AccessDenied() {
  return <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"><LockKeyhole size={30}/></span><h1 className="mt-6 text-3xl font-bold text-ink dark:text-white">Bạn không có quyền truy cập</h1><p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">Tài khoản User chỉ được xem nội dung. Khu vực này dành cho Admin và SuperAdmin.</p><Link className="primary-button mt-7" to="/blog">Quay lại Blog</Link></section>;
}
