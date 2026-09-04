import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";

export default function UpdatePasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async event => {
    event.preventDefault();
    if (password.length < 8) return toast.warning("Mật khẩu phải có ít nhất 8 ký tự");
    if (password !== confirm) return toast.warning("Mật khẩu xác nhận chưa khớp");
    setLoading(true);
    try { await auth.updatePassword(password); toast.success("Đã cập nhật mật khẩu"); navigate("/", { replace: true }); }
    catch (error) { toast.error(error.message || "Không thể cập nhật mật khẩu"); }
    finally { setLoading(false); }
  };
  return <section className="mx-auto flex min-h-[65vh] max-w-lg items-center px-4 py-12"><div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-8"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"><CheckCircle2 size={28}/></span><h1 className="mt-5 text-2xl font-bold text-ink dark:text-white">Tạo mật khẩu mới</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Mật khẩu mới cần có ít nhất 8 ký tự.</p><form onSubmit={submit} className="mt-7 space-y-5"><label className="block"><span className="field-label"><KeyRound size={17}/>Mật khẩu mới</span><span className="relative block"><input className="field-input !pr-12" type={show ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)}/><button type="button" onClick={() => setShow(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label><label className="block"><span className="field-label">Xác nhận mật khẩu</span><input className="field-input" type={show ? "text" : "password"} value={confirm} onChange={event => setConfirm(event.target.value)}/></label><button className="primary-button w-full" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}Cập nhật mật khẩu</button></form></div></section>;
}

