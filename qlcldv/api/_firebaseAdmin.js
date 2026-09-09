import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

function adminApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = getAuth(adminApp());
export const adminDb = getFirestore(adminApp());

export function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); }
    catch { return {}; }
  }
  return req.body;
}

export function onlyPost(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "POST") return true;
  res.setHeader("Allow", "POST");
  res.status(405).json({ ok: false, error: "Phương thức không được hỗ trợ" });
  return false;
}

export async function requireRole(req, allowedRoles) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw Object.assign(new Error("Bạn chưa đăng nhập"), { status: 401 });
  const decoded = await adminAuth.verifyIdToken(token, true);
  if (!allowedRoles.includes(decoded.role)) {
    throw Object.assign(new Error("Bạn không có quyền thực hiện thao tác này"), { status: 403 });
  }
  return decoded;
}

export function sendApiError(res, error) {
  const status = error.status || (error.code === "auth/id-token-expired" ? 401 : 400);
  const knownMessages = {
    "auth/email-already-exists": "Tên đăng nhập đã tồn tại",
    "auth/user-not-found": "Không tìm thấy tài khoản",
    "auth/invalid-password": "Mật khẩu không hợp lệ",
    "auth/invalid-email": "Tên đăng nhập không hợp lệ",
  };
  res.status(status).json({ ok: false, error: knownMessages[error.code] || error.message || "Thao tác thất bại" });
}

export function normalizeUsername(value) {
  const username = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("Tên đăng nhập gồm 3–32 ký tự: chữ thường không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang");
  }
  return username;
}

export function internalEmail(username) {
  return `${normalizeUsername(username)}@qlcldv.local`;
}
