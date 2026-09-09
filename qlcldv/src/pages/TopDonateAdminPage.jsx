import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Edit3, Eye, EyeOff, HandHeart, LoaderCircle, Plus, Save, Search, Trash2, Trophy, X } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination, { pageItems } from "../components/Pagination";
import { deleteTopDonate, getTopDonates, rankTopDonates, saveTopDonate, setTopDonateVisibility, sortTopDonates } from "../services/topDonateService";

const PAGE_SIZE = 8;
const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function localDateTime(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const emptyDonate = {
  donorName: "",
  amount: "",
  message: "",
  donatedAt: localDateTime(),
  hidden: false,
};

function DonateEditor({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item ? { ...item, donatedAt: localDateTime(item.donatedAt) } : { ...emptyDonate, donatedAt: localDateTime() });
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      const saved = await saveTopDonate(form);
      onSaved(saved);
      toast.success(item ? "Đã cập nhật người Donate" : "Đã thêm người Donate");
    } catch (error) {
      toast.error(error.message || "Không thể lưu Top Donate");
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800"><div><h2 className="text-lg font-bold text-ink dark:text-white">{item ? "Sửa Top Donate" : "Thêm Top Donate"}</h2><p className="mt-1 text-xs text-slate-400">Thứ hạng được tự động sắp xếp theo số tiền.</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={19}/></button></div>
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <label><span className="field-label"><HandHeart size={17}/>Tên người Donate</span><input autoFocus className="field-input" value={form.donorName} onChange={event => set("donorName", event.target.value)} placeholder="Ví dụ: Nguyễn Văn A"/></label>
        <label><span className="field-label">Số tiền (VNĐ)</span><input className="field-input" type="number" min="1000" step="1000" value={form.amount} onChange={event => set("amount", event.target.value)} placeholder="100000"/></label>
        <label className="sm:col-span-2"><span className="field-label"><CalendarDays size={17}/>Thời gian Donate</span><input className="field-input" type="datetime-local" value={form.donatedAt} onChange={event => set("donatedAt", event.target.value)}/></label>
        <label className="sm:col-span-2"><span className="field-label">Lời nhắn</span><textarea className="field-input !h-28 !py-3" maxLength="250" value={form.message} onChange={event => set("message", event.target.value)} placeholder="Lời nhắn ngắn, không bắt buộc"/><small className="mt-1 block text-right text-xs text-slate-400">{form.message.length}/250</small></label>
        <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" checked={form.hidden} onChange={event => set("hidden", event.target.checked)} className="h-4 w-4 accent-orange-500"/><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ẩn người này khỏi trang Donate</span></label>
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17}/> : <Save size={17}/>}Lưu</button></div>
    </form>
  </div>;
}

export default function TopDonateAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(undefined);
  const [target, setTarget] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getTopDonates({ includeHidden: true })
      .then(setItems)
      .catch(error => toast.error(error.message || "Không thể tải Top Donate"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => setPage(1), [keyword]);

  const rankedItems = useMemo(() => rankTopDonates(items), [items]);
  const filtered = useMemo(() => {
    const search = keyword.trim().toLocaleLowerCase("vi");
    if (!search) return rankedItems;
    return rankedItems.filter(item => `${item.donorName} ${item.message}`.toLocaleLowerCase("vi").includes(search));
  }, [rankedItems, keyword]);
  const paged = pageItems(filtered, page, PAGE_SIZE);
  const visibleCount = items.filter(item => !item.hidden).length;
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const toggleVisibility = async item => {
    setBusyId(item.id);
    try {
      const updated = await setTopDonateVisibility(item, !item.hidden);
      setItems(current => current.map(currentItem => currentItem.id === item.id ? updated : currentItem));
      toast.success(updated.hidden ? "Đã ẩn khỏi Top Donate" : "Đã hiển thị trên Top Donate");
    } catch (error) {
      toast.error(error.message || "Không thể đổi trạng thái");
    } finally {
      setBusyId("");
    }
  };

  const remove = async () => {
    if (!target) return;
    setBusyId(target.id);
    try {
      await deleteTopDonate(target.id);
      setItems(current => current.filter(item => item.id !== target.id));
      setTarget(null);
      toast.success("Đã xóa khỏi Top Donate");
    } catch (error) {
      toast.error(error.message || "Không thể xóa");
    } finally {
      setBusyId("");
    }
  };

  return <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-amber-600 dark:text-amber-300"><Trophy size={16}/>Admin &amp; SuperAdmin</span><h1 className="mt-3 text-3xl font-bold text-ink dark:text-white">Quản lý Top Donate</h1><p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Thêm, chỉnh sửa, ẩn/hiện và xóa người Donate. Bảng tự sắp theo số tiền; người ủng hộ cùng số tiền sẽ cùng hạng.</p></div><button className="primary-button" onClick={() => setEditor(null)}><Plus size={18}/>Thêm người Donate</button></div>

    <div className="mt-7 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-bold uppercase text-slate-400">Tổng người Donate</span><b className="mt-2 block text-3xl text-ink dark:text-white">{items.length}</b></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-950 dark:bg-emerald-950/30"><span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-300">Đang hiển thị</span><b className="mt-2 block text-3xl text-emerald-700 dark:text-emerald-300">{visibleCount}</b></div><div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-950 dark:bg-amber-950/30"><span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-300">Tổng ủng hộ</span><b className="mt-2 block text-xl text-amber-700 dark:text-amber-300">{currencyFormatter.format(totalAmount)}</b></div></div>

    <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 p-4 dark:border-slate-800"><label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="field-input !pl-10" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="Tìm tên hoặc lời nhắn..."/></label></div>
      {loading ? <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="animate-spin text-orange-500" size={34}/></div> : paged.items.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{paged.items.map(item => <article key={item.id} className={`grid gap-4 p-5 lg:grid-cols-[52px_1fr_170px_210px] lg:items-center ${item.hidden ? "opacity-60" : ""}`}><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-sm font-black text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">#{item.rank}</span><div className="min-w-0"><h2 className="truncate font-bold text-ink dark:text-white">{item.donorName}</h2><p className="mt-1 font-bold text-orange-600 dark:text-orange-300">{currencyFormatter.format(item.amount)}</p>{item.message && <p className="mt-1 truncate text-xs text-slate-400">{item.message}</p>}</div><div className="text-sm text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5"><CalendarDays size={15}/>{item.donatedAt ? new Date(item.donatedAt).toLocaleString("vi-VN") : "—"}</span><span className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${item.hidden ? "text-slate-400" : "text-emerald-500"}`}>{item.hidden ? <EyeOff size={14}/> : <Eye size={14}/>} {item.hidden ? "Đang ẩn" : "Đang hiện"}</span></div><div className="grid grid-cols-3 gap-2"><button title={item.hidden ? "Hiện" : "Ẩn"} disabled={busyId === item.id} className="secondary-button !h-10 !px-2" onClick={() => toggleVisibility(item)}>{busyId === item.id ? <LoaderCircle className="animate-spin" size={16}/> : item.hidden ? <Eye size={16}/> : <EyeOff size={16}/>}</button><button title="Sửa" className="secondary-button !h-10 !px-2" onClick={() => setEditor(item)}><Edit3 size={16}/></button><button title="Xóa" className="secondary-button !h-10 !px-2 !text-rose-600" onClick={() => setTarget(item)}><Trash2 size={16}/></button></div></article>)}</div> : <div className="px-6 py-16 text-center"><Trophy className="mx-auto text-slate-300" size={42}/><h2 className="mt-4 font-bold text-slate-700 dark:text-slate-200">Không tìm thấy dữ liệu</h2></div>}
      <Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/>
    </div>

    {editor !== undefined && <DonateEditor item={editor} onClose={() => setEditor(undefined)} onSaved={saved => { setItems(current => sortTopDonates(editor ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved])); setEditor(undefined); }}/>} 
    {target && <ConfirmDialog danger title="Xóa khỏi Top Donate?" description={`${target.donorName} – ${currencyFormatter.format(target.amount)} sẽ bị xóa vĩnh viễn.`} confirmLabel="Xóa" busy={busyId === target.id} onClose={() => setTarget(null)} onConfirm={remove}/>} 
  </section>;
}
