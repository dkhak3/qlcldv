import { useEffect, useState } from "react";
import { Check, Copy, CreditCard, HandCoins, Heart, HeartHandshake, Landmark, LoaderCircle, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { toast } from "react-toastify";
import NoData from "../components/NoData";
import TopDonateSection from "../components/TopDonateSection";
import { getDonationMethod } from "../data/donationMethods";
import { getDonationAccounts, getDonationSettings } from "../services/donationService";

function MethodIcon({ type }) {
  if (type === "bank") return <Landmark size={23}/>;
  if (type === "paypal") return <CreditCard size={23}/>;
  if (type === "other") return <HandCoins size={23}/>;
  return <WalletCards size={23}/>;
}

export default function DonatePage() {
  const [accounts, setAccounts] = useState([]);
  const [donationHidden, setDonationHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    Promise.allSettled([getDonationAccounts(), getDonationSettings()])
      .then(([accountsResult, settingsResult]) => {
        if (accountsResult.status === "fulfilled") setAccounts(accountsResult.value.filter(item => !item.hidden));
        else toast.error(accountsResult.reason?.message || "Không thể tải thông tin Donate");

        if (settingsResult.status === "fulfilled") setDonationHidden(settingsResult.value.hidden);
        else toast.error(settingsResult.reason?.message || "Không thể tải trạng thái Donate");
      })
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

  if (loading) return <section className="mx-auto flex min-h-[65vh] max-w-6xl items-center justify-center px-4"><LoaderCircle className="animate-spin text-amber-500" size={38}/></section>;

  return <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    {donationHidden ? <div className="relative overflow-hidden rounded-[32px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-6 py-11 text-center shadow-soft dark:border-amber-900/50 dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 sm:px-12 sm:py-14">
      <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-600/10"/>
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-700/10"/>
      <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border border-amber-200 bg-white text-amber-600 shadow-lg shadow-amber-100 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300 dark:shadow-none"><HeartHandshake size={29}/></span>
      <span className="relative mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.22em] text-amber-700 dark:text-amber-300"><Sparkles size={13}/>Một lời từ QLCL-DV</span>
      <h1 className="relative mt-3 font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Xin phép tạm ẩn Donate</h1>
      <div className="relative mx-auto mt-5 h-px w-28 bg-gradient-to-r from-transparent via-amber-500 to-transparent"/>
      <p className="relative mx-auto mt-6 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">Kha xin phép tạm ẩn phần nhận ủng hộ trong thời gian này. Cảm ơn tất cả anh em đã đón nhận QLCL-DV bằng rất nhiều sự tin tưởng, những lời động viên và những góp ý đầy tích cực. Mỗi tình cảm anh em dành cho dự án — dù là một lời chia sẻ hay một khoản ủng hộ — đều khiến mình thật sự biết ơn và có thêm động lực để tiếp tục hoàn thiện công cụ tốt hơn mỗi ngày.</p>
      <p className="relative mx-auto mt-5 max-w-2xl font-serif text-base font-bold italic leading-7 text-amber-800 dark:text-amber-200">Trân trọng cảm ơn và biết ơn anh em đã luôn đồng hành cùng QLCL-DV. 💛</p>
    </div> : <div className="relative overflow-hidden rounded-[30px] border border-rose-100 bg-gradient-to-br from-white via-rose-50/70 to-orange-50 px-6 py-10 text-center shadow-soft dark:border-slate-800 dark:from-slate-900 dark:via-rose-950/20 dark:to-orange-950/20 sm:px-10 sm:py-14">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose-200/30 blur-3xl dark:bg-rose-700/10"/>
      <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none"><Heart fill="currentColor" size={25}/></span>
      <h1 className="relative mt-5 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Ủng hộ dự án QLCL-DV</h1>
      <p className="relative mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">Nếu công cụ giúp bạn tiết kiệm thời gian, một khoản ủng hộ nhỏ sẽ là động lực để Nguyễn Hữu Duy Kha tiếp tục duy trì và phát triển miễn phí.</p>
      <span className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm dark:bg-slate-900/70 dark:text-slate-300"><ShieldCheck size={15} className="text-emerald-500"/>Hãy kiểm tra đúng tên người nhận trước khi chuyển khoản</span>
    </div>}

    <TopDonateSection/>

    {!donationHidden && <><div className="mt-10"><span className="text-xs font-bold uppercase tracking-[.17em] text-rose-500">Thông tin chuyển khoản</span><h2 className="mt-2 text-2xl font-bold text-ink dark:text-white">Phương thức ủng hộ</h2></div>
    {accounts.length ? <div className="mt-5 grid gap-5 md:grid-cols-2">{accounts.map(account => {
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
    })}</div> : <div className="mt-8"><NoData searched title="Chưa có phương thức Donate" description="SuperAdmin chưa thêm thông tin nhận ủng hộ."/></div>}</>}
  </section>;
}
