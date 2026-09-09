import { useRef, useState } from "react";
import { ImagePlus, Link2, LoaderCircle, Type, X } from "lucide-react";
import { toast } from "react-toastify";
import { uploadBlogImage } from "../services/blogService";

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export default function BlogContentEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const insertAtCursor = text => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const prefix = before && !before.endsWith("\n") ? "\n\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n\n" : "";
    const next = `${before}${prefix}${text}${suffix}${after}`;
    onChange(next);
    window.setTimeout(() => {
      const cursor = start + prefix.length + text.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursor, cursor);
    });
  };

  const uploadImage = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBlogImage(file);
      const description = file.name.replace(/\.[^.]+$/, "").replace(/[-_\[\]()]+/g, " ").trim() || "Ảnh trong bài viết";
      insertAtCursor(`![${description}](${url})`);
      toast.success("Đã chèn ảnh vào nội dung");
    } catch (error) {
      toast.error(error.message || "Không thể tải ảnh nội dung");
    } finally {
      setUploading(false);
    }
  };

  const insertLink = () => {
    const url = safeWebUrl(linkUrl.trim());
    if (!url) return toast.warning("Vui lòng nhập link bắt đầu bằng http:// hoặc https://");
    const label = linkLabel.trim() || "Mở liên kết";
    insertAtCursor(`[${label}](${url})`);
    setLinkLabel("");
    setLinkUrl("");
    setLinkOpen(false);
  };

  return <div>
    <span className="field-label"><Type size={17}/>Nội dung</span>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100/60 dark:border-slate-700 dark:bg-slate-950/60 dark:focus-within:border-orange-800 dark:focus-within:ring-orange-950/30">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="secondary-button !h-9 !rounded-lg !px-3 text-xs">{uploading ? <LoaderCircle className="animate-spin" size={15}/> : <ImagePlus size={15}/>}Chèn ảnh</button>
        <button type="button" onClick={() => setLinkOpen(open => !open)} className="secondary-button !h-9 !rounded-lg !px-3 text-xs"><Link2 size={15}/>Chèn link</button>
        <span className="ml-auto hidden text-[11px] text-slate-400 sm:inline">Ảnh tối đa 3 MB · Link mở ở tab mới</span>
        <input ref={fileRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage}/>
      </div>
      {linkOpen && <div className="grid gap-2 border-b border-slate-100 bg-orange-50/60 p-3 dark:border-slate-800 dark:bg-orange-950/20 sm:grid-cols-[1fr_1.6fr_auto_auto]">
        <input className="field-input !h-10" value={linkLabel} onChange={event => setLinkLabel(event.target.value)} placeholder="Tên hiển thị"/>
        <input className="field-input !h-10" type="url" value={linkUrl} onChange={event => setLinkUrl(event.target.value)} placeholder="https://example.com"/>
        <button type="button" onClick={insertLink} className="primary-button !h-10 !px-4">Chèn</button>
        <button type="button" aria-label="Đóng nhập link" onClick={() => setLinkOpen(false)} className="secondary-button !h-10 !px-3"><X size={16}/></button>
      </div>}
      <textarea ref={textareaRef} className="h-72 w-full resize-y bg-transparent px-4 py-4 text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200" value={value} onChange={event => onChange(event.target.value)} placeholder={"Nhập nội dung bài viết...\n\n## Tiêu đề mục\n\n- Một ý trong danh sách"}/>
    </div>
    <small className="mt-2 block text-xs leading-5 text-slate-400">Hỗ trợ <b>## Tiêu đề</b>, danh sách <b>- Nội dung</b>, ảnh và liên kết có thể bấm trực tiếp.</small>
  </div>;
}
