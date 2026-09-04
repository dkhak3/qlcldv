export function slugifyBlogTitle(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createRandomBlogSlug(value, existingSlugs = []) {
  const base = slugifyBlogTitle(value) || "bai-viet";
  const existing = new Set(existingSlugs);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!existing.has(slug)) return slug;
  }
  return `${base}-${Date.now().toString().slice(-6)}`;
}

export function formatBlogDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTimeVi(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = type => parts.find(part => part.type === type)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export function calculateReadTime(content = "") {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export const canManageBlog = role => role === "admin" || role === "superadmin";

export const blogCategoryStyles = {
  Excel: "from-emerald-500 to-teal-700",
  "Dữ liệu": "from-blue-500 to-indigo-700",
  "Quy trình": "from-violet-500 to-purple-700",
  "Báo cáo": "from-orange-500 to-rose-600",
  "Năng suất": "from-cyan-500 to-blue-700",
};
