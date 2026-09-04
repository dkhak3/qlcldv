import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { firestore } from "../lib/firebaseClient";

const TYPE_LABELS = { camera: "Camera", gps: "GPS", speed4h: "Tốc độ, 4H", gstt: "Hỗ trợ GSTT" };

function compactResults(type, results) {
  if (type === "camera" || type === "gps") {
    return (results || []).map(group => ({
      key: group.key,
      title: group.title,
      rows: group.rows.map(({ vehicles, ...row }) => row),
    }));
  }
  if (type === "speed4h") {
    const compactRows = rows => (rows || []).map(row => ({
      stt: row.stt,
      partner: row.partner || "",
      branch: row.branch || "",
      route: row.route || "",
      vehicle: row.vehicle || "",
      employeeName: row.employeeName || "",
      violationCount: Number(row.violationCount) || 0,
      noAnswerEmployee: row.noAnswerEmployee || "",
      noAnswerCount: Number(row.noAnswerCount) || 0,
    }));
    return {
      speed: compactRows(results?.speed),
      fourHour: compactRows(results?.fourHour),
    };
  }
  if (type === "gstt") {
    return (results || []).map(row => ({
      stt: row.stt,
      branch: row.branch || "HCM",
      vehicle: row.vehicle || "",
      route: row.route || "",
      fixed: Number(row.fixed) || 0,
      pending: Number(row.pending) || 0,
      checked: Number(row.checked) || 0,
      unrecoverable: Number(row.unrecoverable) || 0,
      reason: row.reason || "",
    }));
  }
  return results || [];
}

export function countSavedReportRows(type, results) {
  if (type === "camera" || type === "gps") return results.reduce((sum, group) => sum + group.rows.length, 0);
  if (type === "speed4h") return (results.speed?.length || 0) + (results.fourHour?.length || 0);
  return Array.isArray(results) ? results.length : 0;
}

export async function createSavedReport({ type, startDate, endDate, employees, results }, owner) {
  const data = compactResults(type, results);
  const serialized = JSON.stringify(data);
  if (serialized.length > 750000) throw new Error("Báo cáo quá lớn để lưu trực tuyến. Vui lòng thu hẹp khoảng ngày");
  const rowCount = countSavedReportRows(type, results);
  const payload = {
    type,
    typeLabel: TYPE_LABELS[type] || type,
    title: `Báo cáo ${TYPE_LABELS[type] || type} ${startDate} – ${endDate}`,
    startDate,
    endDate,
    employees: String(employees || "").trim(),
    rowCount,
    data,
    ownerId: owner.user.uid,
    ownerName: owner.profile?.fullName || owner.profile?.username || "Người dùng",
    ownerUsername: owner.profile?.username || "",
    ownerRole: owner.role,
    createdAt: serverTimestamp(),
  };
  const reference = await addDoc(collection(firestore, "saved_reports"), payload);
  return { id: reference.id, ...payload, createdAt: new Date().toISOString() };
}

function mapReport(snapshot) {
  const data = snapshot.data();
  return { id: snapshot.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || "" };
}

export async function getVisibleSavedReports(auth) {
  let request;
  if (auth.role === "superadmin") request = collection(firestore, "saved_reports");
  else if (auth.role === "admin") request = query(collection(firestore, "saved_reports"), where("ownerRole", "in", ["user", "admin"]));
  else request = query(collection(firestore, "saved_reports"), where("ownerId", "==", auth.user.uid));
  const snapshots = await getDocs(request);
  return snapshots.docs.map(mapReport).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function canDeleteSavedReport(report, auth) {
  if (report.ownerId === auth.user?.uid) return true;
  if (auth.role === "superadmin") return report.ownerRole !== "superadmin";
  if (auth.role === "admin") return report.ownerRole === "user" || report.ownerRole === "admin";
  return false;
}

export async function deleteSavedReport(id) {
  await deleteDoc(doc(firestore, "saved_reports", id));
}
