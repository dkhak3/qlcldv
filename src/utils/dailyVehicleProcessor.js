import ExcelJS from "exceljs";

const GPS_SECTION_TITLE = "TONG HOP XE SUA CHUA XE TAI NAN XE TRA XUONG KHONG VAN DOANH";
const VEHICLE_HEADERS = {
  vehicle: ["BIEN SO XE"],
  reason: ["NGUYEN NHAN"],
  workshopIn: ["NGAY VAO XUONG"],
  expectedOut: ["DU KIEN RA XUONG"],
  note: ["GHI CHU"],
};
const GPS_HEADERS = {
  branch: ["CHI NHANH"],
  route: ["TUYEN"],
  vehicle: ["SO XE"],
  note: ["GHI CHU"],
};

function scalarValue(value) {
  if (value?.result !== undefined) return value.result;
  if (value?.richText) return value.richText.map(item => item.text || "").join("");
  if (value?.text !== undefined) return value.text;
  return value;
}

export function normalizeDailyVehicleText(value = "") {
  return String(scalarValue(value) ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function normalizeVehicleNumber(value = "") {
  return normalizeDailyVehicleText(value).replace(/[^A-Z0-9]/g, "");
}

function cleanText(value = "") {
  return String(scalarValue(value) ?? "").replace(/\s+/g, " ").trim();
}

function excelSerialToDate(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const wholeDays = Math.floor(value);
  const utc = Date.UTC(1899, 11, 30) + wholeDays * 86400000;
  return new Date(utc);
}

function dateParts(value) {
  const item = scalarValue(value);
  if (item instanceof Date && !Number.isNaN(item.getTime())) {
    return { day: item.getDate(), month: item.getMonth() + 1, year: item.getFullYear() };
  }
  if (typeof item === "number") {
    const date = excelSerialToDate(item);
    return date ? { day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear() } : null;
  }

  const text = cleanText(item);
  let match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (match) return { day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) };
  match = text.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
  if (match) return { day: Number(match[3]), month: Number(match[2]), year: Number(match[1]) };
  return null;
}

export function formatDailyVehicleDate(value) {
  const parts = dateParts(value);
  if (!parts) return "";
  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

function selectedDateLabel(dateValue) {
  const match = String(dateValue || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}-${match[2]}` : "";
}

function normalizeDayMonth(value) {
  const item = scalarValue(value);
  if (item instanceof Date && !Number.isNaN(item.getTime())) {
    return `${String(item.getDate()).padStart(2, "0")}-${String(item.getMonth() + 1).padStart(2, "0")}`;
  }
  const text = cleanText(item);
  let match = text.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-]\d{4})?$/);
  if (match) return `${String(Number(match[1])).padStart(2, "0")}-${String(Number(match[2])).padStart(2, "0")}`;
  return "";
}

function headerKey(value, definitions) {
  const text = normalizeDailyVehicleText(value);
  return Object.entries(definitions).find(([, aliases]) => aliases.includes(text))?.[0] || "";
}

function findHeaderColumns(row, definitions, maxColumns = 20) {
  const columns = {};
  for (let column = 1; column <= Math.min(row.cellCount || maxColumns, maxColumns); column += 1) {
    const key = headerKey(row.getCell(column).value, definitions);
    if (key && !columns[key]) columns[key] = column;
  }
  return columns;
}

function isVehicleDateHeader(row, expectedDateLabel = "") {
  const label = normalizeDayMonth(row.getCell(1).value);
  if (!label || (expectedDateLabel && label !== expectedDateLabel)) return false;
  const columns = findHeaderColumns(row, VEHICLE_HEADERS);
  return Boolean(columns.vehicle);
}

function findVehicleDateBlock(sheet, dateValue) {
  const dateLabel = selectedDateLabel(dateValue);
  if (!dateLabel) return null;
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    if (!isVehicleDateHeader(row, dateLabel)) continue;
    const columns = findHeaderColumns(row, VEHICLE_HEADERS);
    const required = ["vehicle", "reason", "workshopIn", "expectedOut", "note"];
    const missing = required.filter(key => !columns[key]);
    if (missing.length) {
      return { rowNumber, columns, missing };
    }
    return { rowNumber, columns, missing: [] };
  }
  return null;
}

function buildVehicleIndexForSheet(sheet, dateValue) {
  const block = findVehicleDateBlock(sheet, dateValue);
  if (!block || block.missing.length) return { foundDate: Boolean(block), missingHeaders: block?.missing || [], vehicles: new Map() };

  const vehicles = new Map();
  for (let rowNumber = block.rowNumber + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    if (isVehicleDateHeader(row)) break;

    const vehicle = normalizeVehicleNumber(row.getCell(block.columns.vehicle).value);
    if (!vehicle) continue;
    const record = {
      sheetName: sheet.name,
      vehicle,
      reason: cleanText(row.getCell(block.columns.reason).value),
      workshopIn: formatDailyVehicleDate(row.getCell(block.columns.workshopIn).value),
      expectedOut: formatDailyVehicleDate(row.getCell(block.columns.expectedOut).value),
      note: cleanText(row.getCell(block.columns.note).value),
      sourceRow: rowNumber,
    };
    const list = vehicles.get(vehicle) || [];
    list.push(record);
    vehicles.set(vehicle, list);
  }
  return { foundDate: true, missingHeaders: [], vehicles };
}

export function buildDailyVehicleNote(record = {}) {
  const reason = cleanText(record.reason);
  const workshopIn = cleanText(record.workshopIn);
  const expectedOut = cleanText(record.expectedOut);
  const note = cleanText(record.note);

  let output = reason;
  if (workshopIn) output += `${output ? ". " : ""}Ngày vào xưởng ${workshopIn}`;
  if (expectedOut) output += `${output ? (workshopIn ? " - " : ". ") : ""}Dự kiến ra xưởng ${expectedOut}`;
  if (note) output += `${output ? " " : ""}(${note})`;
  return output.trim();
}

export function resolveDailyVehicleBranchSheets(branchName, sheetNames = []) {
  const branch = normalizeDailyVehicleText(branchName);
  if (branch === "HCM") return sheetNames.filter(name => normalizeDailyVehicleText(name) === "TP HO CHI MINH");
  if (branch === "DONG THAP") {
    const targets = new Set(["CAO LANH", "SA DEC"]);
    return sheetNames.filter(name => targets.has(normalizeDailyVehicleText(name)));
  }
  return sheetNames.filter(name => normalizeDailyVehicleText(name) === branch);
}

async function loadWorkbook(file, label) {
  if (!file || !file.name?.toLowerCase().endsWith(".xlsx")) throw new Error(`${label}: chỉ chấp nhận file .xlsx`);
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(await file.arrayBuffer()); }
  catch { throw new Error(`${label}: file Excel bị hỏng hoặc không đọc được`); }
  return workbook;
}

function isNumericStt(value) {
  return /^\d+(?:[.,]0+)?$/.test(cleanText(value));
}

function findGpsSection(sheet) {
  let titleRow = 0;
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const text = Array.from({ length: Math.min(row.cellCount || 10, 10) }, (_, index) => row.getCell(index + 1).value)
      .map(normalizeDailyVehicleText)
      .join(" ");
    if (text.includes(GPS_SECTION_TITLE)) {
      titleRow = rowNumber;
      break;
    }
  }
  if (!titleRow) return null;

  for (let rowNumber = titleRow + 1; rowNumber <= Math.min(sheet.rowCount, titleRow + 10); rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const columns = findHeaderColumns(row, GPS_HEADERS);
    if (columns.branch && columns.route && columns.vehicle) {
      return { rowNumber, columns: { ...columns, note: columns.note || 7 } };
    }
  }
  return null;
}

function readGpsSection(sheet) {
  const section = findGpsSection(sheet);
  if (!section) throw new Error(`Sheet “${sheet.name}” không tìm thấy khu vực Tổng hợp xe sửa chữa/tai nạn/trả xưởng`);

  const rows = [];
  let started = false;
  for (let rowNumber = section.rowNumber + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const stt = row.getCell(1).value;
    if (!isNumericStt(stt)) {
      if (started) break;
      continue;
    }
    started = true;
    const branch = cleanText(row.getCell(section.columns.branch).value);
    const vehicle = cleanText(row.getCell(section.columns.vehicle).value);
    if (!vehicle) continue;
    rows.push({
      sourceRow: rowNumber,
      branch,
      route: cleanText(row.getCell(section.columns.route).value),
      vehicle,
      originalNote: cleanText(row.getCell(section.columns.note).value),
    });
  }
  return rows;
}

function detectGpsGroups(workbook) {
  const byName = new Map(workbook.worksheets.map(sheet => [normalizeDailyVehicleText(sheet.name), sheet]));
  const ba = byName.get("TONG HOP BA");
  const vietmap = byName.get("TONG HOP VIETMAP");
  if (ba && vietmap) {
    return {
      gpsType: "ba-vietmap",
      groups: [
        { key: "ba", title: "BÌNH ANH", sheet: ba },
        { key: "vietmap", title: "VIETMAP", sheet: vietmap },
      ],
    };
  }

  const tongda = byName.get("GPS");
  if (tongda) {
    return { gpsType: "tongda", groups: [{ key: "tongda", title: "TONGDA", sheet: tongda }] };
  }
  throw new Error("File GPS không đúng cấu trúc BA–VIETMAP hoặc TONGDA");
}

export async function inspectDailyVehicleSourceFile(file) {
  const workbook = await loadWorkbook(file, "File phương tiện");
  const usableSheets = [];
  workbook.worksheets.forEach(sheet => {
    for (let rowNumber = 1; rowNumber <= Math.min(sheet.rowCount, 80); rowNumber += 1) {
      const columns = findHeaderColumns(sheet.getRow(rowNumber), VEHICLE_HEADERS);
      if (columns.vehicle && columns.reason && columns.workshopIn && columns.expectedOut && columns.note) {
        usableSheets.push(sheet.name);
        break;
      }
    }
  });
  return usableSheets.length
    ? { valid: true, message: "File phương tiện hợp lệ.", detail: `Đã nhận diện ${usableSheets.length} sheet chi nhánh.` }
    : { valid: false, message: "Không tìm thấy cấu trúc sheet chi nhánh của file phương tiện." };
}

export async function inspectDailyVehicleGpsFile(file) {
  const workbook = await loadWorkbook(file, "File GPS");
  try {
    const detected = detectGpsGroups(workbook);
    detected.groups.forEach(group => findGpsSection(group.sheet) || (() => { throw new Error(`Thiếu khu vực dữ liệu ở sheet ${group.sheet.name}`); })());
    return {
      valid: true,
      message: detected.gpsType === "ba-vietmap" ? "Đã nhận diện file GPS BA + VIETMAP." : "Đã nhận diện file GPS TONGDA.",
      detail: `Sheet xử lý: ${detected.groups.map(group => group.sheet.name).join(", ")}`,
    };
  } catch (error) {
    return { valid: false, message: error.message || "File GPS chưa đúng cấu trúc." };
  }
}

function matchGpsRows({ rows, vehicleWorkbook, dateValue, indexCache }) {
  const vehicleSheetNames = vehicleWorkbook.worksheets.map(sheet => sheet.name);
  let updated = 0;
  let preserved = 0;
  let ambiguous = 0;

  const resultRows = rows.map((gpsRow, index) => {
    const candidateNames = resolveDailyVehicleBranchSheets(gpsRow.branch, vehicleSheetNames);
    const vehicleKey = normalizeVehicleNumber(gpsRow.vehicle);
    const matches = [];

    candidateNames.forEach(sheetName => {
      if (!indexCache.has(sheetName)) {
        const sheet = vehicleWorkbook.getWorksheet(sheetName);
        indexCache.set(sheetName, sheet ? buildVehicleIndexForSheet(sheet, dateValue) : { foundDate: false, missingHeaders: [], vehicles: new Map() });
      }
      const sheetIndex = indexCache.get(sheetName);
      (sheetIndex.vehicles.get(vehicleKey) || []).forEach(record => matches.push(record));
    });

    if (matches.length === 1) {
      updated += 1;
      return {
        ...gpsRow,
        stt: index + 1,
        note: buildDailyVehicleNote(matches[0]),
        matched: true,
        matchStatus: "updated",
        matchedSheet: matches[0].sheetName,
      };
    }

    preserved += 1;
    if (matches.length > 1) ambiguous += 1;
    return {
      ...gpsRow,
      stt: index + 1,
      note: gpsRow.originalNote,
      matched: false,
      matchStatus: matches.length > 1 ? "ambiguous" : "preserved",
      matchedSheet: "",
    };
  });

  return { rows: resultRows, updated, preserved, ambiguous };
}

export async function processDailyVehicleFiles(vehicleFile, gpsFile, dateValue) {
  if (!dateValue) throw new Error("Vui lòng chọn ngày báo cáo");
  const [vehicleWorkbook, gpsWorkbook] = await Promise.all([
    loadWorkbook(vehicleFile, "File phương tiện"),
    loadWorkbook(gpsFile, "File GPS"),
  ]);
  const detected = detectGpsGroups(gpsWorkbook);
  const indexCache = new Map();

  const groups = detected.groups.map(group => {
    const sourceRows = readGpsSection(group.sheet);
    const matched = matchGpsRows({ rows: sourceRows, vehicleWorkbook, dateValue, indexCache });
    return {
      key: group.key,
      title: group.title,
      sourceSheet: group.sheet.name,
      ...matched,
      total: sourceRows.length,
    };
  });

  return {
    gpsType: detected.gpsType,
    selectedDate: dateValue,
    groups,
    total: groups.reduce((sum, group) => sum + group.total, 0),
    updated: groups.reduce((sum, group) => sum + group.updated, 0),
    preserved: groups.reduce((sum, group) => sum + group.preserved, 0),
    ambiguous: groups.reduce((sum, group) => sum + group.ambiguous, 0),
  };
}

export const __test__ = {
  detectGpsGroups,
  findGpsSection,
  readGpsSection,
  selectedDateLabel,
};
