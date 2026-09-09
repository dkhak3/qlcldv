import { ArrowLeft, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:py-32">
    <span className="grid h-20 w-20 place-items-center rounded-3xl bg-rose-50 text-rose-500"><FileQuestion size={40}/></span>
    <span className="mt-7 text-sm font-bold tracking-[.3em] text-brand-600">404</span>
    <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-5xl">Trang không tồn tại</h1>
    <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">Đường dẫn bạn vừa nhập không có trong hệ thống hoặc đã được thay đổi.</p>
    <Link to="/" className="primary-button mt-8"><ArrowLeft size={18}/>Quay lại trang chính</Link>
  </section>;
}
