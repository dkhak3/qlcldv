export function getGoogleDriveFileId(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  const pathMatch = value.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch) return pathMatch[1];
  try {
    const parsed = new URL(value);
    if (!parsed.hostname.endsWith("drive.google.com")) return "";
    return parsed.searchParams.get("id") || "";
  } catch {
    return "";
  }
}

export function toGoogleDrivePreviewUrl(url) {
  const fileId = getGoogleDriveFileId(url);
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : "";
}

export function isGoogleDriveUrl(url) {
  return Boolean(getGoogleDriveFileId(url));
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh"));
    reader.readAsDataURL(file);
  });
}
