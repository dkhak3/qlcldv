import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, internalEmail, normalizeUsername, onlyPost, parseBody, sendApiError } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  try {
    const providedSecret = String(req.headers["x-setup-secret"] || "");
    const setupSecret = process.env.SETUP_SECRET || "";
    if (!setupSecret || setupSecret.length < 24 || providedSecret !== setupSecret) {
      throw Object.assign(new Error("Mã thiết lập không đúng"), { status: 403 });
    }
    const existing = await adminDb.collection("users").where("role", "==", "superadmin").limit(1).get();
    if (!existing.empty) throw Object.assign(new Error("Hệ thống đã có SuperAdmin; trang khởi tạo đã được khóa"), { status: 409 });
    const { username: rawUsername, fullName: rawFullName, password } = parseBody(req);
    const username = normalizeUsername(rawUsername);
    const fullName = String(rawFullName || "").trim();
    if (!fullName) throw new Error("Vui lòng nhập họ và tên");
    if (String(password || "").length < 10) throw new Error("Mật khẩu SuperAdmin phải có ít nhất 10 ký tự");
    let record;
    try {
      record = await adminAuth.createUser({ email: internalEmail(username), password, displayName: fullName, emailVerified: true });
      await adminAuth.setCustomUserClaims(record.uid, { role: "superadmin" });
      await adminDb.collection("users").doc(record.uid).set({ username, fullName, role: "superadmin", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    } catch (error) {
      if (record?.uid) await adminAuth.deleteUser(record.uid).catch(() => {});
      throw error;
    }
    return res.status(200).json({ ok: true, username });
  } catch (error) {
    sendApiError(res, error);
  }
}
