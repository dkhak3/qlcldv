import ExcelJS from "exceljs";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { firestore } from "../lib/firebaseClient";
import { REPORT_TEMPLATE_DEFINITIONS } from "../utils/reportSchemas";
import { writeAuditLog } from "./auditLogService";

const CURRENT_COLLECTION = "report_templates";
const VERSION_COLLECTION = "report_template_versions";
const MAX_TEMPLATE_BYTES = 700 * 1024;

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunk, bytes.length)));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function toIso(value) {
  if (!value) return "";
  if (value.toDate) return value.toDate().toISOString();
  return value;
}

async function inspectTemplateBuffer(buffer, templateKey) {
  const definition = REPORT_TEMPLATE_DEFINITIONS[templateKey];
  if (!definition) throw new Error("Loại mẫu báo cáo không hợp lệ");
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(buffer); }
  catch { throw new Error("File mẫu XLSX bị hỏng hoặc không đúng định dạng"); }
  const sheetNames = workbook.worksheets.map(sheet => sheet.name);
  const missing = definition.requiredSheets.filter(required =>
    !sheetNames.some(name => name.trim().toLocaleUpperCase("vi") === required.trim().toLocaleUpperCase("vi")),
  );
  if (missing.length) throw new Error(`File mẫu thiếu sheet bắt buộc: ${missing.join(", ")}`);
  return sheetNames;
}

export async function validateReportTemplateFile(file, templateKey) {
  if (!file?.name?.toLowerCase().endsWith(".xlsx")) throw new Error("Chỉ chấp nhận file Excel .xlsx");
  if (file.size > MAX_TEMPLATE_BYTES) throw new Error("File mẫu quá lớn để lưu trên hệ thống (tối đa 700 KB)");
  const buffer = await file.arrayBuffer();
  const sheetNames = await inspectTemplateBuffer(buffer, templateKey);
  return { buffer, sheetNames, hash: await sha256(buffer), size: file.size, originalName: file.name };
}

export async function getReportTemplates() {
  const snapshots = await getDocs(collection(firestore, CURRENT_COLLECTION));
  const stored = new Map(snapshots.docs.map(snapshot => [snapshot.id, { id: snapshot.id, ...snapshot.data() }]));
  return Object.values(REPORT_TEMPLATE_DEFINITIONS).map(definition => {
    const item = stored.get(definition.key);
    return {
      ...definition,
      ...(item || {}),
      source: item?.contentBase64 ? "firestore" : "static",
      updatedAt: toIso(item?.updatedAt),
    };
  });
}

export async function getReportTemplateVersions(templateKey) {
  const snapshots = await getDocs(query(collection(firestore, VERSION_COLLECTION), where("templateKey", "==", templateKey)));
  return snapshots.docs.map(snapshot => {
    const data = snapshot.data();
    return { id: snapshot.id, ...data, createdAt: toIso(data.createdAt) };
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function saveReportTemplate(templateKey, file) {
  const definition = REPORT_TEMPLATE_DEFINITIONS[templateKey];
  if (!definition) throw new Error("Loại mẫu báo cáo không hợp lệ");
  const inspected = await validateReportTemplateFile(file, templateKey);
  const contentBase64 = bytesToBase64(new Uint8Array(inspected.buffer));
  const versionPayload = {
    templateKey,
    label: definition.label,
    originalName: inspected.originalName,
    size: inspected.size,
    hash: inspected.hash,
    sheetNames: inspected.sheetNames,
    contentBase64,
    createdAt: serverTimestamp(),
  };
  const versionRef = await addDoc(collection(firestore, VERSION_COLLECTION), versionPayload);
  await setDoc(doc(firestore, CURRENT_COLLECTION, templateKey), {
    ...versionPayload,
    versionId: versionRef.id,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  void writeAuditLog({ action: "upload", entityType: "report_template", entityId: templateKey, label: definition.label, details: { file: file.name, size: file.size, hash: inspected.hash } });
  return { ...definition, ...versionPayload, versionId: versionRef.id, source: "firestore", updatedAt: new Date().toISOString() };
}

export async function restoreReportTemplate(templateKey, version) {
  const definition = REPORT_TEMPLATE_DEFINITIONS[templateKey];
  if (!definition || !version?.contentBase64) throw new Error("Phiên bản mẫu không hợp lệ");
  await setDoc(doc(firestore, CURRENT_COLLECTION, templateKey), {
    templateKey,
    label: definition.label,
    originalName: version.originalName,
    size: version.size,
    hash: version.hash,
    sheetNames: version.sheetNames || [],
    contentBase64: version.contentBase64,
    versionId: version.id,
    restoredFromVersionId: version.id,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  void writeAuditLog({ action: "restore", entityType: "report_template", entityId: templateKey, label: definition.label, details: { file: version.originalName || "", versionId: version.id } });
}

export async function getReportTemplateBuffer(templateKey) {
  const definition = REPORT_TEMPLATE_DEFINITIONS[templateKey];
  if (!definition) throw new Error("Không tìm thấy cấu hình file mẫu");
  if (firestore) {
    try {
      const snapshot = await getDoc(doc(firestore, CURRENT_COLLECTION, templateKey));
      const base64 = snapshot.data()?.contentBase64;
      if (snapshot.exists() && base64) {
        const bytes = base64ToBytes(base64);
        if (bytes.byteLength < 1000) throw new Error("File mẫu trên Firestore không hợp lệ");
        return bytes.buffer;
      }
    } catch (error) {
      console.warn("Không thể dùng template Firestore, chuyển sang file mặc định:", error);
    }
  }
  const response = await fetch(`${definition.staticPath}?v=managed-templates-20260921`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Không tải được file mẫu ${definition.label}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 1000) throw new Error(`File mẫu ${definition.label} không hợp lệ`);
  return buffer;
}

export { REPORT_TEMPLATE_DEFINITIONS };
