import { useEffect, useState } from "react";
import { Bookmark, BookMarked, Heart, LoaderCircle, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import { usePageSettings } from "../PageSettingsContext";
import { getPostInteractions, toggleBlogBookmark, toggleBlogPostLike } from "../services/blogInteractionService";
import BlogPeopleDialog from "./BlogPeopleDialog";

export default function BlogEngagementBar({ post }) {
  const auth = useAuth();
  const pages = usePageSettings();
  const [state, setState] = useState({ likeCount: 0, liked: false, bookmarked: false, likes: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [likersOpen, setLikersOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPostInteractions(post.id, auth.user?.uid)
      .then(data => { if (active) setState(data); })
      .catch(error => { if (active) toast.error(error.message || "Không thể tải tương tác bài viết"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth.user?.uid, post.id]);

  const toggleLike = async () => {
    setBusy("like");
    try {
      const liked = await toggleBlogPostLike(post, auth);
      setState(current => {
        const ownLike = {
          id: `${post.id}_${auth.user.uid}`,
          ownerId: auth.user.uid,
          ownerName: auth.profile?.fullName || auth.profile?.username || "Người dùng QLCL-DV",
          ownerUsername: auth.profile?.username || "",
          ownerRole: auth.role || "user",
          createdAt: new Date().toISOString(),
        };
        return {
          ...current,
          liked,
          likeCount: Math.max(0, current.likeCount + (liked ? 1 : -1)),
          likes: liked ? [ownLike, ...current.likes.filter(item => item.ownerId !== auth.user.uid)] : current.likes.filter(item => item.ownerId !== auth.user.uid),
        };
      });
      toast.success(liked ? "Đã thả tim bài viết" : "Đã bỏ tim bài viết");
    } catch (error) { toast.error(error.message || "Không thể thả tim"); }
    finally { setBusy(""); }
  };

  const toggleBookmark = async () => {
    setBusy("bookmark");
    try {
      const bookmarked = await toggleBlogBookmark(post, auth);
      setState(current => ({ ...current, bookmarked }));
      toast.success(bookmarked ? "Đã lưu vào Bài viết đã lưu" : "Đã bỏ lưu bài viết");
    } catch (error) { toast.error(error.message || "Không thể lưu bài viết"); }
    finally { setBusy(""); }
  };

  return <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/80 to-amber-50/60 p-4 dark:border-orange-950/60 dark:from-orange-950/25 dark:to-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
    <div><b className="text-sm text-slate-800 dark:text-white">Bài viết hữu ích với bạn?</b><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Thả tim hoặc lưu lại để đọc nhanh vào lần sau.</p></div>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={loading || busy === "like"} onClick={toggleLike} className={`secondary-button !h-10 !px-4 ${state.liked ? "!border-rose-300 !bg-rose-50 !text-rose-600 dark:!border-rose-800 dark:!bg-rose-950/40 dark:!text-rose-300" : ""}`}>{busy === "like" ? <LoaderCircle className="animate-spin" size={17}/> : <Heart fill={state.liked ? "currentColor" : "none"} size={17}/>} {state.likeCount} lượt tim</button>
      {state.likeCount > 0 && <button type="button" onClick={() => setLikersOpen(true)} className="secondary-button !h-10 !px-3" title="Xem những người đã tim bài viết"><UsersRound size={17}/>Ai đã tim</button>}
      <button type="button" disabled={loading || busy === "bookmark"} onClick={toggleBookmark} className={`secondary-button !h-10 !px-4 ${state.bookmarked ? "!border-amber-300 !bg-amber-50 !text-amber-700 dark:!border-amber-800 dark:!bg-amber-950/40 dark:!text-amber-300" : ""}`}>{busy === "bookmark" ? <LoaderCircle className="animate-spin" size={17}/> : <Bookmark fill={state.bookmarked ? "currentColor" : "none"} size={17}/>} {state.bookmarked ? "Đã lưu" : "Lưu bài viết"}</button>
      <Link to={pages.pathFor("saved-posts")} className="secondary-button !h-10 !px-4"><BookMarked size={17}/>Bài đã lưu</Link>
    </div>
    {likersOpen && <BlogPeopleDialog title={`${state.likeCount} người đã tim bài viết`} description={`Danh sách tài khoản đã thả tim “${post.title}”.`} people={state.likes} onClose={() => setLikersOpen(false)}/>} 
  </div>;
}
