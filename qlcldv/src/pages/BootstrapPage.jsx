import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function BootstrapPage() {
  const [form, setForm] = useState({ fullName: "Nguyễn Hữu Duy Kha", username: "", password: "", setupSecret: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/bootstrap-superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-setup-secret": form.setupSecret },
        body: JSON.stringify({ fullName: form.fullName, username: form.username, password: form.password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Không thể khởi tạo SuperAdmin");
      setCompleted(true);
      toast.success("Đã tạo SuperAdmin đầu tiên");
    } catch (error) {
      toast.error(error.message || "Không thể khởi tạo SuperAdmin");
    } finally {
      setLoading(false);
    }
  };

  return <section className="mx-auto flex min-h-[calc(100vh-145px)] max-w-2xl items-center px-4 py-12 sm:px-6">
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-9">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">{completed ? <CheckCircle2 size={28}/> : <ShieldCheck size={28}/>}</span>
      <h1 className="mt-5 text-2xl font-bold text-ink dark:text-white">{completed ? "Khởi tạo hoàn tất" : "Tạo SuperAdmin đầu tiên"}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{completed ? "Tài khoản quản trị cao nhất đã sẵn sàng. Trang này sẽ tự khóa và không thể tạo SuperAdmin thứ hai." : "Chỉ sử dụng trang này một lần sau khi cài Firebase và biến môi trường trên Vercel."}</p>
      {completed ? <Link className="primary-button mt-7 w-full" to="/login"><KeyRound size={18}/>Đi đến trang đăng nhập</Link> : <form className="mt-7 space-y-5" onSubmit={submit}>
        <label className="block"><span className="field-label"><UserRound size={17}/>Họ và tên</span><input className="field-input" value={form.fullName} onChange={event => set("fullName", event.target.value)} required/></label>
        <label className="block"><span className="field-label"><UserRound size={17}/>Tên đăng nhập</span><input className="field-input" value={form.username} onChange={event => set("username", event.target.value)} placeholder="duykha" pattern="[a-z0-9._-]{3,32}" required/><small className="mt-1.5 block text-xs text-slate-400">Chữ thường không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.</small></label>
        <label className="block"><span className="field-label"><KeyRound size={17}/>Mật khẩu SuperAdmin</span><span className="relative block"><input className="field-input !pr-12" type={showPassword ? "text" : "password"} value={form.password} onChange={event => set("password", event.target.value)} minLength={10} required/><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>
        <label className="block"><span className="field-label"><ShieldCheck size={17}/>Mã thiết lập SETUP_SECRET</span><input className="field-input" type="password" value={form.setupSecret} onChange={event => set("setupSecret", event.target.value)} minLength={24} required/></label>
        <button className="primary-button w-full" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={18}/> : <ShieldCheck size={18}/>} {loading ? "Đang khởi tạo..." : "Tạo SuperAdmin"}</button>
      </form>}
    </div>
  </section>;
}
