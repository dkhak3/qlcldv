import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpenText, LoaderCircle, Search, ShieldCheck, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import BlogPostCard from "../components/BlogPostCard";
import NoData from "../components/NoData";
import Pagination, { pageItems } from "../components/Pagination";
import { getPublicBlogPosts } from "../services/blogService";
import { getPublicProfile } from "../services/publicProfileService";

const roleLabels = { admin: "Admin", superadmin: "SuperAdmin", user: "User" };
const roleStyles = {
  admin: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
  superadmin: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  user: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
};

export default function AuthorBlogPage() {
  const { authorId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    Promise.all([getPublicProfile(authorId), getPublicBlogPosts()])
      .then(([nextProfile, allPosts]) => {
        if (!active) return;
        setProfile(nextProfile);
        setPosts(allPosts.filter(post => post.authorId === authorId));
      })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authorId]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return posts.filter(post => !keyword || `${post.title} ${post.excerpt} ${post.category} ${post.tags.join(" ")}`.toLocaleLowerCase("vi").includes(keyword));
  }, [posts, query]);
  useEffect(() => setPage(1), [query]);
  const paged = pageItems(filtered, page, 9);

  if (loading) return <div className="flex min-h-[65vh] flex-col items-center justify-center text-slate-500"><LoaderCircle className="animate-spin text-brand-500" size={36}/><span className="mt-4 text-sm font-semibold">Đang tải trang tác giả...</span></div>;
  if (failed || !profile) return <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><UserRound size={30}/></span><h1 className="mt-6 text-3xl font-bold text-ink dark:text-white">Không tìm thấy tác giả</h1><p className="mt-3 text-sm leading-7 text-slate-500">Tài khoản này không còn tồn tại hoặc thông tin tác giả chưa sẵn sàng.</p><Link className="primary-button mt-7" to="/blog"><ArrowLeft size={18}/>Quay lại Blog</Link></section>;

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-orange-300"><ArrowLeft size={17}/>Quay lại Blog</Link>
    <div className="relative mt-6 overflow-hidden rounded-[30px] border border-orange-100 bg-gradient-to-br from-white via-orange-50/70 to-amber-50 px-6 py-9 shadow-soft dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/30 sm:px-10 sm:py-11">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-700/10"/>
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-amber-400 text-3xl font-black text-white shadow-lg shadow-orange-200/60 dark:shadow-none">{profile.fullName.charAt(0).toUpperCase()}</span>
        <div className="min-w-0"><span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] ${roleStyles[profile.role] || roleStyles.user}`}><ShieldCheck size={13}/>{roleLabels[profile.role] || "User"}</span><h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">{profile.fullName}</h1><p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><BookOpenText size={17}/>{posts.length} bài viết đã xuất bản</p></div>
      </div>
    </div>

    {profile.role !== "user" && posts.length > 0 && <label className="relative mt-8 block w-full sm:max-w-md"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="field-input !pl-11" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Tìm bài viết của ${profile.fullName}...`}/></label>}

    <div className="mt-7">
      {profile.role === "user" ? <NoData title="Tài khoản User không có bài viết" description="User chỉ được đọc, bình luận và lưu nội dung nên không có trang bài viết tác giả."/>
        : filtered.length ? <><div className="grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">{paged.items.map(post => <BlogPostCard key={post.id} post={post}/>)}</div><div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/></div></>
          : <NoData searched={Boolean(query)} title={query ? "Không tìm thấy bài viết" : "Tác giả chưa có bài viết"} description={query ? "Không có bài viết nào phù hợp với từ khóa đang tìm." : `${profile.fullName} chưa xuất bản bài viết nào. Khi có bài mới, nội dung sẽ hiển thị tại đây.`}/>} 
    </div>
  </section>;
}
