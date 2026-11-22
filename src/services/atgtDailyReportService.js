import {
  Bytes,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { saveAs } from "file-saver";
import { firebaseAuth, firestore } from "../lib/firebaseClient";
import {
  MAX_ATGT_DAILY_REPORT_BYTES,
  validateAtgtDailyReportFile,
} from "../utils/atgtDailyReport";
import { writeAuditLog } from "./auditLogService";

const COLLECTION = "atgt_daily_reports";
const DOCUMENT_ID = "current";
const FILE_DOCUMENT_ID = "current_file";

function getDocumentRef() {
  if (!firestore) throw new Error("Firestore chưa được cấu hình");
  return doc(firestore, COLLECTION, DOCUMENT_ID);
}

function getFileDocumentRef() {
  if (!firestore) throw new Error("Firestore chưa được cấu hình");
  return doc(firestore, COLLECTION, FILE_DOCUMENT_ID);
}

export function subscribeAtgtDailyReport(onChange, onError) {
  if (!firestore) {
    onError?.(new Error("Firestore chưa được cấu hình"));
    return () => {};
  }

  return onSnapshot(
    getDocumentRef(),
    snapshot => {
      const report = snapshot.exists() ? snapshot.data() : null;
      onChange?.(report?.storageType === "firestore" ? { id: snapshot.id, ...report } : null);
    },
    error => onError?.(error),
  );
}

export async function uploadAtgtDailyReport(file, profile) {
  const inspected = validateAtgtDailyReportFile(file);
  const reportRef = getDocumentRef();
  const fileRef = getFileDocumentRef();
  const previousSnapshot = await getDoc(reportRef);
  const previous = previousSnapshot.exists() ? previousSnapshot.data() : null;
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  if (fileBytes.byteLength !== inspected.size) {
    throw new Error("Không thể đọc đầy đủ dữ liệu của file đã chọn");
  }
  if (fileBytes.byteLength > MAX_ATGT_DAILY_REPORT_BYTES) {
    throw new Error("Dung lượng file tối đa là 500 KB");
  }

  const fileData = Bytes.fromUint8Array(fileBytes);
  const updatedBy = profile?.id || firebaseAuth?.currentUser?.uid || "";
  const updatedByName = profile?.fullName || profile?.username || "";
  const batch = writeBatch(firestore);

  batch.set(fileRef, {
    fileData,
    originalName: inspected.originalName,
    contentType: inspected.contentType,
    size: fileBytes.byteLength,
    updatedAt: serverTimestamp(),
  });

  batch.set(reportRef, {
    storageType: "firestore",
    originalName: inspected.originalName,
    contentType: inspected.contentType,
    size: fileBytes.byteLength,
    isVisible: previous?.storageType === "firestore" ? previous.isVisible !== false : true,
    updatedAt: serverTimestamp(),
    updatedBy,
    updatedByName,
    createdAt: previous?.storageType === "firestore" && previous.createdAt
      ? previous.createdAt
      : serverTimestamp(),
  });

  await batch.commit();

  void writeAuditLog({
    action: "upload",
    entityType: "atgt_daily_report",
    entityId: DOCUMENT_ID,
    label: "File Báo cáo ngày",
    details: { file: inspected.originalName, size: fileBytes.byteLength },
  });

  return { originalName: inspected.originalName, size: fileBytes.byteLength };
}

export async function setAtgtDailyReportVisibility(isVisible, profile) {
  await updateDoc(getDocumentRef(), {
    isVisible: Boolean(isVisible),
    updatedAt: serverTimestamp(),
    updatedBy: profile?.id || firebaseAuth?.currentUser?.uid || "",
    updatedByName: profile?.fullName || profile?.username || "",
  });

  void writeAuditLog({
    action: "visibility",
    entityType: "atgt_daily_report",
    entityId: DOCUMENT_ID,
    label: "File Báo cáo ngày",
    details: { isVisible: Boolean(isVisible) },
  });
}

export async function deleteAtgtDailyReport() {
  const reportRef = getDocumentRef();
  const fileRef = getFileDocumentRef();
  const snapshot = await getDoc(reportRef);
  const report = snapshot.exists() ? snapshot.data() : null;
  const batch = writeBatch(firestore);

  batch.delete(reportRef);
  batch.delete(fileRef);
  await batch.commit();

  if (!report) return;

  void writeAuditLog({
    action: "delete",
    entityType: "atgt_daily_report",
    entityId: DOCUMENT_ID,
    label: "File Báo cáo ngày",
    details: { file: report.originalName || "" },
  });
}

export async function downloadAtgtDailyReport(report) {
  if (report?.storageType !== "firestore") {
    throw new Error("Không tìm thấy nội dung File Báo cáo ngày trong Firestore");
  }
  if (report.isVisible === false) {
    throw new Error("File Báo cáo ngày hiện đang được ẩn");
  }

  const snapshot = await getDoc(getFileDocumentRef());
  if (!snapshot.exists()) {
    throw new Error("Không tìm thấy nội dung File Báo cáo ngày trong Firestore");
  }

  const fileData = snapshot.data()?.fileData;
  if (!fileData || typeof fileData.toUint8Array !== "function") {
    throw new Error("Dữ liệu File Báo cáo ngày không hợp lệ");
  }

  const bytes = fileData.toUint8Array();
  if (bytes.byteLength > MAX_ATGT_DAILY_REPORT_BYTES) {
    throw new Error("Dung lượng file vượt quá giới hạn 500 KB");
  }

  const blob = new Blob([bytes], { type: report.contentType || "application/octet-stream" });
  saveAs(blob, report.originalName || "Bao-cao-ngay");
}
