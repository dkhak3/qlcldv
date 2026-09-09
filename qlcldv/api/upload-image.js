import { onlyPost, parseBody, requireRole, sendApiError } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  try {
    await requireRole(req, ["admin", "superadmin"]);
    const { image, mimeType, name } = parseBody(req);
    if (!String(mimeType || "").startsWith("image/")) throw new Error("Chỉ chấp nhận file hình ảnh");
    if (!image || String(image).length > 4_200_000) throw new Error("Ảnh không hợp lệ hoặc lớn hơn 3 MB");
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) throw new Error("Máy chủ chưa cấu hình IMGBB_API_KEY");
    const body = new URLSearchParams({ image: String(image), name: String(name || "blog-image").replace(/\.[^.]+$/, "").slice(0, 80) });
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, { method: "POST", body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success || !result.data?.url) throw new Error(result.error?.message || "ImgBB không thể lưu ảnh");
    return res.status(200).json({ ok: true, url: result.data.display_url || result.data.url });
  } catch (error) {
    sendApiError(res, error);
  }
}
