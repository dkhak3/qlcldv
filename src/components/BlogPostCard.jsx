import { ArrowUpRight, CalendarDays, Clock3, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBlogDate } from "../utils/blog";
import BlogCover from "./BlogCover";
import BlogAuthorLink from "./BlogAuthorLink";

export default function BlogPostCard({ post }) {
  return <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
    <Link to={`/blog/${post.slug}`} className="block" aria-label={`Đọc bài ${post.title}`}>
      <BlogCover post={post} compact className="aspect-[16/9] w-full" />
    </Link>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:bg-orange-950/50 dark:text-orange-300">{post.category}</span>
      <h2 className="mt-3 line-clamp-2 text-lg font-bold leading-7 text-ink dark:text-white"><Link className="transition hover:text-brand-600 dark:hover:text-orange-300" to={`/blog/${post.slug}`}>{post.title}</Link></h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{post.excerpt}</p>
      <BlogAuthorLink post={post} className="mt-4 inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><UserRound className="shrink-0" size={14}/><span className="truncate">{post.author}</span></BlogAuthorLink>
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        <span className="flex items-center gap-1.5"><CalendarDays size={14}/>{formatBlogDate(post.createdAt)}</span>
        <span className="flex items-center gap-1.5"><Clock3 size={14}/>{post.readTime} phút đọc</span>
      </div>
      <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-orange-300" to={`/blog/${post.slug}`}>Đọc bài viết <ArrowUpRight className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={17}/></Link>
    </div>
  </article>;
}
