export const RICH_TEXT_PREFIX = "<!--qlcldv-richtext-v1-->";

const ALLOWED_TAGS = new Set([
  "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
  "i", "iframe", "img", "li", "ol", "p", "pre", "s", "span", "strike", "strong", "u", "ul",
]);

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function safeWebUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function toBlogEmbedUrl(value) {
  const safe = safeWebUrl(value);
  if (!safe) return "";
  const url = new URL(safe);
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : "";
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : "";
    }
    const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/);
    return match?.[1] ? `https://www.youtube.com/embed/${encodeURIComponent(match[1])}` : "";
  }
  if (host === "youtube-nocookie.com") {
    const match = url.pathname.match(/^\/embed\/([^/?#]+)/);
    return match?.[1] ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(match[1])}` : "";
  }
  if (host === "drive.google.com") {
    const match = url.pathname.match(/\/file\/d\/([^/]+)/);
    return match?.[1] ? `https://drive.google.com/file/d/${encodeURIComponent(match[1])}/preview` : "";
  }
  return "";
}

export function isRichBlogContent(value = "") {
  return String(value).startsWith(RICH_TEXT_PREFIX);
}

export function getRichBlogHtml(value = "") {
  const text = String(value || "");
  return isRichBlogContent(text) ? text.slice(RICH_TEXT_PREFIX.length) : "";
}

function legacyInlineToHtml(text = "") {
  const escaped = escapeHtml(text);
  return escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (whole, label, rawUrl) => {
    const url = safeWebUrl(rawUrl);
    return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : whole;
  });
}

export function legacyMarkdownToHtml(content = "") {
  const lines = String(content || "").split("\n");
  const html = [];
  let listType = "";

  const closeList = () => {
    if (listType) html.push(`</${listType}>`);
    listType = "";
  };

  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      return;
    }

    const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/);
    if (image) {
      closeList();
      const src = safeWebUrl(image[2]);
      if (src) html.push(`<p><img src="${escapeHtml(src)}" alt="${escapeHtml(image[1])}"></p>`);
      return;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${legacyInlineToHtml(line.slice(3))}</h2>`);
      return;
    }
    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${legacyInlineToHtml(line.slice(2))}</h1>`);
      return;
    }
    if (line.startsWith("> ")) {
      closeList();
      html.push(`<blockquote>${legacyInlineToHtml(line.slice(2))}</blockquote>`);
      return;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (ordered || bullet) {
      const nextType = ordered ? "ol" : "ul";
      if (listType !== nextType) {
        closeList();
        listType = nextType;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${legacyInlineToHtml((ordered || bullet)[1])}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${legacyInlineToHtml(line)}</p>`);
  });

  closeList();
  return html.join("");
}

function sanitizeNode(node, targetDoc) {
  if (node.nodeType === 3) return targetDoc.createTextNode(node.textContent || "");
  if (node.nodeType !== 1) return null;

  const tag = node.tagName.toLowerCase();
  if (["script", "style", "object", "embed", "form", "input", "button", "textarea", "select"].includes(tag)) return null;

  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = targetDoc.createDocumentFragment();
    [...node.childNodes].forEach(child => {
      const cleanChild = sanitizeNode(child, targetDoc);
      if (cleanChild) fragment.appendChild(cleanChild);
    });
    return fragment;
  }

  const clean = targetDoc.createElement(tag);
  if (tag === "ol") {
    const start = Number.parseInt(node.getAttribute("start") || "", 10);
    if (Number.isInteger(start) && start > 0 && start <= 100000) {
      clean.setAttribute("start", String(start));
    }
  }
  if (tag === "a") {
    const href = safeWebUrl(node.getAttribute("href"));
    if (!href) {
      const fragment = targetDoc.createDocumentFragment();
      [...node.childNodes].forEach(child => {
        const cleanChild = sanitizeNode(child, targetDoc);
        if (cleanChild) fragment.appendChild(cleanChild);
      });
      return fragment;
    }
    clean.setAttribute("href", href);
    clean.setAttribute("target", "_blank");
    clean.setAttribute("rel", "noopener noreferrer");
  }
  if (tag === "img") {
    const src = safeWebUrl(node.getAttribute("src"));
    if (!src) return null;
    clean.setAttribute("src", src);
    clean.setAttribute("alt", (node.getAttribute("alt") || "Ảnh trong bài viết").slice(0, 300));
    clean.setAttribute("loading", "lazy");
    clean.setAttribute("decoding", "async");
  }
  if (tag === "iframe") {
    const src = toBlogEmbedUrl(node.getAttribute("src"));
    if (!src) return null;
    clean.setAttribute("src", src);
    clean.setAttribute("title", (node.getAttribute("title") || "Video trong bài viết").slice(0, 120));
    clean.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    clean.setAttribute("allowfullscreen", "");
    clean.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  }

  if (tag !== "img" && tag !== "iframe") {
    [...node.childNodes].forEach(child => {
      const cleanChild = sanitizeNode(child, targetDoc);
      if (cleanChild) clean.appendChild(cleanChild);
    });
  }
  return clean;
}

export function sanitizeRichBlogHtml(html = "") {
  if (typeof DOMParser === "undefined" || typeof document === "undefined") return "";
  const parsed = new DOMParser().parseFromString(`<div id="qlcldv-rich-source">${String(html || "")}</div>`, "text/html");
  const source = parsed.getElementById("qlcldv-rich-source");
  if (!source) return "";
  const wrapper = document.createElement("div");
  [...source.childNodes].forEach(child => {
    const cleanChild = sanitizeNode(child, document);
    if (cleanChild) wrapper.appendChild(cleanChild);
  });
  return wrapper.innerHTML;
}

export function serializeRichBlogContent(html = "") {
  const cleanHtml = sanitizeRichBlogHtml(html);
  if (!cleanHtml.trim()) return "";
  const text = richHtmlToText(cleanHtml);
  const hasMedia = /<(?:img|iframe)\b/i.test(cleanHtml);
  return text || hasMedia ? `${RICH_TEXT_PREFIX}${cleanHtml}` : "";
}

function richHtmlToText(html = "") {
  if (typeof DOMParser === "undefined") return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

export function blogContentToPlainText(content = "") {
  const value = String(content || "");
  if (isRichBlogContent(value)) return richHtmlToText(getRichBlogHtml(value));
  return value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*>]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[`*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
