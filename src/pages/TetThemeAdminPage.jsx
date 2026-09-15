import { CalendarDays, Check, PartyPopper, Save, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useTetTheme } from "../TetThemeContext";
import { getCanChiYear, getVietnameseZodiac, normalizeTetYear } from "../utils/tet";

export default function TetThemeAdminPage() {
  const tet = useTetTheme();
  const [enabled, setEnabled] = useState(tet.enabled);
  const [year, setYear] = useState(String(tet.year));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(tet.enabled);
    setYear(String(tet.year));
  }, [tet.enabled, tet.year]);

  const numericYear = normalizeTetYear(year, tet.year);
  const zodiac = useMemo(() => getVietnameseZodiac(numericYear), [numericYear]);
  const canChi = useMemo(() => getCanChiYear(numericYear), [numericYear]);
  const dirty = enabled !== tet.enabled || numericYear !== tet.year;

  const save = async event => {
    event.preventDefault();
    const parsed = Number.parseInt(year, 10);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2200) return toast.warning("Năm Tết phải nằm trong khoảng 1900–2200");
    setSaving(true);
    try {
      await tet.save({ enabled, year: parsed });
      toast.success(enabled ? `Đã bật giao diện Tết ${parsed} – linh vật ${zodiac.name}` : "Đã tắt giao diện Tết");
    } catch (error) {
      toast.error(error.message || "Không thể lưu cấu hình giao diện Tết");
    } finally {
      setSaving(false);
    }
  };

  return <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <div className="overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-red-700 via-red-600 to-amber-500 p-6 text-white shadow-2xl shadow-red-200/40 dark:border-red-900 dark:from-red-950 dark:via-red-900 dark:to-amber-950 dark:shadow-none sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"><ShieldCheck size={15}/>Chỉ SuperAdmin</span><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Quản lý giao diện Tết Việt Nam</h1><p className="mt-3 max-w-xl text-sm leading-7 text-red-50/90">Bật hoặc tắt không khí Tết cho toàn hệ thống. Chỉ cần đổi năm, linh vật và Can Chi sẽ tự động cập nhật theo 12 con giáp Việt Nam.</p></div>
        <div className="grid min-w-48 place-items-center rounded-3xl border border-white/20 bg-white/10 px-8 py-6 text-center backdrop-blur"><span className="text-7xl drop-shadow-lg">{zodiac.emoji}</span><b className="mt-3 text-xl">{zodiac.name}</b><span className="mt-1 text-sm text-amber-100">{canChi} · {numericYear}</span></div>
      </div>
    </div>

    <form onSubmit={save} className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300"><PartyPopper size={22}/></span><div><h2 className="font-bold text-ink dark:text-white">Thiết lập giao diện Tết</h2><p className="mt-1 text-xs text-slate-500">Cấu hình được đồng bộ cho mọi tài khoản đang sử dụng hệ thống.</p></div></div>

        <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/60"><span><b className="block text-sm text-slate-800 dark:text-slate-100">Bật giao diện Tết</b><small className="mt-1 block text-xs leading-5 text-slate-400">Khi tắt, toàn bộ hệ thống trở về giao diện mặc định nhưng vẫn nhớ năm đã chọn.</small></span><span className="relative inline-flex h-7 w-12 shrink-0 items-center"><input type="checkbox" className="peer sr-only" checked={enabled} onChange={event => setEnabled(event.target.checked)}/><span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-red-600 dark:bg-slate-700 dark:peer-checked:bg-red-700"/><span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"/></span></label>

        <label className="mt-5 block"><span className="field-label"><CalendarDays size={17}/>Năm Tết</span><input className="field-input" type="number" min="1900" max="2200" step="1" value={year} onChange={event => setYear(event.target.value)} placeholder="2027"/><small className="mt-2 block text-xs leading-5 text-slate-400">Ví dụ: nhập <b>2027</b> hệ thống tự nhận diện <b>Đinh Mùi – Dê {getVietnameseZodiac(2027).emoji}</b>.</small></label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span className={`inline-flex items-center gap-2 text-xs font-semibold ${dirty ? "text-amber-600 dark:text-amber-300" : "text-emerald-600 dark:text-emerald-300"}`}>{dirty ? <Sparkles size={15}/> : <Check size={15}/>} {dirty ? "Có thay đổi chưa lưu" : "Cấu hình đã đồng bộ"}</span><button type="submit" className="primary-button" disabled={saving || !dirty}><Save size={18}/>{saving ? "Đang lưu..." : "Lưu cấu hình"}</button></div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50 to-red-50 p-6 shadow-card dark:border-amber-900/60 dark:from-amber-950/30 dark:to-red-950/30 sm:p-7">
        <div className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300"><Sparkles size={18}/>Xem trước</div>
        <div className="mt-5 overflow-hidden rounded-3xl border border-red-200 bg-white shadow-xl dark:border-red-900/60 dark:bg-slate-950">
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-500 px-5 py-3 text-center text-sm font-bold text-white">🌸 Chúc mừng năm mới {numericYear} 🌼</div>
          <div className="grid place-items-center px-6 py-8 text-center"><span className="text-8xl">{zodiac.emoji}</span><h3 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-300">Tết {canChi}</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Linh vật năm {numericYear}: <b>{zodiac.name}</b></p><div className="mt-5 flex gap-2"><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">Vạn sự như ý</span><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">An khang thịnh vượng</span></div></div>
        </div>
        <p className="mt-5 text-xs leading-6 text-slate-500 dark:text-slate-400">Giao diện thật sẽ phủ toàn hệ thống bằng nền đỏ–vàng nhẹ, đèn lồng, hoa mai/hoa đào, banner chúc Tết và huy hiệu linh vật. Dark mode dùng nền đỏ rượu vang và vàng trầm để không chói mắt.</p>
      </div>
    </form>
  </section>;
}
