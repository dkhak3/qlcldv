import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Check,
  Code2,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Quote,
  Strikethrough,
  Type,
  Underline,
  Video,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { uploadBlogImage } from "../services/blogService";
import {
  getRichBlogHtml,
  isRichBlogContent,
  legacyMarkdownToHtml,
  safeWebUrl,
  sanitizeRichBlogHtml,
  serializeRichBlogContent,
  toBlogEmbedUrl,
} from "../utils/blogContent";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ToolButton({ title, active = false, disabled = false, onMouseDown, children }) {
  return <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={event => {
      event.preventDefault();
      onMouseDown?.();
    }}
    className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${active ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-orange-300" : ""}`}
  >{children}</button>;
}

function Divider() {
  return <span className="mx-0.5 h-6 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true"/>;
}

export default function BlogContentEditor({ value = "", onChange }) {
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const savedRangeRef = useRef(null);
  const lastEmittedRef = useRef("");
  const [uploading, setUploading] = useState(false);
  const [panel, setPanel] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [format, setFormat] = useState("p");
  const [empty, setEmpty] = useState(!value);

  useEffect(() => {
    if (!editorRef.current || value === lastEmittedRef.current) return;
    const nextHtml = isRichBlogContent(value) ? getRichBlogHtml(value) : legacyMarkdownToHtml(value);
    const cleanHtml = sanitizeRichBlogHtml(nextHtml);
    if (editorRef.current.innerHTML !== cleanHtml) editorRef.current.innerHTML = cleanHtml;
    setEmpty(!(editorRef.current.textContent || "").trim() && !/<(?:img|iframe)\b/i.test(cleanHtml));
  }, [value]);

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const range = savedRangeRef.current;
    const selection = window.getSelection();
    if (!range || !selection || !editorRef.current) {
      editorRef.current?.focus();
      return;
    }
    editorRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const syncContent = () => {
    if (!editorRef.current) return;
    const next = serializeRichBlogContent(editorRef.current.innerHTML);
    lastEmittedRef.current = next;
    setEmpty(!next);
    onChange(next);
  };

  const exec = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    rememberSelection();
    syncContent();
  };

  const insertHtml = html => {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    rememberSelection();
    syncContent();
  };

  const openPanel = name => {
    rememberSelection();
    setPanel(current => current === name ? "" : name);
  };

  const insertLink = () => {
    const url = safeWebUrl(linkUrl);
    if (!url) return toast.warning("Vui lòng nhập liên kết bắt đầu bằng http:// hoặc https://");
    const selection = savedRangeRef.current?.toString()?.trim();
    const label = linkLabel.trim() || selection || "Mở liên kết";
    insertHtml(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
    setLinkLabel("");
    setLinkUrl("");
    setPanel("");
  };

  const insertVideo = () => {
    const embedUrl = toBlogEmbedUrl(videoUrl);
    if (!embedUrl) return toast.warning("Chỉ hỗ trợ video YouTube hoặc file Google Drive có liên kết hợp lệ");
    insertHtml(`<div><iframe src="${escapeHtml(embedUrl)}" title="Video trong bài viết" allowfullscreen></iframe></div><p><br></p>`);
    setVideoUrl("");
    setPanel("");
  };

  const chooseImage = () => {
    rememberSelection();
    fileRef.current?.click();
  };

  const uploadImage = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBlogImage(file);
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_\[\]()]+/g, " ").trim() || "Ảnh trong bài viết";
      insertHtml(`<p><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"></p><p><br></p>`);
      toast.success("Đã chèn ảnh vào nội dung");
    } catch (error) {
      toast.error(error.message || "Không thể tải ảnh nội dung");
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = event => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const changeFormat = event => {
    const next = event.target.value;
    setFormat(next);
    restoreSelection();
    exec("formatBlock", next === "p" ? "p" : next);
  };

  return <div>
    <span className="field-label"><Type size={17}/>Nội dung</span>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100/60 dark:border-slate-700 dark:bg-slate-950/60 dark:focus-within:border-orange-800 dark:focus-within:ring-orange-950/30">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <ToolButton title="In đậm" onMouseDown={() => exec("bold")}><Bold size={17}/></ToolButton>
        <ToolButton title="In nghiêng" onMouseDown={() => exec("italic")}><Italic size={17}/></ToolButton>
        <ToolButton title="Gạch chân" onMouseDown={() => exec("underline")}><Underline size={17}/></ToolButton>
        <ToolButton title="Gạch ngang" onMouseDown={() => exec("strikeThrough")}><Strikethrough size={17}/></ToolButton>
        <Divider/>
        <ToolButton title="Trích dẫn" onMouseDown={() => exec("formatBlock", "blockquote")}><Quote size={17}/></ToolButton>
        <ToolButton title="Tiêu đề H1" onMouseDown={() => { setFormat("h1"); exec("formatBlock", "h1"); }}><Heading1 size={18}/></ToolButton>
        <ToolButton title="Tiêu đề H2" onMouseDown={() => { setFormat("h2"); exec("formatBlock", "h2"); }}><Heading2 size={18}/></ToolButton>
        <Divider/>
        <ToolButton title="Danh sách đánh số" onMouseDown={() => exec("insertOrderedList")}><ListOrdered size={18}/></ToolButton>
        <ToolButton title="Danh sách dấu chấm" onMouseDown={() => exec("insertUnorderedList")}><List size={18}/></ToolButton>
        <Divider/>
        <select
          aria-label="Kiểu đoạn văn"
          title="Kiểu đoạn văn"
          value={format}
          onMouseDown={rememberSelection}
          onChange={changeFormat}
          className="h-9 rounded-lg border-0 bg-transparent px-2 text-sm font-semibold text-slate-600 outline-none hover:bg-white focus:bg-white dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>
        <Divider/>
        <ToolButton title="Chèn liên kết" onMouseDown={() => openPanel("link")}><Link2 size={17}/></ToolButton>
        <ToolButton title="Chèn ảnh" disabled={uploading} onMouseDown={chooseImage}>{uploading ? <LoaderCircle className="animate-spin" size={17}/> : <ImagePlus size={17}/>}</ToolButton>
        <ToolButton title="Chèn video" onMouseDown={() => openPanel("video")}><Video size={18}/></ToolButton>
        <ToolButton title="Khối mã nguồn" onMouseDown={() => exec("formatBlock", "pre")}><Code2 size={18}/></ToolButton>
        <input ref={fileRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage}/>
      </div>

      {panel === "link" && <div className="grid gap-2 border-b border-slate-100 bg-orange-50/60 p-3 dark:border-slate-800 dark:bg-orange-950/20 sm:grid-cols-[1fr_1.6fr_auto_auto]">
        <input className="field-input !h-10" value={linkLabel} onChange={event => setLinkLabel(event.target.value)} placeholder="Tên hiển thị (có thể bỏ trống)"/>
        <input className="field-input !h-10" type="url" value={linkUrl} onChange={event => setLinkUrl(event.target.value)} placeholder="https://example.com"/>
        <button type="button" onClick={insertLink} className="primary-button !h-10 !px-4"><Check size={16}/>Chèn</button>
        <button type="button" aria-label="Đóng nhập liên kết" onClick={() => setPanel("")} className="secondary-button !h-10 !px-3"><X size={16}/></button>
      </div>}

      {panel === "video" && <div className="grid gap-2 border-b border-slate-100 bg-orange-50/60 p-3 dark:border-slate-800 dark:bg-orange-950/20 sm:grid-cols-[1fr_auto_auto]">
        <input className="field-input !h-10" type="url" value={videoUrl} onChange={event => setVideoUrl(event.target.value)} placeholder="Link YouTube hoặc Google Drive"/>
        <button type="button" onClick={insertVideo} className="primary-button !h-10 !px-4"><Check size={16}/>Chèn video</button>
        <button type="button" aria-label="Đóng nhập video" onClick={() => setPanel("")} className="secondary-button !h-10 !px-3"><X size={16}/></button>
      </div>}

      <div className="relative">
        {empty && <span className="pointer-events-none absolute left-5 top-4 text-sm text-slate-400 dark:text-slate-500 sm:text-[15px]">Nhập nội dung bài viết...</span>}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          role="textbox"
          aria-multiline="true"
          className="min-h-72 w-full overflow-y-auto bg-transparent px-5 py-4 text-sm leading-7 text-slate-700 outline-none dark:text-slate-200 sm:text-[15px] [&_a]:font-semibold [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-300 [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-orange-300 [&_blockquote]:bg-orange-50/60 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:italic dark:[&_blockquote]:border-orange-800 dark:[&_blockquote]:bg-orange-950/20 [&_h1]:my-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h2]:my-5 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:my-4 [&_h3]:text-xl [&_h3]:font-bold [&_h4]:my-4 [&_h4]:text-lg [&_h4]:font-bold [&_h5]:my-3 [&_h5]:text-base [&_h5]:font-bold [&_h6]:my-3 [&_h6]:text-sm [&_h6]:font-bold [&_img]:my-4 [&_img]:max-h-[520px] [&_img]:max-w-full [&_img]:rounded-xl [&_img]:object-contain [&_iframe]:my-4 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl [&_li]:ml-6 [&_ol]:my-4 [&_ol]:list-decimal [&_p]:my-3 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:text-slate-100 [&_ul]:my-4 [&_ul]:list-disc"
          onInput={syncContent}
          onBlur={() => { rememberSelection(); syncContent(); }}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onPaste={handlePaste}
        />
      </div>
    </div>
    <small className="mt-2 block text-xs leading-5 text-slate-400">Hỗ trợ định dạng chữ, tiêu đề, trích dẫn, danh sách, liên kết, ảnh, video YouTube/Google Drive và khối mã nguồn. Ảnh tối đa 3 MB.</small>
  </div>;
}
