export const ROUTE_WORKBOOK_CHUNK_CHARS = 500000;

export function bytesToBase64(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < view.length; index += chunk) {
    binary += String.fromCharCode(...view.subarray(index, Math.min(index + chunk, view.length)));
  }
  return btoa(binary);
}

export function base64ToBytes(value) {
  const binary = atob(String(value || ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function splitBase64(value, chunkSize = ROUTE_WORKBOOK_CHUNK_CHARS) {
  const source = String(value || "");
  const size = Math.max(1000, Number(chunkSize) || ROUTE_WORKBOOK_CHUNK_CHARS);
  const chunks = [];
  for (let index = 0; index < source.length; index += size) chunks.push(source.slice(index, index + size));
  return chunks;
}

export function routeWorkbookChunkId(uploadId, index) {
  return `${String(uploadId)}_${String(index).padStart(4, "0")}`;
}

export function joinBase64Chunks(chunks) {
  return [...(chunks || [])]
    .sort((a, b) => Number(a.index) - Number(b.index))
    .map(item => String(item.content || ""))
    .join("");
}

export async function sha256Hex(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer || []).buffer;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
