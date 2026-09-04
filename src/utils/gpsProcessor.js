import ExcelJS from "exceljs";
import { normalizeText } from "./cameraProcessor.js";

const MAIN_GROUPS = [
  { key: "BA", title: "1. BÌNH ANH", sheets: ["SỔ THEO DÕI BA", "SỔ THEO DÕI 16 TUYẾN HCM"] },
  { key: "BA35", title: "2. BÌNH ANH 35 TUYẾN", sheets: ["SỔ THEO DÕI 35 TUYẾN"] },
  { key: "VIETMAP", title: "3. VIETMAP", sheets: ["SỔ THEO DÕI VIETMAP"] },
];

const TONGDA_GROUP = { key: "TONGDA", title: "4. TONGDA", sheets: ["Sổ theo dõi GPS"] };

function scalarValue(value) {
  if (value?.result !== undefined) return value.result;
  if (value?.richText) return value.richText.map(item => item.text).join("");
  if (value?.text !== undefined) return value.text;
  return value;
}

function parseHeaderDate(row) {
  for (let column = 1; column <= 8; column += 1) {
    const match = normalizeText(scalarValue(row.getCell(column).value)).match(/NGAY\s+(\d{1,2})\s+THANG\s+(\d{1,2})\s+NAM\s+(\d{4})/);
    if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

function findWorksheet(workbook, expectedName) {
  const target = normalizeText(expectedName);
  return workbook.worksheets.find(sheet => normalizeText(sheet.name) === target);
}

function isMarked(value) {
  const scalar = scalarValue(value);
  return Number(scalar) === 1 || normalizeText(scalar) === "1";
}

function normalizeVehicle(value) {
  const vehicle = normalizeText(scalarValue(value)).replace(/[^A-Z0-9]/g, "");
  return vehicle.length >= 5 && vehicle.length <= 12 && /\d/.test(vehicle) ? vehicle : "";
}

function readSheet(worksheet, startDate, endDate) {
  const records = [];
  const datesSeen = new Set();
  let activeDate = null;
  let hasDateHeader = false;
  let hasColumnHeader = false;
  let insideTable = false;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const headerDate = parseHeaderDate(row);
    if (headerDate) {
      activeDate = headerDate;
      datesSeen.add(headerDate);
      hasDateHeader = true;
      insideTable = false;
      return;
    }

    const isExpectedHeader = normalizeText(scalarValue(row.getCell(3).value)) === "CHI NHANH"
      && normalizeText(scalarValue(row.getCell(5).value)) === "SO XE"
      && normalizeText(scalarValue(row.getCell(7).value)) === "DA XU LY"
      && normalizeText(scalarValue(row.getCell(8).value)) === "CHUA XU LY";
    if (activeDate && isExpectedHeader) {
      insideTable = true;
      hasColumnHeader = true;
      return;
    }

    if (normalizeText(scalarValue(row.getCell(1).value)) === "TONG") {
      insideTable = false;
      return;
    }
    if (!insideTable || !activeDate || activeDate < startDate || activeDate > endDate) return;

    const vehicle = normalizeVehicle(row.getCell(5).value);
    const branchValue = scalarValue(row.getCell(3).value);
    const branchLabel = String(branchValue ?? "").replace(/\s+/g, " ").trim().toUpperCase();
    const branch = normalizeText(branchLabel);
    if (!vehicle || !branch) return;

    if (isMarked(row.getCell(7).value)) records.push({ headerDate: activeDate, vehicle, branch, branchLabel, state: "processed", rowNumber });
    if (isMarked(row.getCell(8).value)) records.push({ headerDate: activeDate, vehicle, branch, branchLabel, state: "unprocessed", rowNumber });
  });

  return { records, datesSeen, hasDateHeader, hasColumnHeader };
}

export function resolveGpsVehicleStates(records, endDate, hasEndSnapshot) {
  const processed = new Set(records.filter(record => record.state === "processed").map(record => record.vehicle));
  const unprocessed = new Set(records.filter(record => record.state === "unprocessed").map(record => record.vehicle));

  // Xe đã được xử lý trong khoảng chọn được loại khỏi danh sách chưa xử lý.
  processed.forEach(vehicle => unprocessed.delete(vehicle));

  // Ảnh chụp ngày kết thúc có quyền ưu tiên: xe vẫn chưa xử lý phải quay lại
  // danh sách chưa xử lý và đồng thời bị xóa khỏi danh sách đã xử lý.
  if (hasEndSnapshot) {
    records
      .filter(record => record.headerDate === endDate && record.state === "unprocessed")
      .forEach(record => {
        unprocessed.add(record.vehicle);
        processed.delete(record.vehicle);
      });
  }

  return { processed, unprocessed };
}

function summarize(records, endDate, hasEndSnapshot) {
  const branches = new Map();
  records.forEach(record => {
    if (!branches.has(record.branch)) branches.set(record.branch, []);
    branches.get(record.branch).push(record);
  });

  return [...branches.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "vi"))
    .map(([branch, rows], index) => {
      const states = resolveGpsVehicleStates(rows, endDate, hasEndSnapshot);
      const vehicles = {
        processed: [...states.processed].sort((a, b) => a.localeCompare(b, "vi", { numeric: true })),
        unprocessed: [...states.unprocessed].sort((a, b) => a.localeCompare(b, "vi", { numeric: true })),
      };
      return {
        stt: index + 1,
        branch: rows[0].branchLabel || branch,
        total: vehicles.processed.length + vehicles.unprocessed.length,
        processed: vehicles.processed.length,
        unprocessed: vehicles.unprocessed.length,
        vehicles,
      };
    });
}

async function loadWorkbook(file, fileLabel) {
  if (!file || !file.name?.toLowerCase().endsWith(".xlsx")) throw new Error(`${fileLabel}: file không hợp lệ. Vui lòng chọn đúng file Excel .xlsx`);
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(await file.arrayBuffer()); }
  catch { throw new Error(`${fileLabel}: file không hợp lệ hoặc đã bị hỏng`); }
  return workbook;
}

async function processGroups(workbook, groups, startDate, endDate, fileLabel) {
  const missingSheets = groups.flatMap(group => group.sheets).filter(name => !findWorksheet(workbook, name));
  if (missingSheets.length) throw new Error(`${fileLabel}: cấu trúc không hợp lệ. Thiếu sheet: ${missingSheets.join(", ")}`);

  const results = [];
  for (const group of groups) {
    const records = [];
    const datesSeen = new Set();
    for (const sheetName of group.sheets) {
      const parsed = readSheet(findWorksheet(workbook, sheetName), startDate, endDate);
      if (!parsed.hasDateHeader || !parsed.hasColumnHeader) {
        throw new Error(`${fileLabel}: cấu trúc không hợp lệ tại sheet “${sheetName}”. Cần có tiêu đề ngày và các cột C CHI NHÁNH, E SỐ XE, G ĐÃ XỬ LÝ, H CHƯA XỬ LÝ`);
      }
      records.push(...parsed.records);
      parsed.datesSeen.forEach(date => datesSeen.add(date));
    }
    results.push({ ...group, rows: summarize(records, endDate, datesSeen.has(endDate)) });
  }
  return results;
}

export async function processGpsFiles(mainFile, tongdaFile, startDate, endDate) {
  const mainWorkbook = await loadWorkbook(mainFile, "File GPS chính");
  const tongdaWorkbook = await loadWorkbook(tongdaFile, "File TONGDA");
  const mainResults = await processGroups(mainWorkbook, MAIN_GROUPS, startDate, endDate, "File GPS chính");
  const tongdaResults = await processGroups(tongdaWorkbook, [TONGDA_GROUP], startDate, endDate, "File TONGDA");
  return [...mainResults, ...tongdaResults];
}

export const __test__ = { readSheet, isMarked };
