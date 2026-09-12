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
    {donationHidden ? <div className="relative isolate overflow-hidden rounded-[36px] border border-amber-200/80 bg-[#fffaf0] shadow-[0_32px_90px_-52px_rgba(120,74,8,.45)] dark:border-amber-900/50 dark:bg-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"/>
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl dark:bg-amber-600/10"/>
      <div className="pointer-events-none absolute -bottom-32 -right-20 -z-10 h-80 w-80 rounded-full bg-orange-200/35 blur-3xl dark:bg-orange-700/10"/>

      <div className="grid items-stretch lg:grid-cols-[.82fr_1.18fr]">
        <div className="flex flex-col justify-between border-b border-amber-200/70 px-6 py-9 sm:px-9 sm:py-11 lg:border-b-0 lg:border-r lg:px-11 lg:py-12">
          <div>
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 shadow-lg shadow-amber-200/50 dark:shadow-none"><HeartHandshake size={26}/></span>
            <span className="mt-7 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.22em] text-amber-700 dark:text-amber-300"><Sparkles size={13}/>Một lời từ QLCL-DV</span>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-.035em] text-slate-950 dark:text-white sm:text-4xl">Xin phép tạm ẩn Donate</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">Phần tiếp nhận ủng hộ đang tạm dừng, nhưng mọi sự đồng hành của anh em vẫn luôn được trân trọng và ghi nhớ.</p>
          </div>
          <div className="mt-9 flex items-center gap-3 border-t border-amber-200/70 pt-5 dark:border-amber-900/50">
            <ShieldCheck className="shrink-0 text-amber-600 dark:text-amber-300" size={18}/>
            <span className="text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">Bảng Vàng Ủng Hộ vẫn được lưu giữ và hiển thị bên dưới.</span>
          </div>
        </div>

        <div className="p-5 sm:p-7 lg:p-9">
          <div className="relative flex h-full flex-col justify-center rounded-[28px] border border-white/90 bg-white/80 p-6 shadow-[0_24px_65px_-42px_rgba(120,74,8,.5)] backdrop-blur-sm dark:border-amber-900/40 dark:bg-slate-950/45 sm:p-8 lg:p-10">
            <span className="absolute right-7 top-5 text-6xl font-bold leading-none text-amber-200/70 dark:text-amber-700/20">“</span>
            <p className="relative text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-[15px]">Kha xin phép tạm ẩn phần nhận ủng hộ trong thời gian này. Cảm ơn tất cả anh em đã đón nhận QLCL-DV bằng rất nhiều sự tin tưởng, những lời động viên và những góp ý đầy tích cực. Mỗi tình cảm anh em dành cho dự án — dù là một lời chia sẻ hay một khoản ủng hộ — đều khiến mình thật sự biết ơn và có thêm động lực để tiếp tục hoàn thiện công cụ tốt hơn mỗi ngày.</p>
            <div className="mt-7 h-px w-full bg-gradient-to-r from-amber-300 via-amber-200 to-transparent dark:from-amber-700 dark:via-amber-900"/>
            <p className="mt-5 text-sm font-bold italic leading-7 text-amber-800 dark:text-amber-200">Trân trọng cảm ơn và biết ơn anh em đã luôn đồng hành cùng QLCL-DV. 💛</p>
            <span className="mt-3 text-[11px] font-semibold uppercase tracking-[.16em] text-slate-400">Nguyễn Hữu Duy Kha</span>
          </div>
        </div>
      </div>
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
