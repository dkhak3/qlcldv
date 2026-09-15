import { ImageOff, Link2 } from "lucide-react";
import { useState } from "react";
import { getRichBlogHtml, isRichBlogContent, safeWebUrl, sanitizeRichBlogHtml } from "../utils/blogContent";

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

function LegacyArticleContent({ content }) {
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

export default function BlogArticleContent({ content = "" }) {
  if (!isRichBlogContent(content)) return <LegacyArticleContent content={content}/>;
  const cleanHtml = sanitizeRichBlogHtml(getRichBlogHtml(content));
  return <div className="text-[15px] leading-8 text-slate-600 dark:text-slate-300 sm:text-base [&_a]:font-bold [&_a]:text-blue-600 [&_a]:underline [&_a]:decoration-blue-300 [&_a]:underline-offset-4 dark:[&_a]:text-blue-300 [&_blockquote]:my-7 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-orange-300 [&_blockquote]:bg-orange-50/60 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:italic dark:[&_blockquote]:border-orange-800 dark:[&_blockquote]:bg-orange-950/20 [&_h1]:mb-3 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:text-ink dark:[&_h1]:text-white [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink dark:[&_h2]:text-white [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-ink dark:[&_h3]:text-white [&_h4]:mb-2 [&_h4]:mt-7 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-ink dark:[&_h4]:text-white [&_h5]:mb-2 [&_h5]:mt-6 [&_h5]:font-bold [&_h5]:text-ink dark:[&_h5]:text-white [&_h6]:mb-2 [&_h6]:mt-6 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:uppercase [&_h6]:tracking-wide [&_h6]:text-ink dark:[&_h6]:text-white [&_iframe]:my-8 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-2xl [&_iframe]:border [&_iframe]:border-slate-200 [&_iframe]:bg-slate-950 dark:[&_iframe]:border-slate-700 [&_img]:my-8 [&_img]:max-h-[680px] [&_img]:w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-200 [&_img]:bg-slate-50 [&_img]:object-contain [&_img]:shadow-card dark:[&_img]:border-slate-700 dark:[&_img]:bg-slate-950/60 [&_li]:my-2 [&_li]:pl-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-7 [&_p]:my-5 [&_pre]:my-7 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-slate-950 [&_pre]:p-5 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-6 [&_pre]:text-slate-100 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-7" dangerouslySetInnerHTML={{ __html: cleanHtml }}/>;
}
