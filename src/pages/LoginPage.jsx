import { useState } from "react";
import { ArrowLeft, BookOpenText, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import { SetupRequired } from "../components/ProtectedRoute";

function loginMessage(error) {
  const code = error?.code || "";
  if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password", "auth/invalid-email"].includes(code)) {
    return "Tên đăng nhập hoặc mật khẩu không đúng";
  }
  if (code === "auth/too-many-requests") return "Bạn thử quá nhiều lần. Vui lòng chờ một lúc rồi đăng nhập lại";
  return error?.message || "Không thể đăng nhập";
}

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  if (!auth.configured) return <SetupRequired/>;
  if (!auth.loading && auth.user) return <Navigate replace to="/"/>;

  const submit = async event => {
    event.preventDefault();
    if (!username.trim()) return toast.warning("Vui lòng nhập tên đăng nhập");
    if (!password) return toast.warning("Vui lòng nhập mật khẩu");
    setLoading(true);
    try {
      await auth.signIn(username, password);
      toast.success("Đăng nhập thành công");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(loginMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return <section className="mx-auto grid min-h-[calc(100vh-145px)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
    <div className="relative hidden min-h-[570px] overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-10 text-white shadow-soft lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl"/><div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl"/>
      <div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-orange-300"><Sparkles size={15}/> QLCL-DV Workspace</span><h1 className="mt-7 max-w-xl text-4xl font-bold leading-tight tracking-tight">Một nơi để làm báo cáo và chia sẻ kinh nghiệm.</h1><p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">Đăng nhập bằng tên tài khoản được cấp để quản lý Blog, người dùng và video hướng dẫn trên cloud.</p></div>
      <div className="relative grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><BookOpenText className="text-orange-300" size={22}/><b className="mt-3 block text-sm">Blog có hình ảnh</b></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><ShieldCheck className="text-emerald-300" size={22}/><b className="mt-3 block text-sm">Phân quyền rõ ràng</b></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><KeyRound className="text-blue-300" size={22}/><b className="mt-3 block text-sm">Đăng nhập bảo mật</b></div></div>
    </div>

    <div className="mx-auto w-full max-w-md">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-orange-300"><ArrowLeft size={17}/>Quay lại trang chính</Link>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-orange-50 text-brand-600 dark:bg-orange-950/50 dark:text-orange-300"><LockKeyhole size={25}/></span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink dark:text-white">Đăng nhập hệ thống</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Dùng tên đăng nhập và mật khẩu do Admin hoặc SuperAdmin cấp.</p>
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <label className="block"><span className="field-label"><UserRound size={17}/>Tên đăng nhập</span><input className="field-input" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Ví dụ: duykha"/></label>
          <label className="block"><span className="field-label"><KeyRound size={17}/>Mật khẩu</span><span className="relative block"><input className="field-input !pr-12" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Nhập mật khẩu"/><button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>
          <button className="primary-button w-full" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={18}/> : <LockKeyhole size={18}/>} {loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
        </form>
      </div>
      <p className="mt-5 text-center text-xs leading-5 text-slate-400">Không mở đăng ký công khai. Khi quên mật khẩu, hãy liên hệ người quản lý tài khoản.</p>
    </div>
  </section>;
}
