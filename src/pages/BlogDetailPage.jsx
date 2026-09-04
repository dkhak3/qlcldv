import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, BookOpenText, CalendarDays, Clock3, Eye, LoaderCircle, PlayCircle, Tag, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import BlogCover from "../components/BlogCover";
import BlogPostCard from "../components/BlogPostCard";
import { getBlogPostBySlug, getPublicBlogPosts, incrementBlogViews } from "../services/blogService";
import { setBlogPosts } from "../store";
import { formatBlogDate } from "../utils/blog";
import { toGoogleDrivePreviewUrl } from "../utils/media";

function ArticleContent({ content }) {
  return <div className="space-y-5 text-[15px] leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
    {content.split("\n").filter(line => line.trim()).map((line, index) => {
      if (line.startsWith("## ")) return <h2 key={index} className="!mb-2 !mt-9 text-xl font-bold tracking-tight text-ink dark:text-white sm:text-2xl">{line.slice(3)}</h2>;
      if (line.startsWith("- ")) return <div key={index} className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"/><span>{line.slice(2)}</span></div>;
      return <p key={index}>{line}</p>;
    })}
  </div>;
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const auth = useAuth();
  const posts = useSelector(state => state.blog.posts);
  const [remotePost, setRemotePost] = useState(null);
  const [loading, setLoading] = useState(auth.configured);
  const [loaded, setLoaded] = useState(!auth.configured);
  const localPost = posts.find(item => item.slug === slug);
  const post = auth.configured ? remotePost : localPost;
  const visiblePost = post && (post.status === "published" || auth.canManageBlog);
  const related = useMemo(() => posts.filter(item => item.status === "published" && item.id !== post?.id && item.category === post?.category).slice(0, 3), [post, posts]);

  useEffect(() => {
    if (!auth.configured || auth.loading) return undefined;
    let active = true;
    setLoading(true);
    Promise.all([getBlogPostBySlug(slug, auth.canManageBlog), getPublicBlogPosts()])
      .then(([foundPost, publicPosts]) => {
        if (!active) return;
        setRemotePost(foundPost);
        dispatch(setBlogPosts(publicPosts));
        if (foundPost?.status === "published") incrementBlogViews(foundPost.id).catch(() => {});
      })
      .catch(() => { if (active) setRemotePost(null); })
      .finally(() => { if (active) { setLoading(false); setLoaded(true); } });
    return () => { active = false; };
  }, [auth.canManageBlog, auth.configured, auth.loading, dispatch, slug]);

  if (loading || !loaded) return <div className="flex min-h-[65vh] flex-col items-center justify-center text-slate-500"><LoaderCircle className="animate-spin text-brand-500" size={36}/><span className="mt-4 text-sm font-semibold">Đang tải bài viết...</span></div>;
  if (!visiblePost) return <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-brand-600"><BookOpenText size={30}/></span><h1 className="mt-6 text-3xl font-bold text-ink dark:text-white">Không tìm thấy bài viết</h1><p className="mt-3 text-sm leading-7 text-slate-500">Bài viết chưa được xuất bản hoặc đường dẫn đã thay đổi.</p><Link className="primary-button mt-7" to="/blog"><ArrowLeft size={18}/>Quay lại Blog</Link></section>;

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-orange-300"><ArrowLeft size={17}/>Quay lại Blog</Link>
    <article className="mx-auto mt-7 max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <BlogCover post={post} className="min-h-[300px] sm:min-h-[420px]" />
      <div className="px-6 py-8 sm:px-12 sm:py-12 lg:px-16">
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-orange-950/50 dark:text-orange-300">{post.category}</span>{post.status === "draft" && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">Bản nháp – chỉ quản trị viên thấy</span>}</div>
        <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-ink dark:text-white sm:text-4xl">{post.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400 sm:text-lg">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-y border-slate-100 py-5 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400"><span className="flex items-center gap-1.5"><UserRound size={15}/>{post.author}</span><span className="flex items-center gap-1.5"><CalendarDays size={15}/>{formatBlogDate(post.publishedAt || post.createdAt)}</span><span className="flex items-center gap-1.5"><Clock3 size={15}/>{post.readTime} phút đọc</span><span className="flex items-center gap-1.5"><Eye size={15}/>{post.views} lượt xem</span></div>
        {toGoogleDrivePreviewUrl(post.videoUrl) && <div className="mt-9 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-card dark:border-slate-700"><div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300"><PlayCircle size={16}/>Video trong bài viết</div><iframe className="aspect-video w-full bg-black" src={toGoogleDrivePreviewUrl(post.videoUrl)} title={`Video ${post.title}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div>}
        <div className="mt-9"><ArticleContent content={post.content}/></div>
        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6 dark:border-slate-800"><Tag className="mr-1 text-slate-400" size={17}/>{post.tags.map(tag => <span key={tag} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">#{tag}</span>)}</div>
      </div>
    </article>
    {related.length > 0 && <div className="mx-auto mt-12 max-w-5xl"><h2 className="text-xl font-bold text-ink dark:text-white">Bài viết cùng chủ đề</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map(item => <BlogPostCard key={item.id} post={item}/>)}</div></div>}
  </section>;
}
