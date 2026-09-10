import ExcelJS from "exceljs";
import { normalizeText } from "./cameraProcessor.js";

const CATEGORY_LABELS = {
  cldv: "Chất lượng dịch vụ",
  finance: "Tài chính",
  atgt: "An toàn giao thông",
  other: "Vi phạm khác",
};

const cellValue = cell => {
  const value = cell?.value;
  if (value?.richText) return value.richText.map(item => item.text).join("");
  if (value?.formula || value?.sharedFormula) return value.result ?? "";
  if (value?.text) return value.text;
  return value;
};

const cleanText = value => String(value ?? "").replace(/\s+/g, " ").trim();
const preserveText = value => String(value ?? "").trim();
const comparable = value => normalizeText(value).replace(/[^A-Z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const routeKey = (branch, route) => `${comparable(branch)}::${comparable(route)}`;

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  const text = cleanText(value);
  let match = text.match(/(?:^|\D)(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\D|$)/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  match = text.match(/(?:^|\D)(\d{4})-(\d{1,2})-(\d{1,2})(?:\D|$)/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  match = normalizeText(text).match(/NGAY\s+(\d{1,2})\s+THANG\s+(\d{1,2})\s+NAM\s+(\d{4})/);
  return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : "";
}

function parseTime(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value >= 1 ? value % 1 : value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return (value.getUTCHours() * 3600 + value.getUTCMinutes() * 60 + value.getUTCSeconds()) / 86400;
  }
  const match = cleanText(value).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  return match ? (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] || 0)) / 86400 : cleanText(value);
}

function findSheet(workbook, prefix) {
  const target = comparable(prefix);
  return workbook.worksheets.find(sheet => comparable(sheet.name).startsWith(target));
}

function findM02Header(sheet) {
  let headerRow = 0;
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const first = comparable(cellValue(row.getCell(1)));
    const branch = comparable(cellValue(row.getCell(2)));
    const vehicle = comparable(cellValue(row.getCell(4)));
    if (first === "STT" && branch === "CHI NHANH" && vehicle === "SO XE") headerRow = rowNumber;
  });
  return headerRow;
}

function parseM02(sheet, fallbackDate = "") {
  const headerRow = findM02Header(sheet);
  if (!headerRow) throw new Error(`Sheet “${sheet.name}” thiếu bảng M02 với các cột STT, CHI NHÁNH, TUYẾN, SỐ XE`);
  const rows = [];
  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const branch = cleanText(cellValue(row.getCell(2)));
    const route = cleanText(cellValue(row.getCell(3)));
    const vehicle = cleanText(cellValue(row.getCell(4)));
    if (!branch || !route || !vehicle) continue;
    rows.push({
      sourceRow: rowNumber,
      branch,
      route,
      vehicle,
      departureTime: parseTime(cellValue(row.getCell(5))),
      arrivalTime: parseTime(cellValue(row.getCell(6))),
      date: parseDate(cellValue(row.getCell(7))) || fallbackDate,
      driver: cleanText(cellValue(row.getCell(8))),
      assistant: cleanText(cellValue(row.getCell(9))),
      serviceQuality: cleanText(cellValue(row.getCell(10))),
      roadSafety: cleanText(cellValue(row.getCell(11))),
      actualPassengers: cellValue(row.getCell(12)) ?? "",
      actualLuggage: cellValue(row.getCell(13)) ?? "",
      actualFreeTickets: cellValue(row.getCell(14)) ?? "",
      reportedPassengers: cellValue(row.getCell(15)) ?? "",
      reportedLuggage: cellValue(row.getCell(16)) ?? "",
      reportedFreeTickets: cellValue(row.getCell(17)) ?? "",
      differencePassengers: cellValue(row.getCell(18)) ?? "",
      differenceLuggage: cellValue(row.getCell(19)) ?? "",
      differenceFreeTickets: cellValue(row.getCell(20)) ?? "",
      note: preserveText(cellValue(row.getCell(21))),
    });
  }
  return rows;
}

function categoryFromTitle(value) {
  const text = comparable(value);
  if (text.includes("CHAT LUONG DICH VU")) return "cldv";
  if (text.includes("TAI CHINH")) return "finance";
  if (text.includes("AN TOAN GIAO THONG")) return "atgt";
  if (text.includes("VI PHAM KHAC")) return "other";
  return "";
}

function parseM03(sheet, fallbackDate = "") {
  const rows = [];
  let category = "";
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const section = categoryFromTitle(cellValue(row.getCell(1)));
    if (section) {
      category = section;
      continue;
    }
    const branch = cleanText(cellValue(row.getCell(2)));
    const route = cleanText(cellValue(row.getCell(3)));
    const vehicle = cleanText(cellValue(row.getCell(4)));
    const violation = cleanText(cellValue(row.getCell(7)));
    if (!category || !branch || !route || !vehicle || !violation || comparable(branch) === "CHI NHANH DON VI") continue;
    rows.push({
      sourceRow: rowNumber,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      branch,
      route,
      vehicle,
      position: cleanText(cellValue(row.getCell(5))),
      employeeName: cleanText(cellValue(row.getCell(6))),
      violation: preserveText(cellValue(row.getCell(7))),
      reason: cleanText(cellValue(row.getCell(8))),
      time: cleanText(cellValue(row.getCell(9))),
      date: parseDate(cellValue(row.getCell(9))) || fallbackDate,
    });
  }
  return rows;
}

function findDateInTopRows(sheet, maxRows = 5, maxColumns = 12) {
  if (!sheet) return "";
  for (let rowNumber = 1; rowNumber <= Math.min(maxRows, sheet.rowCount); rowNumber += 1) {
    for (let columnNumber = 1; columnNumber <= maxColumns; columnNumber += 1) {
      const date = parseDate(cellValue(sheet.getRow(rowNumber).getCell(columnNumber)));
      if (date) return date;
    }
  }
  return "";
}

function personMatches(employeeName, detail) {
  const employee = comparable(employeeName);
  if (!employee) return true;
  return [detail.driver, detail.assistant].some(value => {
    const person = comparable(value);
    if (!person) return false;
    return person === employee
      || (employee.length >= 3 && person.includes(employee))
      || (person.length >= 3 && employee.includes(person));
  });
}

function contentSimilarity(leftValue, rightValue) {
  const left = comparable(leftValue);
  const right = comparable(rightValue);
  if (!left || !right || left === "OK" || right === "OK" || right === "GIAM SAT ATGT") return 0;
  if (left.includes(right) || right.includes(left)) return 1;
  const leftWords = new Set(left.split(" ").filter(word => word.length > 1));
  const rightWords = new Set(right.split(" ").filter(word => word.length > 1));
  if (!leftWords.size || !rightWords.size) return 0;
  const common = [...leftWords].filter(word => rightWords.has(word)).length;
  return common / Math.min(leftWords.size, rightWords.size);
}

function isViolationMatch(violation, detail) {
  const sameVehicle = comparable(violation.branch) === comparable(detail.branch)
    && comparable(violation.route) === comparable(detail.route)
    && comparable(violation.vehicle) === comparable(detail.vehicle);
  if (!sameVehicle) return false;
  return personMatches(violation.employeeName, detail)
    && contentSimilarity(violation.violation, detail.note) >= 0.7;
}

async function parseWorkbook(file) {
  if (!file?.name?.toLowerCase().endsWith(".xlsx")) throw new Error(`${file?.name || "File ATGT"}: chỉ chấp nhận định dạng .xlsx`);
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error(`${file.name}: file Excel không hợp lệ hoặc đã bị hỏng`);
  }
  const m02 = findSheet(workbook, "M02");
  const m03 = findSheet(workbook, "M03");
  if (!m02 || !m03) throw new Error(`${file.name}: phải có đủ hai sheet M02 và M03`);
  const reportDate = findDateInTopRows(m02) || parseDate(file.name) || findDateInTopRows(m03);
  const detailRows = parseM02(m02, reportDate);
  const violations = parseM03(m03, reportDate);
  return {
    fileName: file.name,
    reportDate,
    detailRows,
    violations,
    dates: [...new Set(detailRows.map(row => row.date).filter(Boolean))].sort(),
  };
}

function buildSummary(detailRows, violations) {
  const routes = new Map();
  const addRoute = row => {
    const key = routeKey(row.branch, row.route);
    if (!routes.has(key)) routes.set(key, { branch: row.branch, route: row.route, finance: 0, atgt: 0, cldv: 0 });
    return routes.get(key);
  };
  detailRows.forEach(addRoute);
  violations.filter(row => row.category !== "other").forEach(row => {
    const target = addRoute(row);
    target[row.category] += 1;
  });
  return [...routes.values()]
    // Giữ thứ tự giống file báo cáo tuần mẫu: sắp xếp chuỗi mã tuyến
    // (03, 07, 100, 101, 103, ...), không sắp xếp số học.
    .sort((left, right) => left.branch.localeCompare(right.branch, "vi") || left.route.localeCompare(right.route, "vi"))
    .map((row, index) => ({ ...row, stt: index + 1, total: row.finance + row.atgt + row.cldv }));
}

// Từ ngày/Đến ngày do người dùng nhập chỉ dùng cho tiêu đề file xuất.
// Hàm này luôn đọc toàn bộ dữ liệu có trong các file ATGT đã chọn.
export async function processAtgtFiles(files) {
  if (!Array.isArray(files) || !files.length) throw new Error("Vui lòng chọn ít nhất 1 file ATGT");
  if (files.length > 7) throw new Error("Chỉ được xử lý tối đa 7 file ATGT trong một lần");
  const parsedFiles = await Promise.all(files.map(file => parseWorkbook(file)));
  parsedFiles.sort((left, right) => (left.reportDate || "9999-12-31").localeCompare(right.reportDate || "9999-12-31"));
  const detailRows = parsedFiles.flatMap(item => item.detailRows.map(row => ({ ...row, sourceFile: item.fileName })));
  const rawViolations = parsedFiles.flatMap(item => item.violations.map(row => ({ ...row, sourceFile: item.fileName })));
  const violations = rawViolations.map(row => {
    const candidates = detailRows.filter(detail => detail.sourceFile === row.sourceFile && isViolationMatch(row, detail));
    const matched = candidates.find(detail => !row.date || !detail.date || detail.date === row.date) || candidates[0];
    return {
      ...row,
      matchedM02: Boolean(matched),
      matchedM02Row: matched?.sourceRow || null,
      matchedM02Data: matched ? {
        sourceFile: matched.sourceFile,
        sourceRow: matched.sourceRow,
        date: matched.date,
        branch: matched.branch,
        route: matched.route,
        vehicle: matched.vehicle,
        driver: matched.driver,
        assistant: matched.assistant,
        note: matched.note,
      } : null,
    };
  });
  return {
    summary: buildSummary(detailRows, violations),
    detailRows: detailRows.map((row, index) => ({ ...row, stt: index + 1 })),
    violations: violations.map((row, index) => ({ ...row, stt: index + 1 })),
    fileSummaries: parsedFiles.map(item => ({
      fileName: item.fileName,
      reportDate: item.reportDate,
      detailCount: item.detailRows.length,
      violationCount: item.violations.length,
      dates: item.dates,
    })),
    unmatchedCount: violations.filter(row => row.category !== "other" && !row.matchedM02).length,
    ignoredOtherCount: violations.filter(row => row.category === "other").length,
  };
}

export async function fingerprintAtgtFile(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export const __test__ = { parseDate, parseTime, contentSimilarity, isViolationMatch, buildSummary };
