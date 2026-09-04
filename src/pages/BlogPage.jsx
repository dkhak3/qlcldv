import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, BookOpenText, Database, LoaderCircle, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import BlogCover from "../components/BlogCover";
import BlogPostCard from "../components/BlogPostCard";
import NoData from "../components/NoData";
import Pagination, { pageItems } from "../components/Pagination";
import { getPublicBlogPosts } from "../services/blogService";
import { setBlogError, setBlogLoading, setBlogPosts } from "../store";
import { formatBlogDate } from "../utils/blog";

export default function BlogPage() {
  const dispatch = useDispatch();
  const { posts, loading, source, error } = useSelector(state => state.blog);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    dispatch(setBlogLoading(true));
    getPublicBlogPosts()
      .then(data => { if (active) dispatch(setBlogPosts(data)); })
      .catch(fetchError => { if (active) dispatch(setBlogError(fetchError.message || "Không thể tải Blog")); })
      .finally(() => { if (active) dispatch(setBlogLoading(false)); });
    return () => { active = false; };
  }, [dispatch]);

  const publishedPosts = useMemo(() => posts.filter(post => post.status === "published").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [posts]);
  const categories = useMemo(() => ["Tất cả", ...new Set(publishedPosts.map(post => post.category))], [publishedPosts]);
  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return publishedPosts.filter(post => {
      const matchesCategory = category === "Tất cả" || post.category === category;
      const searchable = `${post.title} ${post.excerpt} ${post.tags.join(" ")}`.toLocaleLowerCase("vi");
      return matchesCategory && (!keyword || searchable.includes(keyword));
    });
  }, [category, publishedPosts, query]);
  useEffect(() => setPage(1), [category, query]);
  const paged = pageItems(filteredPosts, page, 9);
  const featured = publishedPosts.find(post => post.featured) || publishedPosts[0];

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="relative overflow-hidden rounded-[28px] border border-orange-100 bg-gradient-to-br from-white via-orange-50/60 to-amber-50 px-6 py-9 shadow-soft dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/30 sm:px-10 sm:py-12">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-700/10" />
      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-brand-600 dark:border-orange-900/70 dark:bg-slate-950/70 dark:text-orange-300"><Sparkles size={15}/> Góc chia sẻ</span><h1 className="mt-4 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-5xl">Blog Trick & Tool</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">Mẹo sử dụng công cụ, xử lý dữ liệu và kinh nghiệm làm báo cáo dành cho anh em QLCL-DV.</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-400"><Database size={14}/>{source === "database" ? "Nội dung được đồng bộ từ Firebase" : "Đang hiển thị dữ liệu mẫu – kết nối Firebase để đồng bộ"}</span></div>
      </div>
    </div>

    {error && <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">Không thể đồng bộ Blog: {error}</div>}

    {loading ? <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900"><LoaderCircle className="animate-spin text-brand-500" size={34}/><span className="mt-4 text-sm font-semibold">Đang tải bài viết...</span></div> : <>
      {featured && <article className="mt-8 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1.05fr_.95fr]">
        <BlogCover post={featured} className="min-h-72 lg:min-h-[360px]" />
        <div className="flex flex-col justify-center p-6 sm:p-9"><span className="text-xs font-bold uppercase tracking-[.18em] text-brand-600 dark:text-orange-300">Bài viết nổi bật</span><h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink dark:text-white sm:text-3xl">{featured.title}</h2><p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">{featured.excerpt}</p><div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400"><span>{formatBlogDate(featured.createdAt)}</span><span>•</span><span>{featured.readTime} phút đọc</span><span>•</span><span>{featured.author}</span></div><Link className="primary-button mt-7 w-fit" to={`/blog/${featured.slug}`}>Đọc ngay <ArrowRight size={18}/></Link></div>
      </article>}

      <div className="mt-12 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-ink dark:text-white"><BookOpenText className="text-brand-500" size={22}/>Bài viết mới</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chọn chủ đề hoặc tìm nhanh nội dung bạn cần.</p></div>
        <label className="relative block w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="field-input !pl-11" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm bài viết, chủ đề..."/></label>
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{categories.map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${category === item ? "border-brand-500 bg-brand-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>{item}</button>)}</div>
      <div className="mt-6">{filteredPosts.length ? <><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{paged.items.map(post => <BlogPostCard key={post.id} post={post}/>)}</div><div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/></div></> : <NoData searched title="Không tìm thấy bài viết" description="Thử đổi từ khóa hoặc chọn một chuyên mục khác."/>}</div>
    </>}
  </section>;
}
