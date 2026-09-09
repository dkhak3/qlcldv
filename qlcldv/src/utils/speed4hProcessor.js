import ExcelJS from "exceljs";
import { normalizeText } from "./cameraProcessor.js";

const STANDARD_CALL_NOTES = new Set([
  "GOI TIEP VIEN",
  "GOI DIEU DO",
  "GOI TRUONG DIEU DO",
]);

const SHEET_CONFIGS = {
  speed: {
    sheetName: "TỐC ĐỘ",
    required: {
      partner: header => header.includes("DOI TAC"),
      date: header => header.includes("NGAY THANG"),
      branch: header => header === "CHI NHANH",
      route: header => header === "TUYEN",
      vehicle: header => header === "SO XE",
      driver: header => header === "LAI XE",
      attendant: header => header === "TIEP VIEN",
      recipientName: header => header.includes("NGUOI TIEP NHAN") && header.includes("HO TEN"),
      reminderCount: header => header.includes("SO LAN GOI NHAC"),
      note: header => header === "GHI CHU",
    },
  },
  fourHour: {
    sheetName: "4H",
    required: {
      partner: header => header.includes("DOI TAC"),
      date: header => header.includes("NGAY THANG"),
      branch: header => header === "CHI NHANH",
      route: header => header === "TUYEN",
      vehicle: header => header === "SO XE",
      driver: header => header === "LAI XE",
      attendant: header => header === "TIEP VIEN",
      recipientName: header => header.includes("NGUOI TIEP NHAN") && header.includes("HO TEN"),
      reminderCount: header => header.includes("SO LAN GOI NHAC"),
      warning4h: header => header.includes("NHAC NHO 4 GIO"),
      violation4h: header => header.includes("VI PHAM 4 GIO"),
      note: header => header === "GHI CHU",
    },
  },
};

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
  let match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : null;
}

function positiveCount(value) {
  const count = Number(scalarValue(value));
  return Number.isFinite(count) && count > 0 ? count : 1;
}

function findWorksheet(workbook, expectedName) {
  const target = normalizeText(expectedName);
  return workbook.worksheets.find(sheet => normalizeText(sheet.name) === target);
}

function findColumns(worksheet, config) {
  let headerRow = null;
  for (let row = 1; row <= Math.min(10, worksheet.rowCount); row += 1) {
    const values = [];
    for (let column = 1; column <= Math.min(25, worksheet.columnCount); column += 1) {
      values.push(comparisonText(worksheet.getCell(row, column).value));
    }
    if (values.some(value => value.includes("DOI TAC")) && values.some(value => value === "CHI NHANH")) {
      headerRow = row;
      break;
    }
  }
  if (!headerRow) return null;

  const headers = [];
  for (let column = 1; column <= Math.min(25, worksheet.columnCount); column += 1) {
    const headerParts = [
      comparisonText(worksheet.getCell(headerRow, column).value),
      comparisonText(worksheet.getCell(headerRow + 1, column).value),
    ].filter(Boolean);
    headers[column] = [...new Set(headerParts)].join(" ");
  }

  const columns = {};
  const missing = [];
  Object.entries(config.required).forEach(([key, matches]) => {
    const column = headers.findIndex(header => matches(header || ""));
    if (column < 1) missing.push(key);
    else columns[key] = column;
  });
  return { headerRow, dataStart: headerRow + 2, columns, missing };
}

function readSheet(worksheet, config, startDate, endDate) {
  const layout = findColumns(worksheet, config);
  if (!layout || layout.missing.length) {
    const details = layout?.missing.length ? ` Thiếu cột: ${layout.missing.join(", ")}.` : "";
    throw new Error(`File Tốc độ, 4H có cấu trúc không hợp lệ tại sheet “${config.sheetName}”.${details}`);
  }

  const records = [];
  for (let rowNumber = layout.dataStart; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const date = parseDate(row.getCell(layout.columns.date).value);
    if (!date || date < startDate || date > endDate) continue;

    const vehicle = normalizeVehicle(row.getCell(layout.columns.vehicle).value);
    const driver = cleanText(row.getCell(layout.columns.driver).value);
    if (!vehicle || !driver) continue;

    const record = {
      rowNumber,
      date,
      partner: cleanText(row.getCell(layout.columns.partner).value).toUpperCase(),
      branch: cleanText(row.getCell(layout.columns.branch).value).toUpperCase(),
      route: cleanText(row.getCell(layout.columns.route).value),
      vehicle,
      driver,
      attendant: layout.columns.attendant ? cleanText(row.getCell(layout.columns.attendant).value) : "",
      recipientName: cleanText(row.getCell(layout.columns.recipientName).value),
      reminderCount: positiveCount(row.getCell(layout.columns.reminderCount).value),
      note: cleanText(row.getCell(layout.columns.note).value),
    };
    if (layout.columns.violation4h && comparisonText(row.getCell(layout.columns.violation4h).value) !== "X") continue;
    records.push(record);
  }
  return records;
}

function validEmployeeName(value) {
  const key = comparisonText(value);
  return value && key !== "KHONG CO TIEP VIEN" && key !== "KHONG TIEP VIEN";
}

function extractNoAnswerNameFromNote(value) {
  const text = cleanText(value);
  const noAnswerMatch = text.match(/không\s+nghe\s+máy/i);
  if (!noAnswerMatch) return "";

  const beforeNoAnswer = text.slice(0, noAnswerMatch.index).trim();
  const indirectTarget = beforeNoAnswer.match(
    /(?:điều\s*độ|tiếp\s*viên)\s+([\p{L}][\p{L}\s.'-]*?)\s+(?:nhưng\s+)?gọi\s*0*\d+\s*(?:lần|cuộc)\s*$/iu,
  );
  if (indirectTarget) return cleanText(indirectTarget[1]);

  const calls = [...beforeNoAnswer.matchAll(/gọi/giu)];
  if (!calls.length) return "";
  const lastCall = calls.at(-1);
  const originalTarget = beforeNoAnswer.slice(lastCall.index + lastCall[0].length).trim();
  const withoutCount = originalTarget.replace(/\s*0*\d+\s*(?:lần|cuộc)\s*$/iu, "").trim();
  const withoutRole = withoutCount.replace(/^(?:điều\s*độ|tiếp\s*viên)\s+/iu, "").trim();
  return withoutRole || withoutCount;
}

function getNoAnswer(record, type) {
  const note = comparisonText(record.note);
  if (!note || STANDARD_CALL_NOTES.has(note)) return { name: "", count: 0 };

  const mentionedCounts = [...note.matchAll(/(\d+)\s*(?:LAN|CUOC)/g)].map(match => Number(match[1])).filter(Number.isFinite);
  const count = mentionedCounts.length ? Math.max(...mentionedCounts) : record.reminderCount;
  let name = "";
  if (!validEmployeeName(record.attendant)) name = extractNoAnswerNameFromNote(record.note);
  else if (note.includes("GOI TIEP VIEN")) name = record.attendant;
  else if (type === "fourHour" && !validEmployeeName(record.recipientName)) name = extractNoAnswerNameFromNote(record.note);
  else if (validEmployeeName(record.recipientName)) name = record.recipientName;
  else if (validEmployeeName(record.attendant)) name = record.attendant;
  return { name, count };
}

export function summarizeSpeed4hRecords(records, type) {
  const grouped = new Map();
  records.forEach(record => {
    const key = `${comparisonText(record.driver)}|${record.vehicle}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(record);
  });

  return [...grouped.values()].map((group, index) => {
    const ordered = [...group].sort((a, b) => a.date.localeCompare(b.date) || a.rowNumber - b.rowNumber);
    const first = ordered[0];
    const noAnswers = ordered.map(record => getNoAnswer(record, type)).filter(item => item.count > 0);
    const noAnswerEmployee = [...new Set(noAnswers.map(item => item.name).filter(Boolean))].join(", ");
    return {
      stt: index + 1,
      partner: first.partner,
      branch: first.branch,
      route: first.route,
      vehicle: first.vehicle,
      employeeName: first.driver,
      violationCount: type === "fourHour" ? ordered.length : ordered.length > 1 ? ordered.length : first.reminderCount,
      noAnswerEmployee,
      noAnswerCount: noAnswers.reduce((sum, item) => sum + item.count, 0),
    };
  });
}

async function loadWorkbook(file) {
  if (!file || !file.name?.toLowerCase().endsWith(".xlsx")) {
    throw new Error("File Tốc độ, 4H không hợp lệ. Vui lòng chọn đúng file Excel .xlsx");
  }
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(await file.arrayBuffer()); }
  catch { throw new Error("File Tốc độ, 4H không hợp lệ hoặc đã bị hỏng"); }
  return workbook;
}

export async function processSpeed4hFile(file, startDate, endDate) {
  const workbook = await loadWorkbook(file);
  const speedSheet = findWorksheet(workbook, SHEET_CONFIGS.speed.sheetName);
  const fourHourSheet = findWorksheet(workbook, SHEET_CONFIGS.fourHour.sheetName);
  const missingSheets = [
    !speedSheet && SHEET_CONFIGS.speed.sheetName,
    !fourHourSheet && SHEET_CONFIGS.fourHour.sheetName,
  ].filter(Boolean);
  if (missingSheets.length) {
    throw new Error(`File Tốc độ, 4H có cấu trúc không hợp lệ. Thiếu sheet: ${missingSheets.join(", ")}`);
  }

  const speedRecords = readSheet(speedSheet, SHEET_CONFIGS.speed, startDate, endDate);
  const fourHourRecords = readSheet(fourHourSheet, SHEET_CONFIGS.fourHour, startDate, endDate);
  return {
    speed: summarizeSpeed4hRecords(speedRecords, "speed"),
    fourHour: summarizeSpeed4hRecords(fourHourRecords, "fourHour"),
  };
}

export const __test__ = { parseDate, getNoAnswer, extractNoAnswerNameFromNote, findColumns };
