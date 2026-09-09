import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  HandCoins,
  Heart,
  HeartOff,
  Image as ImageIcon,
  Landmark,
  LoaderCircle,
  Plus,
  QrCode,
  Save,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination, { pageItems } from "../components/Pagination";
import { DONATION_METHODS, VIETNAM_BANKS, getDonationMethod } from "../data/donationMethods";
import { deleteDonationAccount, getDonationAccounts, getDonationSettings, saveDonationAccount, setDonationVisibility } from "../services/donationService";
import { uploadBlogImage } from "../services/blogService";

const emptyAccount = {
  methodType: "bank",
  bankName: "",
  accountNumber: "",
  accountName: "",
  branch: "",
  note: "",
  qrUrl: "",
  sortOrder: 99,
  hidden: false,
};

function MethodIcon({ type, size = 21 }) {
  if (type === "bank") return <Landmark size={size}/>;
  if (type === "paypal") return <CreditCard size={size}/>;
  if (type === "other") return <HandCoins size={size}/>;
  return <WalletCards size={size}/>;
}

function AccountEditor({ account, onClose, onSaved }) {
  const [form, setForm] = useState({ ...emptyAccount, ...(account || {}) });
  const [qrFile, setQrFile] = useState(null);
  const [removeQr, setRemoveQr] = useState(false);
  const [busy, setBusy] = useState(false);
  const method = getDonationMethod(form.methodType);
  const previewUrl = useMemo(() => qrFile ? URL.createObjectURL(qrFile) : removeQr ? "" : form.qrUrl, [form.qrUrl, qrFile, removeQr]);

  useEffect(() => () => { if (qrFile && previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl, qrFile]);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const save = async event => {
    event.preventDefault();
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountName.trim()) {
      toast.warning(`Vui lòng nhập đủ ${method.providerLabel.toLowerCase()}, ${method.accountLabel.toLowerCase()} và tên người nhận`);
      return;
    }
    setBusy(true);
    try {
      const qrUrl = qrFile ? await uploadBlogImage(qrFile) : removeQr ? "" : form.qrUrl;
      await onSaved(await saveDonationAccount({ ...form, qrUrl }));
    } catch (error) {
      toast.error(error.message || "Không thể lưu phương thức Donate");
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <form onSubmit={save} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div><h2 className="text-lg font-bold text-ink dark:text-white">{account ? "Sửa phương thức Donate" : "Thêm phương thức Donate"}</h2><p className="mt-1 text-xs text-slate-400">Mỗi phương thức có thể dùng ảnh QR riêng.</p></div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={19}/></button>
      </div>
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="field-label"><WalletCards size={17}/>Hình thức nhận Donate</span><select className="field-input" value={form.methodType} onChange={event => set("methodType", event.target.value)}>{DONATION_METHODS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label><span className="field-label">{method.providerLabel}</span><input className="field-input" list={form.methodType === "bank" ? "vietnam-banks" : undefined} value={form.bankName} onChange={event => set("bankName", event.target.value)} placeholder={form.methodType === "bank" ? "Ví dụ: Vietcombank" : method.label}/>{form.methodType === "bank" && <datalist id="vietnam-banks">{VIETNAM_BANKS.map(bank => <option key={bank} value={bank}/>)}</datalist>}</label>
        <label><span className="field-label">{method.accountLabel}</span><input className="field-input" value={form.accountNumber} onChange={event => set("accountNumber", event.target.value)} placeholder={form.methodType === "paypal" ? "email@example.com" : "Nhập thông tin nhận tiền"}/></label>
        <label><span className="field-label">Tên người nhận</span><input className="field-input" value={form.accountName} onChange={event => set("accountName", event.target.value)} placeholder="NGUYEN HUU DUY KHA"/></label>
        <label><span className="field-label">Chi nhánh / mô tả ngắn</span><input className="field-input" value={form.branch} onChange={event => set("branch", event.target.value)} placeholder="Không bắt buộc"/></label>
        <label><span className="field-label">Thứ tự hiển thị</span><input className="field-input" type="number" min="1" value={form.sortOrder} onChange={event => set("sortOrder", Number(event.target.value))}/></label>
        <label className="sm:col-span-2"><span className="field-label">Ghi chú chuyển khoản</span><textarea className="field-input !h-24 !py-3" value={form.note} onChange={event => set("note", event.target.value)} placeholder="Ví dụ: QLCLDV + tên của bạn"/></label>
        <label className="sm:col-span-2"><span className="field-label"><ImageIcon size={17}/>Ảnh QR (không bắt buộc)</span><input className="field-input !py-3" type="file" accept="image/*" onChange={event => { setQrFile(event.target.files?.[0] || null); setRemoveQr(false); }}/></label>
        {previewUrl && <div className="flex flex-col items-start gap-3 sm:col-span-2 sm:flex-row sm:items-center"><div className="grid h-44 w-44 place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"><img className="max-h-full max-w-full rounded-xl object-contain" src={previewUrl} alt="QR preview"/></div><button type="button" className="secondary-button !h-10 !text-rose-600" onClick={() => { setQrFile(null); setRemoveQr(true); }}><Trash2 size={16}/>Bỏ ảnh QR</button></div>}
        <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" checked={form.hidden} onChange={event => set("hidden", event.target.checked)} className="h-4 w-4 accent-orange-500"/><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ẩn phương thức này khỏi trang Donate</span></label>
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17}/> : <Save size={17}/>}Lưu phương thức</button></div>
    </form>
  </div>;
}

export default function DonationAdminPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(undefined);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [donationSettings, setDonationSettings] = useState({ hidden: false });
  const [visibilityDialog, setVisibilityDialog] = useState(false);
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    const [accountsResult, settingsResult] = await Promise.allSettled([
      getDonationAccounts(),
      getDonationSettings(),
    ]);
    if (accountsResult.status === "fulfilled") setAccounts(accountsResult.value);
    else toast.error(accountsResult.reason?.message || "Không thể tải các phương thức Donate");
    if (settingsResult.status === "fulfilled") setDonationSettings(settingsResult.value);
    else toast.error(settingsResult.reason?.message || "Không thể tải trạng thái Donate");
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const paged = pageItems(accounts, page, 8);

  const remove = async () => {
    setBusy(true);
    try {
      await deleteDonationAccount(target.id);
      setAccounts(current => current.filter(item => item.id !== target.id));
      setTarget(null);
      toast.success("Đã xóa phương thức Donate");
    } catch (error) {
      toast.error(error.message || "Không thể xóa");
    } finally {
      setBusy(false);
    }
  };

  const toggleDonationVisibility = async () => {
    setVisibilityBusy(true);
    try {
      const nextSettings = await setDonationVisibility(!donationSettings.hidden);
      setDonationSettings(current => ({ ...current, ...nextSettings }));
      setVisibilityDialog(false);
      toast.success(nextSettings.hidden ? "Đã ẩn lời kêu gọi và phương thức ủng hộ" : "Đã hiển thị lại Donate");
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật trạng thái Donate");
    } finally {
      setVisibilityBusy(false);
    }
  };

  return <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-rose-600 dark:text-rose-300"><HandCoins size={16}/>SuperAdmin</span><h1 className="mt-3 text-3xl font-bold text-ink dark:text-white">Quản lý Donate</h1><p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Quản lý nhiều ngân hàng, ví điện tử và mã QR. Bạn có thể sắp xếp hoặc ẩn từng phương thức.</p></div><button className="primary-button" onClick={() => setEditor(null)}><Plus size={18}/>Thêm phương thức</button></div>
    <div className={`mt-7 overflow-hidden rounded-3xl border p-5 shadow-card sm:p-6 ${donationSettings.hidden ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-orange-950/20" : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-900/60 dark:from-emerald-950/30 dark:to-teal-950/20"}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${donationSettings.hidden ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"}`}>{donationSettings.hidden ? <HeartOff size={23}/> : <Heart size={23}/>}</span>
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-ink dark:text-white">Trạng thái nhận Donate</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${donationSettings.hidden ? "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200" : "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200"}`}>{donationSettings.hidden ? "Đang tạm ẩn" : "Đang hiển thị"}</span></div><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{donationSettings.hidden ? "Lời kêu gọi, tài khoản và mã QR đang được ẩn. Trang Donate chỉ hiển thị lời tri ân và Bảng Vàng Ủng Hộ." : "Lời kêu gọi cùng các phương thức ủng hộ đang hiển thị bình thường. Bảng Vàng luôn được giữ lại để trân trọng ghi nhận anh em đã đồng hành."}</p></div>
        </div>
        <button type="button" onClick={() => setVisibilityDialog(true)} className={`secondary-button shrink-0 ${donationSettings.hidden ? "!border-emerald-300 !text-emerald-700 dark:!border-emerald-800 dark:!text-emerald-300" : "!border-amber-300 !text-amber-700 dark:!border-amber-800 dark:!text-amber-300"}`}>{donationSettings.hidden ? <Eye size={17}/> : <EyeOff size={17}/>} {donationSettings.hidden ? "Hiện Donate" : "Ẩn Donate"}</button>
      </div>
    </div>
    <div className="mt-7 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50 p-4 text-sm text-slate-600 dark:border-rose-950/60 dark:from-rose-950/30 dark:to-orange-950/20 dark:text-slate-300"><span className="inline-flex items-center gap-2 font-bold text-rose-600 dark:text-rose-300"><QrCode size={18}/>Gợi ý</span><p className="mt-1 leading-6">Có thể thêm nhiều tài khoản cùng ngân hàng hoặc nhiều ví khác nhau. Mục có thứ tự nhỏ hơn sẽ được hiển thị trước.</p></div>
    {loading ? <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="animate-spin" size={34}/></div> : accounts.length ? <div className="mt-7 grid gap-5 md:grid-cols-2">{paged.items.map(account => { const method = getDonationMethod(account.methodType); return <article key={account.id} className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 ${account.hidden ? "opacity-60" : ""}`}><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"><MethodIcon type={account.methodType}/></span><span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">{account.hidden ? <EyeOff size={14}/> : <Eye size={14}/>} {account.hidden ? "Đang ẩn" : "Đang hiện"}</span></div><span className="mt-4 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">{method.label}</span><h2 className="mt-2 font-bold text-ink dark:text-white">{account.bankName}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{method.accountLabel}: <b>{account.accountNumber}</b></p><p className="mt-1 text-xs text-slate-400">Người nhận: {account.accountName}{account.branch ? ` · ${account.branch}` : ""}</p><div className="mt-5 grid grid-cols-2 gap-2"><button className="secondary-button !h-10" onClick={() => setEditor(account)}><Edit3 size={16}/>Sửa</button><button className="secondary-button !h-10 !text-rose-600" onClick={() => setTarget(account)}><Trash2 size={16}/>Xóa</button></div></article>; })}</div> : <div className="mt-7 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700"><HandCoins className="mx-auto text-slate-300" size={38}/><h2 className="mt-4 font-bold text-slate-700 dark:text-slate-200">Chưa có phương thức Donate</h2><p className="mt-2 text-sm text-slate-400">Nhấn “Thêm phương thức” để tạo tài khoản nhận ủng hộ đầu tiên.</p></div>}
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/></div>
    {editor !== undefined && <AccountEditor account={editor} onClose={() => setEditor(undefined)} onSaved={saved => { setAccounts(current => (editor ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved]).sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99))); setEditor(undefined); toast.success("Đã lưu phương thức Donate"); }}/>} 
    {target && <ConfirmDialog danger title="Xóa phương thức Donate?" description={`${target.bankName} – ${target.accountNumber} sẽ bị xóa.`} confirmLabel="Xóa" busy={busy} onClose={() => setTarget(null)} onConfirm={remove}/>} 
    {visibilityDialog && <ConfirmDialog danger={!donationSettings.hidden} title={donationSettings.hidden ? "Hiển thị lại Donate?" : "Tạm ẩn Donate?"} description={donationSettings.hidden ? "Lời kêu gọi, phương thức chuyển khoản và mã QR sẽ xuất hiện trở lại trên trang Donate." : "Lời kêu gọi, phương thức chuyển khoản và mã QR sẽ được ẩn. Lời tri ân cùng Bảng Vàng Ủng Hộ vẫn tiếp tục hiển thị."} confirmLabel={donationSettings.hidden ? "Hiện Donate" : "Ẩn Donate"} busy={visibilityBusy} onClose={() => setVisibilityDialog(false)} onConfirm={toggleDonationVisibility}/>} 
  </section>;
}
