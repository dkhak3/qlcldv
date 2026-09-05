import { useEffect, useState } from "react";
import { Check, Copy, CreditCard, HandCoins, Heart, Landmark, LoaderCircle, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "react-toastify";
import NoData from "../components/NoData";
import TopDonateSection from "../components/TopDonateSection";
import { getDonationMethod } from "../data/donationMethods";
import { getDonationAccounts } from "../services/donationService";

function MethodIcon({ type }) {
  if (type === "bank") return <Landmark size={23}/>;
  if (type === "paypal") return <CreditCard size={23}/>;
  if (type === "other") return <HandCoins size={23}/>;
  return <WalletCards size={23}/>;
}

export default function DonatePage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    getDonationAccounts()
      .then(data => setAccounts(data.filter(item => !item.hidden)))
      .catch(error => toast.error(error.message || "Không thể tải thông tin Donate"))
      .finally(() => setLoading(false));
  }, []);

  const copy = async account => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(account.id);
      toast.success(`Đã sao chép ${getDonationMethod(account.methodType).accountLabel.toLowerCase()}`);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      toast.error("Không thể sao chép thông tin nhận Donate");
    }
  };

  return <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="relative overflow-hidden rounded-[30px] border border-rose-100 bg-gradient-to-br from-white via-rose-50/70 to-orange-50 px-6 py-10 text-center shadow-soft dark:border-slate-800 dark:from-slate-900 dark:via-rose-950/20 dark:to-orange-950/20 sm:px-10 sm:py-14">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose-200/30 blur-3xl dark:bg-rose-700/10"/>
      <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none"><Heart fill="currentColor" size={25}/></span>
      <h1 className="relative mt-5 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Ủng hộ dự án QLCL-DV</h1>
      <p className="relative mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">Nếu công cụ giúp bạn tiết kiệm thời gian, một khoản ủng hộ nhỏ sẽ là động lực để Nguyễn Hữu Duy Kha tiếp tục duy trì và phát triển miễn phí.</p>
      <span className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm dark:bg-slate-900/70 dark:text-slate-300"><ShieldCheck size={15} className="text-emerald-500"/>Hãy kiểm tra đúng tên người nhận trước khi chuyển khoản</span>
    </div>

    <TopDonateSection/>

    <div className="mt-10"><span className="text-xs font-bold uppercase tracking-[.17em] text-rose-500">Thông tin chuyển khoản</span><h2 className="mt-2 text-2xl font-bold text-ink dark:text-white">Phương thức ủng hộ</h2></div>
    {loading ? <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="animate-spin text-rose-500" size={34}/></div> : accounts.length ? <div className="mt-5 grid gap-5 md:grid-cols-2">{accounts.map(account => {
      const method = getDonationMethod(account.methodType);
      return <article key={account.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4 p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"><MethodIcon type={account.methodType}/></span>
          <div className="min-w-0"><span className="text-xs font-bold uppercase tracking-wider text-rose-500">{method.label}</span><h2 className="mt-1 text-xl font-bold text-ink dark:text-white">{account.bankName}</h2><p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Người nhận: <b className="text-slate-700 dark:text-slate-200">{account.accountName}</b></p>{account.branch && <p className="mt-1 text-xs text-slate-400">{account.branch}</p>}</div>
        </div>
        {account.qrUrl && <div className="mx-6 mb-5 grid place-items-center rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"><img src={account.qrUrl} alt={`Mã QR ${account.bankName}`} className="max-h-64 rounded-xl object-contain"/></div>}
        <button type="button" onClick={() => copy(account)} className="flex w-full items-center justify-between border-t border-slate-100 px-6 py-4 text-left transition hover:bg-rose-50/60 dark:border-slate-800 dark:hover:bg-rose-950/20"><span><small className="block text-xs text-slate-400">{method.accountLabel}</small><b className="mt-1 block break-all tracking-wider text-slate-800 dark:text-white">{account.accountNumber}</b></span>{copied === account.id ? <Check className="shrink-0 text-emerald-500" size={21}/> : <Copy className="shrink-0 text-rose-500" size={20}/>}</button>
        {account.note && <p className="border-t border-slate-100 px-6 py-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400"><b className="text-slate-600 dark:text-slate-300">Nội dung/Ghi chú:</b> {account.note}</p>}
      </article>;
    })}</div> : <div className="mt-8"><NoData searched title="Chưa có phương thức Donate" description="SuperAdmin chưa thêm thông tin nhận ủng hộ."/></div>}
  </section>;
}
