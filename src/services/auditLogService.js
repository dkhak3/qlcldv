import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, firestore } from "../lib/firebaseClient";

export const AUDIT_ACTION_LABELS = {
  create: "Tạo mới",
  update: "Cập nhật",
  delete: "Xóa",
  visibility: "Đổi trạng thái",
  upload: "Tải mẫu lên",
  restore: "Khôi phục",
  login: "Đăng nhập",
};

function toIso(value) {
  if (!value) return "";
  if (value.toDate) return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

async function getActor() {
  const user = firebaseAuth?.currentUser;
  if (!user || !firestore) return null;
  const [token, snapshot] = await Promise.all([
    user.getIdTokenResult(),
    getDoc(doc(firestore, "users", user.uid)).catch(() => null),
  ]);
  const profile = snapshot?.exists?.() ? snapshot.data() : {};
  return {
    actorId: user.uid,
    actorName: profile.fullName || profile.username || user.email?.split("@")[0] || "Người dùng",
    actorUsername: profile.username || user.email?.split("@")[0] || "",
    actorRole: profile.role || token.claims.role || "user",
  };
}

export async function writeAuditLog({ action, entityType, entityId = "", label = "", details = {} }) {
  try {
    const actor = await getActor();
    if (!actor || !firestore) return null;
    const safeDetails = Object.fromEntries(
      Object.entries(details || {}).filter(([, value]) => value == null || ["string", "number", "boolean"].includes(typeof value)),
    );
    const reference = await addDoc(collection(firestore, "audit_logs"), {
      ...actor,
      action: String(action || "update"),
      entityType: String(entityType || "system"),
      entityId: String(entityId || ""),
      label: String(label || ""),
      details: safeDetails,
      createdAt: serverTimestamp(),
    });
    return reference.id;
  } catch (error) {
    console.warn("Không thể ghi Audit Log:", error);
    return null;
  }
}

export async function getAuditLogs(maxItems = 200) {
  const snapshots = await getDocs(query(
    collection(firestore, "audit_logs"),
    orderBy("createdAt", "desc"),
    limit(Math.max(1, Math.min(Number(maxItems) || 200, 500))),
  ));
  return snapshots.docs.map(snapshot => {
    const data = snapshot.data();
    return { id: snapshot.id, ...data, createdAt: toIso(data.createdAt) };
  });
}
