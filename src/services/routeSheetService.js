import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { DEFAULT_ROUTE_SHEETS } from "../data/routeSheets";
import { firestore } from "../lib/firebaseClient";
import { writeAuditLog } from "./auditLogService";
import { normalizeRouteSheet, routeSheetPayload } from "../utils/routeSheet";

const COLLECTION = "route_sheets";

function cloneSeed() {
  return DEFAULT_ROUTE_SHEETS.map(sheet => normalizeRouteSheet({
    ...sheet,
    source: "excel-seed",
    rows: sheet.rows.map(cells => ({ cells: [...cells] })),
  }));
}

function fromSnapshot(snapshot) {
  const data = snapshot.data();
  return normalizeRouteSheet({
    id: snapshot.id,
    ...data,
    source: "firestore",
  });
}

export async function getRouteSheets() {
  if (!firestore) return cloneSeed();
  const snapshots = await getDocs(query(collection(firestore, COLLECTION), orderBy("sortOrder", "asc")));
  if (snapshots.empty) return cloneSeed();
  return snapshots.docs.map(fromSnapshot);
}

export async function ensureRouteSheetsInitialized() {
  if (!firestore) throw new Error("Firebase chưa được cấu hình");
  const snapshots = await getDocs(collection(firestore, COLLECTION));
  if (!snapshots.empty) return false;

  const batch = writeBatch(firestore);
  DEFAULT_ROUTE_SHEETS.forEach(sheet => {
    batch.set(doc(firestore, COLLECTION, sheet.id), {
      ...routeSheetPayload(sheet),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  await writeAuditLog({
    action: "create",
    entityType: "route_sheet",
    entityId: "excel-seed",
    label: "Khởi tạo dữ liệu Tuyến từ file Excel",
    details: { sheetCount: DEFAULT_ROUTE_SHEETS.length },
  });
  return true;
}

export async function createRouteSheet({ name, columnCount = 8, sortOrder = 999 }) {
  if (!String(name || "").trim()) throw new Error("Tên sheet không được để trống");
  await ensureRouteSheetsInitialized();
  const reference = doc(collection(firestore, COLLECTION));
  const sheet = normalizeRouteSheet({
    id: reference.id,
    name: String(name).trim(),
    sortOrder,
    columnCount,
    rows: [{ cells: Array(Math.max(1, Number(columnCount) || 8)).fill("") }],
  });
  await setDoc(reference, {
    ...routeSheetPayload(sheet),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await writeAuditLog({
    action: "create",
    entityType: "route_sheet",
    entityId: reference.id,
    label: `Tạo sheet Tuyến “${sheet.name}”`,
    details: { columnCount: sheet.columnCount },
  });
  return sheet;
}

export async function saveRouteSheet(sheet, audit = {}) {
  if (!sheet?.id) throw new Error("Không xác định được sheet cần lưu");
  if (!String(sheet.name || "").trim()) throw new Error("Tên sheet không được để trống");
  await ensureRouteSheetsInitialized();
  const payload = routeSheetPayload(sheet);
  await setDoc(doc(firestore, COLLECTION, sheet.id), {
    ...payload,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await writeAuditLog({
    action: "update",
    entityType: "route_sheet",
    entityId: sheet.id,
    label: audit.label || `Cập nhật sheet Tuyến “${payload.name}”`,
    details: audit.details || {},
  });
  return { ...sheet, ...payload, source: "firestore" };
}

export async function deleteRouteSheet(sheet) {
  if (!sheet?.id) throw new Error("Không xác định được sheet cần xóa");
  await ensureRouteSheetsInitialized();
  await deleteDoc(doc(firestore, COLLECTION, sheet.id));
  await writeAuditLog({
    action: "delete",
    entityType: "route_sheet",
    entityId: sheet.id,
    label: `Xóa sheet Tuyến “${sheet.name}”`,
    details: { rowCount: sheet.rows?.length || 0, columnCount: sheet.columnCount || 0 },
  });
}
