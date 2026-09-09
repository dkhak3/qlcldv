import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookMarked, LoaderCircle, Search, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import BlogCover from "../components/BlogCover";
import ConfirmDialog from "../components/ConfirmDialog";
import NoData from "../components/NoData";
import Pagination, { pageItems } from "../components/Pagination";
import { deleteBlogBookmark, getBlogBookmarks } from "../services/blogInteractionService";
import { formatDateTimeVi } from "../utils/blog";

const PAGE_SIZE = 9;
const roleLabels = { user: "User", admin: "Admin", superadmin: "SuperAdmin" };
const roleStyles = {
  user: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  admin: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  superadmin: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
};

function bookmarkPost(item) {
  return {
    id: item.postId,
    slug: item.postSlug,
    title: item.postTitle || "Bài viết đã lưu",
    excerpt: item.postExcerpt || "",
    category: item.postCategory || "Khác",
    coverUrl: item.postCoverUrl || "",
  };
}

export default function SavedBlogPostsPage() {
  const auth = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const canManage = auth.role === "admin" || auth.role === "superadmin";

  useEffect(() => {
    let active = true;
    getBlogBookmarks(auth)
      .then(data => { if (active) setBookmarks(data); })
      .catch(error => { if (active) toast.error(error.message || "Không thể tải bài viết đã lưu"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth.role, auth.user?.uid]);

  const owners = useMemo(() => {
    const unique = new Map();
    bookmarks.forEach(item => unique.set(item.ownerId, { id: item.ownerId, name: item.ownerName, username: item.ownerUsername, role: item.ownerRole }));
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [bookmarks]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return bookmarks.filter(item => {
      const matchesOwner = owner === "all" || item.ownerId === owner;
      const searchable = `${item.postTitle} ${item.postCategory} ${item.ownerName} ${item.ownerUsername}`.toLocaleLowerCase("vi");
      return matchesOwner && (!keyword || searchable.includes(keyword));
    });
  }, [bookmarks, owner, query]);
  useEffect(() => setPage(1), [owner, query]);
  const paged = pageItems(filtered, page, PAGE_SIZE);

  const remove = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await deleteBlogBookmark(target.id);
      setBookmarks(current => current.filter(item => item.id !== target.id));
      setTarget(null);
      toast.success("Đã xóa bài viết khỏi danh sách lưu");
    } catch (error) { toast.error(error.message || "Không thể xóa bookmark"); }
    finally { setDeleting(false); }
  };

  return <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
    <div className="relative overflow-hidden rounded-[28px] border border-amber-100 bg-gradient-to-br from-white via-amber-50/60 to-orange-50 px-6 py-8 shadow-soft dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 sm:px-9 sm:py-10">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-700/10"/>
      <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-amber-600 dark:text-amber-300"><BookMarked size={17}/>Thư viện cá nhân</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">Bài viết đã lưu</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">{canManage ? "Xem và quản lý các bài viết đã được tài khoản trong phạm vi quyền của bạn đánh dấu." : "Những bài viết bạn đánh dấu sẽ được giữ tại đây để tìm và đọc lại nhanh chóng."}</p></div><span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-700 shadow-sm dark:bg-slate-800 dark:text-amber-300"><Bookmark fill="currentColor" size={17}/>{bookmarks.length} lượt lưu</span></div>
    </div>

    {canManage && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300"><ShieldCheck className="mt-0.5 shrink-0" size={18}/><p>{auth.role === "superadmin" ? "SuperAdmin có thể xem và xóa bookmark của mọi tài khoản." : "Admin có thể xem và xóa bookmark của User/Admin; bookmark của SuperAdmin không được tải về và không hiển thị."}</p></div>}

    <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
      <label className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="field-input !pl-11" value={query} onChange={event => setQuery(event.target.value)} placeholder={canManage ? "Tìm bài viết hoặc tài khoản..." : "Tìm tiêu đề hoặc chuyên mục..."}/></label>
      {canManage && <label className="relative sm:w-72"><UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><select className="field-input !pl-11" value={owner} onChange={event => setOwner(event.target.value)}><option value="all">Tất cả tài khoản</option>{owners.map(item => <option key={item.id} value={item.id}>{item.name} · {roleLabels[item.role] || "User"}</option>)}</select></label>}
    </div>

    {loading ? <div className="mt-7 flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><LoaderCircle className="animate-spin text-brand-500" size={34}/></div> : filtered.length ? <><div className="mt-7 grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">{paged.items.map(item => {
      const post = bookmarkPost(item);
      return <article key={item.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <Link to={`/blog/${post.slug}`}><BlogCover post={post} compact className="aspect-[16/9] w-full"/></Link>
        <div className="flex flex-1 flex-col p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-orange-950/50 dark:text-orange-300">{post.category}</span>{canManage && <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${roleStyles[item.ownerRole] || roleStyles.user}`}>{roleLabels[item.ownerRole] || "User"}</span>}</div><h2 className="mt-3 line-clamp-2 text-lg font-bold leading-7 text-ink dark:text-white"><Link to={`/blog/${post.slug}`} className="hover:text-brand-600 dark:hover:text-orange-300">{post.title}</Link></h2>{canManage && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300"><UserRound size={14}/><span className="truncate">{item.ownerName} {item.ownerUsername ? `(@${item.ownerUsername})` : ""}</span></p>}<time className="mt-2 text-[11px] text-slate-400">Đã lưu: {formatDateTimeVi(item.createdAt)}</time><div className="mt-auto grid grid-cols-[1fr_auto] gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><Link to={`/blog/${post.slug}`} className="primary-button !h-10">Đọc bài</Link><button type="button" title="Xóa khỏi danh sách lưu" onClick={() => setTarget(item)} className="secondary-button !h-10 !px-3 !text-rose-600"><Trash2 size={17}/></button></div></div>
      </article>;
    })}</div><div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Pagination page={paged.safePage} pageCount={paged.pageCount} onChange={setPage}/></div></> : <div className="mt-7"><NoData searched title="Chưa có bài viết đã lưu" description={query || owner !== "all" ? "Không có kết quả phù hợp với bộ lọc hiện tại." : "Bấm “Lưu bài viết” tại trang chi tiết Blog để thêm bài vào đây."}/></div>}
    {target && <ConfirmDialog danger title="Xóa khỏi Bài viết đã lưu?" description={`${target.ownerName} sẽ không còn thấy “${target.postTitle}” trong danh sách đã lưu.`} confirmLabel="Xóa bookmark" busy={deleting} onClose={() => setTarget(null)} onConfirm={remove}/>} 
  </section>;
}
