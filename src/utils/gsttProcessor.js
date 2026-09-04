import ExcelJS from "exceljs";
import { normalizeText } from "./cameraProcessor.js";

const FIXED_STATUSES = new Set([
  "HOAN TAT KHOI PHUC GPS",
  "DONG TRUNG JOB",
  "DONG TRUNG YEU CAU XU LY CUA BP QLCL",
  "HOAN TAT KHOI PHUC CAMERA",
  "HOAN TAT KHOI PHUC GPS VA CAMERA",
  "DONG GSTT XAC NHAN",
  // Tên trạng thái được dùng trong các sheet đầu năm 2026.
  "HOAN TAT KHOI PHUC KHAC PHUC",
]);

const PENDING_STATUSES = new Set([
  "CHO XU LY",
  "CHO LAP DAT THAY THE THIET BI",
]);

const UNRECOVERABLE_STATUSES = new Set([
  "KHONG THE KHOI PHUC KHAC PHUC",
]);

function scalarValue(value) {
  if (value?.result !== undefined) return value.result;
  if (value?.richText) return value.richText.map(item => item.text).join("");
  if (value?.text !== undefined) return value.text;
  return value;
}

function cleanText(value) {
  return String(scalarValue(value) ?? "").replace(/\s+/g, " ").trim();
}

function comparisonText(value) {
  return normalizeText(scalarValue(value)).replace(/[^A-Z0-9]+/g, " ").trim();
}

function normalizeVehicle(value) {
  return normalizeText(scalarValue(value)).replace(/[^A-Z0-9]/g, "");
}

function parseDate(value) {
  const item = scalarValue(value);
  if (item instanceof Date && !Number.isNaN(item.getTime())) {
    return `${item.getUTCFullYear()}-${String(item.getUTCMonth() + 1).padStart(2, "0")}-${String(item.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof item === "number" && Number.isFinite(item)) {
    const date = new Date(Math.round((item - 25569) * 86400 * 1000));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  const text = String(item ?? "").trim();
  let match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : null;
}

function monthKeyFromSheetName(name) {
  const digits = String(name ?? "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(digits)) return null;
  const month = Number(digits.slice(0, 2));
  const year = Number(digits.slice(2));
  return month >= 1 && month <= 12 && year >= 2000 ? digits : null;
}

function selectedMonthKeys(startDate, endDate) {
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [endYear, endMonth] = endDate.split("-").map(Number);
  const cursor = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const last = new Date(Date.UTC(endYear, endMonth - 1, 1));
  const keys = [];
  while (cursor <= last) {
    keys.push(`${String(cursor.getUTCMonth() + 1).padStart(2, "0")}${cursor.getUTCFullYear()}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

function findColumns(worksheet) {
  let headerRow = null;
  let headers = [];
  for (let row = 1; row <= Math.min(10, worksheet.rowCount); row += 1) {
    headers = [];
    for (let column = 1; column <= Math.min(30, worksheet.columnCount); column += 1) {
      headers[column] = comparisonText(worksheet.getCell(row, column).value);
    }
    const hasDate = headers.some(value => value.startsWith("THOI GIAN YC HO TRO"));
    const hasVehicle = headers.some(value => value === "SO XE");
    const hasStatus = headers.some(value => value === "TRANG THAI");
    if (hasDate && hasVehicle && hasStatus) {
      headerRow = row;
      break;
    }
  }
  if (!headerRow) return null;

  const matchers = {
    date: header => header.startsWith("THOI GIAN YC HO TRO"),
    vehicle: header => header === "SO XE",
    route: header => header === "TUYEN",
    status: header => header === "TRANG THAI",
    feedback: header => header.startsWith("PHAN HOI CUA DOI TAC BINH ANH"),
  };
  const columns = {};
  const missing = [];
  Object.entries(matchers).forEach(([key, matches]) => {
    const column = headers.findIndex(header => matches(header || ""));
    if (column < 1) missing.push(key);
    else columns[key] = column;
  });
  return { headerRow, dataStart: headerRow + 1, columns, missing };
}

function classifyStatus(value) {
  const status = comparisonText(value);
  if (FIXED_STATUSES.has(status)) return "fixed";
  if (PENDING_STATUSES.has(status)) return "pending";
  if (UNRECOVERABLE_STATUSES.has(status)) return "unrecoverable";
  if (status.startsWith("DA KIEM TRA")) return "checked";
  return null;
}

function readMonthSheet(worksheet, startDate, endDate) {
  const layout = findColumns(worksheet);
  if (!layout || layout.missing.length) {
    const details = layout?.missing.length ? ` Thiếu cột: ${layout.missing.join(", ")}.` : "";
    throw new Error(`File Hỗ trợ GSTT có cấu trúc không hợp lệ tại sheet “${worksheet.name}”.${details}`);
  }

  const records = [];
  for (let rowNumber = layout.dataStart; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const date = parseDate(row.getCell(layout.columns.date).value);
    if (!date || date < startDate || date > endDate) continue;

    const vehicle = normalizeVehicle(row.getCell(layout.columns.vehicle).value);
    if (!vehicle) continue;
    const rawStatus = cleanText(row.getCell(layout.columns.status).value);
    if (!rawStatus) continue;
    const category = classifyStatus(rawStatus);
    if (!category) {
      throw new Error(`Trạng thái “${rawStatus}” tại sheet “${worksheet.name}”, dòng ${rowNumber} chưa được hỗ trợ`);
    }

    records.push({
      date,
      sourceSheet: worksheet.name,
      sourceRow: rowNumber,
      branch: "HCM",
      vehicle,
      route: cleanText(row.getCell(layout.columns.route).value),
      status: rawStatus,
      fixed: category === "fixed" ? 1 : 0,
      pending: category === "pending" ? 1 : 0,
      checked: category === "checked" ? 1 : 0,
      unrecoverable: category === "unrecoverable" ? 1 : 0,
      reason: category === "unrecoverable" ? cleanText(row.getCell(layout.columns.feedback).value) : "",
    });
  }
  return records;
}

async function loadWorkbook(file) {
  if (!file || !file.name?.toLowerCase().endsWith(".xlsx")) {
    throw new Error("File Hỗ trợ GSTT không hợp lệ. Vui lòng chọn đúng file Excel .xlsx");
  }
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(await file.arrayBuffer()); }
  catch { throw new Error("File Hỗ trợ GSTT không hợp lệ hoặc đã bị hỏng"); }
  return workbook;
}

export async function processGsttFile(file, startDate, endDate) {
  const workbook = await loadWorkbook(file);
  const sheetsByMonth = new Map();
  workbook.worksheets.forEach(sheet => {
    const key = monthKeyFromSheetName(sheet.name);
    if (key && !sheetsByMonth.has(key)) sheetsByMonth.set(key, sheet);
  });

  const monthKeys = selectedMonthKeys(startDate, endDate);
  const missingMonths = monthKeys.filter(key => !sheetsByMonth.has(key));
  if (missingMonths.length) {
    const labels = missingMonths.map(key => `${key.slice(0, 2)}/${key.slice(2)}`);
    throw new Error(`File Hỗ trợ GSTT có cấu trúc không hợp lệ. Không tìm thấy sheet tháng: ${labels.join(", ")}`);
  }

  const records = monthKeys.flatMap(key => readMonthSheet(sheetsByMonth.get(key), startDate, endDate));
  return records
    .sort((a, b) => a.date.localeCompare(b.date) || a.sourceSheet.localeCompare(b.sourceSheet) || a.sourceRow - b.sourceRow)
    .map((record, index) => ({ ...record, stt: index + 1 }));
}

export const __test__ = { classifyStatus, findColumns, monthKeyFromSheetName, parseDate, selectedMonthKeys };
