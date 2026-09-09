import { ImageOff, Link2 } from "lucide-react";
import { useState } from "react";

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function InlineContent({ text }) {
  const parts = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const url = safeWebUrl(match[2]);
    parts.push(url ? <a key={`${match.index}-${url}`} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-blue-600 underline decoration-blue-300 underline-offset-4 transition hover:text-brand-600 dark:text-blue-300 dark:hover:text-orange-300">{match[1]}<Link2 size={14}/></a> : match[0]);
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function ContentImage({ url, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed || !safeWebUrl(url)) return <div className="my-7 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-slate-700 dark:bg-slate-950/60"><ImageOff className="text-slate-300" size={36}/><b className="mt-3 text-sm text-slate-500 dark:text-slate-300">Ảnh nội dung hiện không tải được</b><span className="mt-1 text-xs text-slate-400">Bài viết vẫn được giữ nguyên nội dung.</span></div>;
  return <figure className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-card dark:border-slate-700 dark:bg-slate-950/60"><div className="grid max-h-[680px] min-h-48 place-items-center overflow-hidden"><img src={url} alt={alt || "Ảnh trong bài viết"} onError={() => setFailed(true)} className="max-h-[680px] w-full object-contain" loading="lazy" decoding="async"/></div>{alt && <figcaption className="border-t border-slate-200 px-4 py-3 text-center text-xs italic text-slate-500 dark:border-slate-800 dark:text-slate-400">{alt}</figcaption>}</figure>;
}

export default function BlogArticleContent({ content = "" }) {
  const lines = content.split("\n");
  return <div className="space-y-5 text-[15px] leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
    {lines.map((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) return null;
      const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/);
      if (image) return <ContentImage key={index} alt={image[1]} url={image[2]}/>;
      if (line.startsWith("## ")) return <h2 key={index} className="!mb-2 !mt-9 text-xl font-bold tracking-tight text-ink dark:text-white sm:text-2xl"><InlineContent text={line.slice(3)}/></h2>;
      if (line.startsWith("- ")) return <div key={index} className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"/><span><InlineContent text={line.slice(2)}/></span></div>;
      return <p key={index}><InlineContent text={line}/></p>;
    })}
  </div>;
}
