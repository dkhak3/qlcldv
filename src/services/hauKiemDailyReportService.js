import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getBytes,
  ref,
  uploadBytes,
} from "firebase/storage";
import { saveAs } from "file-saver";
import { firebaseAuth, firebaseStorage, firestore } from "../lib/firebaseClient";
import {
  MAX_HAUKIEM_DAILY_REPORT_BYTES,
  sanitizeHauKiemDailyReportFileName,
  validateHauKiemDailyReportFile,
} from "../utils/hauKiemDailyReport";
import { writeAuditLog } from "./auditLogService";

const COLLECTION = "haukiem_daily_reports";
const DOCUMENT_ID = "current";
const STORAGE_DIRECTORY = "reports/haukiem-daily-report";

function getDocumentRef() {
  if (!firestore) throw new Error("Firestore chưa được cấu hình");
  return doc(firestore, COLLECTION, DOCUMENT_ID);
}

function getStorageInstance() {
  if (!firebaseStorage) {
    throw new Error("Firebase Storage chưa được cấu hình. Hãy kiểm tra VITE_FIREBASE_STORAGE_BUCKET và bật Cloud Storage trong Firebase Console.");
  }
  return firebaseStorage;
}

export function subscribeHauKiemDailyReport(onChange, onError) {
  if (!firestore) {
    onError?.(new Error("Firestore chưa được cấu hình"));
    return () => {};
  }
  return onSnapshot(
    getDocumentRef(),
    snapshot => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    error => onError?.(error),
  );
}

export async function uploadHauKiemDailyReport(file, profile) {
  const storage = getStorageInstance();
  const inspected = validateHauKiemDailyReportFile(file);
  const reportRef = getDocumentRef();
  const previousSnapshot = await getDoc(reportRef);
  const previous = previousSnapshot.exists() ? previousSnapshot.data() : null;
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const storagePath = `${STORAGE_DIRECTORY}/${Date.now()}-${randomId}-${sanitizeHauKiemDailyReportFileName(file.name)}`;
  const objectRef = ref(storage, storagePath);

  await uploadBytes(objectRef, file, {
    contentType: inspected.contentType,
    customMetadata: { originalName: inspected.originalName },
  });

  try {
    await setDoc(reportRef, {
      originalName: inspected.originalName,
      storagePath,
      contentType: inspected.contentType,
      size: inspected.size,
      isVisible: previous ? previous.isVisible !== false : true,
      updatedAt: serverTimestamp(),
      updatedBy: profile?.id || firebaseAuth?.currentUser?.uid || "",
      updatedByName: profile?.fullName || profile?.username || "",
      createdAt: previous?.createdAt || serverTimestamp(),
    });
  } catch (error) {
    await deleteObject(objectRef).catch(() => {});
    throw error;
  }

  if (previous?.storagePath && previous.storagePath !== storagePath) {
    await deleteObject(ref(storage, previous.storagePath)).catch(error => {
      console.warn("Không thể dọn file Báo cáo ngày cũ trên Firebase Storage:", error);
    });
  }

  void writeAuditLog({
    action: "upload",
    entityType: "haukiem_daily_report",
    entityId: DOCUMENT_ID,
    label: "File Báo cáo ngày",
    details: { file: inspected.originalName, size: inspected.size },
  });
  return { originalName: inspected.originalName, size: inspected.size };
}

export async function setHauKiemDailyReportVisibility(isVisible, profile) {
  await updateDoc(getDocumentRef(), {
    isVisible: Boolean(isVisible),
    updatedAt: serverTimestamp(),
    updatedBy: profile?.id || firebaseAuth?.currentUser?.uid || "",
    updatedByName: profile?.fullName || profile?.username || "",
  });
  void writeAuditLog({
    action: "visibility",
    entityType: "haukiem_daily_report",
    entityId: DOCUMENT_ID,
    label: "File Báo cáo ngày",
    details: { isVisible: Boolean(isVisible) },
  });
}

export async function deleteHauKiemDailyReport() {
  const storage = getStorageInstance();
  const reportRef = getDocumentRef();
  const snapshot = await getDoc(reportRef);
  if (!snapshot.exists()) return;
  const report = snapshot.data();

  if (report.storagePath) {
    try {
      await deleteObject(ref(storage, report.storagePath));
    } catch (error) {
      if (error.code !== "storage/object-not-found") throw error;
    }
  }
  await deleteDoc(reportRef);
  void writeAuditLog({
    action: "delete",
    entityType: "haukiem_daily_report",
    entityId: DOCUMENT_ID,
    label: "File Báo cáo ngày",
    details: { file: report.originalName || "" },
  });
}

export async function downloadHauKiemDailyReport(report) {
  const storage = getStorageInstance();
  if (!report?.storagePath) throw new Error("Không tìm thấy file Báo cáo ngày");
  const bytes = await getBytes(ref(storage, report.storagePath), MAX_HAUKIEM_DAILY_REPORT_BYTES);
  const blob = new Blob([bytes], { type: report.contentType || "application/octet-stream" });
  saveAs(blob, report.originalName || "Bao-cao-ngay");
}
