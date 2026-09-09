import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Heart, History, LoaderCircle, MessageCircle, Reply, Send, SmilePlus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  createBlogComment,
  deleteBlogComment,
  getBlogComments,
  setBlogCommentReaction,
  updateBlogComment,
} from "../services/blogInteractionService";
import { formatDateTimeVi } from "../utils/blog";
import BlogPeopleDialog from "./BlogPeopleDialog";
import ConfirmDialog from "./ConfirmDialog";

const EMOJIS = ["😊", "👍", "❤️", "👏", "🎉", "😂", "💡", "🙏"];
const REACTIONS = ["❤️", "👍", "👏", "😂", "🎉"];
const roleLabels = { user: "User", admin: "Admin", superadmin: "SuperAdmin" };
const roleStyles = {
  user: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  admin: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  superadmin: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
};

function RoleBadge({ role }) {
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${roleStyles[role] || roleStyles.user}`}>{roleLabels[role] || "User"}</span>;
}

function EmojiPicker({ onPick }) {
  return <div className="flex w-max max-w-[calc(100vw-2rem)] flex-nowrap gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
    {EMOJIS.map(emoji => <button key={emoji} type="button" onClick={() => onPick(emoji)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg transition hover:scale-110 hover:bg-orange-50 dark:hover:bg-slate-800">{emoji}</button>)}
  </div>;
}

function CommentAuthor({ comment }) {
  const avatar = <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-amber-400 text-sm font-black text-white">{comment.ownerName.charAt(0).toUpperCase()}</span>;
  const name = <b className="truncate text-sm text-slate-800 transition dark:text-white">{comment.ownerName}</b>;
  if (comment.ownerRole === "user" || !comment.ownerId) return <>{avatar}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2">{name}<RoleBadge role={comment.ownerRole}/></div><time className="mt-1 block text-[11px] text-slate-400">{formatDateTimeVi(comment.updatedAt || comment.createdAt)}{comment.wasEdited ? " · Đã chỉnh sửa" : ""}</time></div></>;
  const authorUrl = `/tac-gia/${comment.ownerId}`;
  return <><Link to={authorUrl} className="shrink-0 rounded-xl ring-offset-2 transition hover:ring-2 hover:ring-orange-300 dark:ring-offset-slate-900" title={`Xem bài viết của ${comment.ownerName}`}>{avatar}</Link><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link to={authorUrl} className="min-w-0 hover:text-brand-600 dark:hover:text-orange-300" title={`Xem bài viết của ${comment.ownerName}`}>{name}</Link><RoleBadge role={comment.ownerRole}/></div><time className="mt-1 block text-[11px] text-slate-400">{formatDateTimeVi(comment.updatedAt || comment.createdAt)}{comment.wasEdited ? " · Đã chỉnh sửa" : ""}</time></div></>;
}

function CommentText({ content }) {
  const parts = String(content || "").split(/(https?:\/\/[^\s]+)/g);
  return <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 dark:text-slate-300">
    {parts.map((part, index) => part.startsWith("http://") || part.startsWith("https://")
      ? <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-brand-600 dark:text-blue-300">{part}</a>
      : part)}
  </p>;
}

function CommentComposer({ placeholder, submitLabel, busy, onSubmit, onCancel }) {
  const [value, setValue] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef(null);

  useEffect(() => {
    if (!emojiOpen) return undefined;
    const closeOutside = event => {
      if (!emojiRef.current?.contains(event.target)) setEmojiOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [emojiOpen]);

  const submit = async event => {
    event.preventDefault();
    if (!value.trim()) return toast.warning("Vui lòng nhập nội dung bình luận");
    if (await onSubmit(value)) setValue("");
  };

  return <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <textarea autoFocus={Boolean(onCancel)} className="min-h-24 w-full resize-y bg-transparent px-2 py-2 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200" maxLength={1200} value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder}/>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      <div ref={emojiRef} className="relative flex items-center gap-2">
        <button type="button" title="Chọn biểu tượng" onClick={() => setEmojiOpen(open => !open)} className="secondary-button !h-9 !px-3"><SmilePlus size={16}/></button>
        <span className="text-[11px] text-slate-400">{value.length}/1200</span>
        {emojiOpen && <div className="absolute bottom-12 left-0 z-30"><EmojiPicker onPick={emoji => { setValue(current => `${current}${emoji}`); setEmojiOpen(false); }}/></div>}
      </div>
      <div className="flex gap-2">
        {onCancel && <button type="button" className="secondary-button !h-9 !px-3" onClick={onCancel}><X size={15}/>Hủy</button>}
        <button disabled={busy} className="primary-button !h-9 !px-4">{busy ? <LoaderCircle className="animate-spin" size={15}/> : <Send size={15}/>} {submitLabel}</button>
      </div>
    </div>
  </form>;
}

function CommentEditor({ value, busy, onChange, onCancel, onSave }) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef(null);

  useEffect(() => {
    if (!emojiOpen) return undefined;
    const closeOutside = event => {
      if (!emojiRef.current?.contains(event.target)) setEmojiOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [emojiOpen]);

  return <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/40">
    <textarea autoFocus className="field-input !h-28 !py-3" maxLength={1200} value={value} onChange={event => onChange(event.target.value)}/>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <div ref={emojiRef} className="relative flex items-center gap-2">
        <button type="button" title="Chèn biểu tượng" onClick={() => setEmojiOpen(open => !open)} className="secondary-button !h-9 !px-3"><SmilePlus size={16}/></button>
        <span className="text-[11px] text-slate-400">{value.length}/1200</span>
        {emojiOpen && <div className="absolute bottom-12 left-0 z-30"><EmojiPicker onPick={emoji => { onChange(`${value}${emoji}`); setEmojiOpen(false); }}/></div>}
      </div>
      <div className="flex gap-2"><button type="button" onClick={onCancel} className="secondary-button !h-9"><X size={15}/>Hủy</button><button type="button" onClick={onSave} disabled={busy} className="primary-button !h-9">{busy && <LoaderCircle className="animate-spin" size={15}/>}Lưu sửa</button></div>
    </div>
  </div>;
}

function CommentHistory({ comment }) {
  if (!comment.editHistory?.length) return null;
  return <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/25">
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300"><History size={15}/>Lịch sử chỉnh sửa</div>
    <ol className="mt-3 space-y-3">
      <li className="rounded-xl bg-white p-3 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-xs text-slate-700 dark:text-slate-200">Nội dung ban đầu</b><time className="text-[10px] text-slate-400">{formatDateTimeVi(comment.createdAt)}</time></div>
        <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-slate-600 dark:text-slate-300">{comment.editHistory[0].beforeContent}</p>
      </li>
      {comment.editHistory.map((edit, index) => <li key={edit.id} className="rounded-xl bg-white p-3 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-xs text-slate-700 dark:text-slate-200">Nội dung chỉnh sửa lần {index + 1}</b><time className="text-[10px] text-slate-400">{formatDateTimeVi(edit.editedAt)}</time></div>
        <p className="mt-1 text-[10px] text-slate-400">Sửa bởi {edit.editorName} · {roleLabels[edit.editorRole] || "User"}</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-slate-600 dark:text-slate-300">{edit.afterContent}</p>
      </li>)}
    </ol>
  </div>;
}

export default function BlogComments({ postId }) {
  const auth = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reactionOpen, setReactionOpen] = useState("");
  const [historyOpen, setHistoryOpen] = useState("");
  const [peopleDialog, setPeopleDialog] = useState(null);
  const reactionMenuRef = useRef(null);

  useEffect(() => {
    if (!reactionOpen) return undefined;
    const closeOutside = event => {
      if (!reactionMenuRef.current?.contains(event.target)) setReactionOpen("");
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [reactionOpen]);

  const load = useCallback(async () => {
    try {
      setComments(await getBlogComments(postId, auth.user?.uid));
    } catch (error) {
      toast.error(error.message || "Không thể tải bình luận");
    } finally {
      setLoading(false);
    }
  }, [auth.user?.uid, postId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const commentById = useMemo(() => new Map(comments.map(item => [item.id, item])), [comments]);
  const rootComments = useMemo(() => {
    const ids = new Set(comments.map(item => item.id));
    return comments.filter(item => !item.parentId || !ids.has(item.parentId));
  }, [comments]);
  const repliesFor = parentId => comments.filter(item => item.parentId === parentId);
  const canEdit = comment => comment.ownerId === auth.user?.uid || (auth.role === "admin" && comment.ownerRole === "user");
  const canDelete = comment => comment.ownerId === auth.user?.uid
    || (auth.role === "admin" && comment.ownerRole === "user")
    || (auth.role === "superadmin" && ["user", "admin"].includes(comment.ownerRole));

  const add = async (content, target = null) => {
    setBusy(true);
    try {
      await createBlogComment({
        postId,
        content,
        parentId: target?.parentId || "",
        replyToId: target?.targetId || "",
        replyToName: target?.targetName || "",
        replyToRole: target?.targetRole || "",
        replyToContent: target?.targetContent || "",
      }, auth);
      await load();
      setReplyTo(null);
      toast.success(target ? `Đã trả lời ${target.targetName}` : "Đã đăng bình luận");
      return true;
    } catch (error) {
      toast.error(error.message || "Không thể đăng bình luận");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async comment => {
    setBusy(true);
    try {
      await updateBlogComment(comment.id, editContent, auth);
      await load();
      setEditing(null);
      setHistoryOpen(comment.id);
      toast.success("Đã sửa và lưu lịch sử bình luận");
    } catch (error) {
      toast.error(error.message || "Không thể sửa bình luận");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteBlogComment(deleteTarget.id);
      await load();
      setDeleteTarget(null);
      toast.success("Đã xóa vĩnh viễn bình luận, lịch sử sửa và cảm xúc liên quan");
    } catch (error) {
      toast.error(error.message || "Không thể xóa bình luận");
    } finally {
      setBusy(false);
    }
  };

  const react = async (comment, reaction) => {
    try {
      await setBlogCommentReaction({ postId, commentId: comment.id, reaction }, auth);
      setReactionOpen("");
      await load();
    } catch (error) {
      toast.error(error.message || "Không thể thả cảm xúc");
    }
  };

  const openReply = (comment, isReply) => {
    setReplyTo({
      parentId: isReply ? comment.parentId : comment.id,
      targetId: comment.id,
      targetName: comment.ownerName,
      targetRole: comment.ownerRole,
      targetContent: comment.content,
    });
    setEditing(null);
  };

  const renderComment = (comment, isReply = false) => {
    const inferredTarget = isReply ? commentById.get(comment.replyToId) || commentById.get(comment.parentId) : null;
    const replyName = comment.replyToName || inferredTarget?.ownerName || "";
    const replyRole = comment.replyToRole || inferredTarget?.ownerRole || "";
    const replyContent = comment.replyToContent || inferredTarget?.content || "";
    const wasEdited = Boolean(comment.editHistory?.length) || Boolean(comment.updatedAt && comment.updatedAt !== comment.createdAt);
    const commentWithEditState = { ...comment, wasEdited };

    return <article key={comment.id} className={isReply ? "ml-5 border-l-2 border-orange-100 pl-4 dark:border-orange-950 sm:ml-12" : ""}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-start gap-3">
          <CommentAuthor comment={commentWithEditState}/>
        </div>

        {replyName && <div className="mt-3 rounded-xl border-l-4 border-orange-300 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500 dark:border-orange-700 dark:bg-slate-800/70 dark:text-slate-300"><div className="flex flex-wrap items-center gap-1.5"><Reply size={13}/>Đã trả lời <b className="text-slate-700 dark:text-white">{replyName}</b>{replyRole && <RoleBadge role={replyRole}/>}</div>{replyContent && <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap break-words border-t border-slate-200/70 pt-1.5 italic leading-5 text-slate-500 dark:border-slate-700 dark:text-slate-400">“{replyContent}”</p>}</div>}

        {editing === comment.id
          ? <CommentEditor value={editContent} busy={busy} onChange={setEditContent} onCancel={() => setEditing(null)} onSave={() => saveEdit(comment)}/>
          : <CommentText content={comment.content}/>}

        {historyOpen === comment.id && <CommentHistory comment={comment}/>} 

        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
          {Object.entries(comment.reactionCounts).map(([reaction, count]) => <button key={reaction} type="button" onClick={() => setPeopleDialog({ title: `${reaction} ${count} người đã thả cảm xúc`, description: `Cảm xúc dành cho bình luận của ${comment.ownerName}.`, people: comment.reactionPeople[reaction] || [] })} className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${comment.userReaction === reaction ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/50" : "border-slate-200 text-slate-500 hover:border-orange-200 dark:border-slate-700 dark:text-slate-300"}`} title="Xem những người đã thả cảm xúc">{reaction} {count}</button>)}

          <div ref={reactionOpen === comment.id ? reactionMenuRef : null} className="relative">
            <button type="button" onClick={() => setReactionOpen(current => current === comment.id ? "" : comment.id)} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800" title="Thả cảm xúc">{comment.reactionTotal ? <Heart size={15}/> : <SmilePlus size={16}/>}</button>
            {reactionOpen === comment.id && <div className="absolute bottom-10 left-0 z-30 flex w-max max-w-[calc(100vw-2rem)] flex-nowrap gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">{REACTIONS.map(reaction => <button key={reaction} type="button" onClick={() => react(comment, reaction)} className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg transition hover:scale-110 hover:bg-slate-100 dark:hover:bg-slate-800 ${comment.userReaction === reaction ? "bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-950/50" : ""}`}>{reaction}</button>)}</div>}
          </div>

          <button type="button" onClick={() => openReply(comment, isReply)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"><Reply size={14}/>Trả lời</button>
          {comment.editHistory?.length > 0 && <button type="button" onClick={() => setHistoryOpen(current => current === comment.id ? "" : comment.id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"><History size={14}/>Lịch sử ({comment.editHistory.length})</button>}
          {canEdit(comment) && <button type="button" onClick={() => { setEditing(comment.id); setEditContent(comment.content); setReplyTo(null); }} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"><Edit3 size={14}/>Sửa</button>}
          {canDelete(comment) && <button type="button" onClick={() => setDeleteTarget(comment)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"><Trash2 size={14}/>Xóa</button>}
        </div>
      </div>

      {replyTo?.parentId === comment.id && !isReply && <div className="ml-5 mt-3 sm:ml-12">
        <div className="mb-2 rounded-xl border-l-4 border-orange-300 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-orange-700 dark:bg-slate-900 dark:text-slate-400"><div className="flex flex-wrap items-center gap-2"><Reply size={14}/>Bạn đang trả lời <b className="text-slate-700 dark:text-white">{replyTo.targetName}</b><RoleBadge role={replyTo.targetRole}/></div><p className="mt-1.5 line-clamp-2 whitespace-pre-wrap break-words italic leading-5">“{replyTo.targetContent}”</p></div>
        <CommentComposer placeholder={`Trả lời ${replyTo.targetName}...`} submitLabel="Trả lời" busy={busy} onCancel={() => setReplyTo(null)} onSubmit={content => add(content, replyTo)}/>
      </div>}
    </article>;
  };

  return <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:p-7">
    <div className="flex items-center justify-between gap-4">
      <div><h2 className="flex items-center gap-2 text-xl font-bold text-ink dark:text-white"><MessageCircle className="text-brand-500" size={22}/>Bình luận</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chia sẻ ý kiến và trao đổi cùng anh em QLCL-DV.</p></div>
      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">{comments.length} bình luận</span>
    </div>

    <div className="mt-5"><CommentComposer placeholder="Viết bình luận của bạn..." submitLabel="Bình luận" busy={busy} onSubmit={content => add(content)}/></div>

    {loading
      ? <div className="flex min-h-40 items-center justify-center"><LoaderCircle className="animate-spin text-brand-500" size={30}/></div>
      : rootComments.length
        ? <div className="mt-6 space-y-5">{rootComments.map(comment => <div key={comment.id} className="space-y-3">{renderComment(comment)}{repliesFor(comment.id).map(reply => renderComment(reply, true))}</div>)}</div>
        : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700"><MessageCircle className="mx-auto text-slate-300" size={34}/><b className="mt-3 block text-sm text-slate-600 dark:text-slate-300">Chưa có bình luận</b><span className="mt-1 block text-xs text-slate-400">Hãy là người đầu tiên chia sẻ ý kiến về bài viết.</span></div>}

    {deleteTarget && <ConfirmDialog danger title="Xóa bình luận?" description={`Bình luận của ${deleteTarget.ownerName} sẽ bị xóa khỏi bài viết.`} confirmLabel="Xóa bình luận" busy={busy} onClose={() => setDeleteTarget(null)} onConfirm={remove}/>} 
    {peopleDialog && <BlogPeopleDialog {...peopleDialog} onClose={() => setPeopleDialog(null)}/>} 
  </section>;
}
