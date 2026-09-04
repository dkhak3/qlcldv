import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, internalEmail, normalizeUsername, onlyPost, parseBody, requireRole, sendApiError } from "./_firebaseAdmin.js";

const manageableRoles = {
  admin: new Set(["user", "admin"]),
  superadmin: new Set(["user", "admin", "superadmin"]),
};

function canManage(callerRole, targetRole) {
  return manageableRoles[callerRole]?.has(targetRole || "user");
}

function serializeUser(record, profile = {}) {
  return {
    id: record.uid,
    username: profile.username || record.email?.split("@")[0] || "",
    fullName: profile.fullName || record.displayName || "",
    role: profile.role || record.customClaims?.role || "user",
    createdAt: record.metadata.creationTime || "",
    lastSignInAt: record.metadata.lastSignInTime || "",
    disabled: Boolean(record.disabled),
  };
}

async function getTarget(id) {
  const record = await adminAuth.getUser(id);
  const profileSnapshot = await adminDb.collection("users").doc(id).get();
  const profile = profileSnapshot.exists ? profileSnapshot.data() : {};
  return { record, profile, role: profile.role || record.customClaims?.role || "user" };
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  try {
    const caller = await requireRole(req, ["admin", "superadmin"]);
    const { action, payload = {} } = parseBody(req);

    if (action === "list") {
      const result = await adminAuth.listUsers(1000);
      const profiles = await adminDb.collection("users").get();
      const profileMap = new Map(profiles.docs.map(item => [item.id, item.data()]));
      const users = result.users
        .map(record => serializeUser(record, profileMap.get(record.uid)))
        .filter(user => user.id !== caller.uid && canManage(caller.role, user.role))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ ok: true, users });
    }

    if (action === "create") {
      const role = payload.role || "user";
      if (!canManage(caller.role, role)) throw Object.assign(new Error("Bạn không được tạo tài khoản với quyền này"), { status: 403 });
      const username = normalizeUsername(payload.username);
      const fullName = String(payload.fullName || "").trim();
      if (!fullName) throw new Error("Vui lòng nhập họ và tên");
      if (String(payload.password || "").length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự");
      let record;
      try {
        record = await adminAuth.createUser({ email: internalEmail(username), password: payload.password, displayName: fullName, emailVerified: true });
        await adminAuth.setCustomUserClaims(record.uid, { role });
        await adminDb.collection("users").doc(record.uid).set({ username, fullName, role, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      } catch (error) {
        if (record?.uid) await adminAuth.deleteUser(record.uid).catch(() => {});
        throw error;
      }
      const saved = await adminAuth.getUser(record.uid);
      return res.status(200).json({ ok: true, user: serializeUser(saved, { username, fullName, role }) });
    }

    if (action === "update") {
      if (!payload.id || payload.id === caller.uid) throw Object.assign(new Error("Không thể chỉnh sửa chính tài khoản đang đăng nhập tại đây"), { status: 403 });
      const target = await getTarget(payload.id);
      if (!canManage(caller.role, target.role)) throw Object.assign(new Error("Bạn không có quyền chỉnh sửa tài khoản này"), { status: 403 });
      const nextRole = payload.role || target.role;
      if (!canManage(caller.role, nextRole)) throw Object.assign(new Error("Bạn không được cấp quyền này"), { status: 403 });
      const username = normalizeUsername(payload.username || target.profile.username || target.record.email?.split("@")[0]);
      const fullName = String(payload.fullName || target.profile.fullName || target.record.displayName || "").trim();
      const update = { email: internalEmail(username), displayName: fullName };
      if (payload.password) {
        if (String(payload.password).length < 8) throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự");
        update.password = payload.password;
      }
      const record = await adminAuth.updateUser(payload.id, update);
      await adminAuth.setCustomUserClaims(payload.id, { role: nextRole });
      await adminDb.collection("users").doc(payload.id).set({ username, fullName, role: nextRole, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return res.status(200).json({ ok: true, user: serializeUser(record, { username, fullName, role: nextRole }) });
    }

    if (action === "delete") {
      if (!payload.id || payload.id === caller.uid) throw Object.assign(new Error("Không thể xóa chính tài khoản đang đăng nhập"), { status: 403 });
      const target = await getTarget(payload.id);
      if (!canManage(caller.role, target.role)) throw Object.assign(new Error("Bạn không có quyền xóa tài khoản này"), { status: 403 });
      await adminAuth.deleteUser(payload.id);
      await adminDb.collection("users").doc(payload.id).delete();
      return res.status(200).json({ ok: true });
    }

    throw new Error("Thao tác không hợp lệ");
  } catch (error) {
    sendApiError(res, error);
  }
}
