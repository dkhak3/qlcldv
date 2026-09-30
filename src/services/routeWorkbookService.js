import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "../lib/firebaseClient";
import { writeAuditLog } from "./auditLogService";
import { MAX_ROUTE_WORKBOOK_BYTES, parseRouteWorkbook } from "../utils/routeExcelPreview";
import {
  base64ToBytes,
  bytesToBase64,
  joinBase64Chunks,
  routeWorkbookChunkId,
  sha256Hex,
  splitBase64,
} from "../utils/routeWorkbookStorage";

const META_COLLECTION = "route_workbooks";
const META_DOCUMENT = "current";
const CHUNK_COLLECTION = "route_workbook_chunks";
const BATCH_CHUNK_LIMIT = 8;

function toIso(value) {
  if (!value) return "";
  if (value.toDate) return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function currentMetaRef() {
  return doc(firestore, META_COLLECTION, META_DOCUMENT);
}

function makeUploadId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validateFileBasics(file) {
  if (!file) throw new Error("Chưa chọn file Excel");
  if (!String(file.name || "").toLowerCase().endsWith(".xlsx")) {
    throw new Error("Chỉ chấp nhận file Excel .xlsx");
  }
  if (!file.size) throw new Error("File Excel trống");
  if (file.size > MAX_ROUTE_WORKBOOK_BYTES) {
    throw new Error(`File Excel vượt quá ${Math.round(MAX_ROUTE_WORKBOOK_BYTES / 1024 / 1024)} MB`);
  }
}

export async function inspectRouteWorkbookFile(file) {
  validateFileBasics(file);
  const buffer = await file.arrayBuffer();
  const [preview, hash] = await Promise.all([
    parseRouteWorkbook(buffer),
    sha256Hex(buffer),
  ]);
  return {
    buffer,
    preview,
    hash,
    originalName: file.name,
    size: file.size,
  };
}

export async function getRouteWorkbookMeta() {
  if (!firestore) throw new Error("Firebase chưa được cấu hình");
  const snapshot = await getDoc(currentMetaRef());
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    updatedAt: toIso(data.updatedAt),
  };
}

async function writeChunks(uploadId, chunks) {
  for (let offset = 0; offset < chunks.length; offset += BATCH_CHUNK_LIMIT) {
    const batch = writeBatch(firestore);
    chunks.slice(offset, offset + BATCH_CHUNK_LIMIT).forEach((content, relativeIndex) => {
      const index = offset + relativeIndex;
      batch.set(doc(firestore, CHUNK_COLLECTION, routeWorkbookChunkId(uploadId, index)), {
        uploadId,
        index,
        content,
      });
    });
    await batch.commit();
  }
}

async function deleteChunks(meta) {
  if (!meta?.uploadId || !Number.isInteger(Number(meta.chunkCount))) return;
  const count = Number(meta.chunkCount);
  for (let offset = 0; offset < count; offset += BATCH_CHUNK_LIMIT) {
    const batch = writeBatch(firestore);
    for (let index = offset; index < Math.min(count, offset + BATCH_CHUNK_LIMIT); index += 1) {
      batch.delete(doc(firestore, CHUNK_COLLECTION, routeWorkbookChunkId(meta.uploadId, index)));
    }
    await batch.commit();
  }
}

export async function getRouteWorkbookBuffer(metaInput = null) {
  if (!firestore) throw new Error("Firebase chưa được cấu hình");
  const meta = metaInput || await getRouteWorkbookMeta();
  if (!meta) return null;

  const count = Number(meta.chunkCount);
  if (!meta.uploadId || !Number.isInteger(count) || count <= 0) {
    throw new Error("Thông tin file Tuyến trên hệ thống không hợp lệ");
  }

  const snapshots = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      getDoc(doc(firestore, CHUNK_COLLECTION, routeWorkbookChunkId(meta.uploadId, index)))
    )
  );

  const chunks = snapshots.map((snapshot, index) => {
    if (!snapshot.exists()) throw new Error(`Thiếu dữ liệu file Excel (phần ${index + 1}/${count})`);
    const data = snapshot.data();
    return { index: Number(data.index), content: data.content };
  });

  const bytes = base64ToBytes(joinBase64Chunks(chunks));
  if (meta.size && bytes.byteLength !== Number(meta.size)) {
    throw new Error("Dung lượng file Excel không khớp metadata. Vui lòng tải file lên lại.");
  }
  return bytes.buffer;
}

export async function saveRouteWorkbook(file, options = {}) {
  if (!firestore) throw new Error("Firebase chưa được cấu hình");
  const inspected = options.inspection || await inspectRouteWorkbookFile(file);
  const oldMeta = await getRouteWorkbookMeta().catch(() => null);
  const uploadId = makeUploadId();
  const chunks = splitBase64(bytesToBase64(new Uint8Array(inspected.buffer)));

  await writeChunks(uploadId, chunks);

  const user = firebaseAuth?.currentUser;
  const updatedAt = new Date().toISOString();
  const metaPayload = {
    uploadId,
    originalName: inspected.originalName,
    size: inspected.size,
    hash: inspected.hash,
    sheetNames: inspected.preview.sheetNames,
    sheetCount: inspected.preview.sheetNames.length,
    totalCells: inspected.preview.totalCells,
    chunkCount: chunks.length,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    uploadedById: user?.uid || "",
    uploadedByName: String(options.uploadedByName || user?.displayName || user?.email?.split("@")[0] || "Admin"),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(currentMetaRef(), metaPayload, { merge: false });
  } catch (error) {
    await deleteChunks({ uploadId, chunkCount: chunks.length }).catch(() => null);
    throw error;
  }

  if (oldMeta?.uploadId && oldMeta.uploadId !== uploadId) {
    void deleteChunks(oldMeta).catch(error => console.warn("Không thể dọn file Tuyến cũ:", error));
  }

  void writeAuditLog({
    action: "upload",
    entityType: "route_workbook",
    entityId: META_DOCUMENT,
    label: "Cập nhật file Excel Tuyến",
    details: {
      file: inspected.originalName,
      size: inspected.size,
      sheetCount: inspected.preview.sheetNames.length,
      hash: inspected.hash,
    },
  });

  return {
    id: META_DOCUMENT,
    ...metaPayload,
    updatedAt,
  };
}

export async function deleteRouteWorkbook() {
  if (!firestore) throw new Error("Firebase chưa được cấu hình");
  const meta = await getRouteWorkbookMeta();
  if (!meta) return;
  await deleteDoc(currentMetaRef());
  await deleteChunks(meta);
  void writeAuditLog({
    action: "delete",
    entityType: "route_workbook",
    entityId: META_DOCUMENT,
    label: "Xóa file Excel Tuyến",
    details: { file: meta.originalName || "", size: Number(meta.size) || 0 },
  });
}
