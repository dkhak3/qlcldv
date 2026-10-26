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

const compactColor = color => {
  if (!color) return null;
  if (color.argb) return { argb: color.argb };
  if (color.theme != null) return { theme: color.theme, ...(color.tint != null ? { tint: color.tint } : {}) };
  if (color.indexed != null) return { indexed: color.indexed };
  return null;
};

const compactFont = font => {
  if (!font) return {};
  return {
    ...(font.name ? { name: font.name } : {}),
    ...(font.size != null ? { size: font.size } : {}),
    ...(font.family != null ? { family: font.family } : {}),
    ...(font.charset != null ? { charset: font.charset } : {}),
    ...(font.scheme ? { scheme: font.scheme } : {}),
    ...(font.bold != null ? { bold: font.bold } : {}),
    ...(font.italic != null ? { italic: font.italic } : {}),
    ...(font.underline != null ? { underline: font.underline } : {}),
    ...(font.strike != null ? { strike: font.strike } : {}),
    ...(font.vertAlign ? { vertAlign: font.vertAlign } : {}),
    ...(compactColor(font.color) ? { color: compactColor(font.color) } : {}),
  };
};

function styledTextRuns(cell) {
  const value = cell?.value;
  if (value?.richText) {
    return value.richText
      .map(run => ({
        text: String(run.text ?? ""),
        font: compactFont({ ...(cell.font || {}), ...(run.font || {}) }),
      }))
      .filter(run => run.text);
  }
  const text = String(cellValue(cell) ?? "").trim();
  return text ? [{ text, font: compactFont(cell?.font) }] : [];
}

const cleanText = value => String(value ?? "").replace(/\s+/g, " ").trim();
const preserveText = value => String(value ?? "").trim();
const comparable = value => normalizeText(value).replace(/[^A-Z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const routeKey = (branch, route) => `${comparable(branch)}::${comparable(route)}`;

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  const text = cleanText(value);
  let match = text.match(/(?:^|\D)(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:\D|$)/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  match = text.match(/(?:^|\D)(\d{4})-(\d{1,2})-(\d{1,2})(?:\D|$)/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  match = normalizeText(text).match(/NGAY\s+(\d{1,2})\s+THANG\s+(\d{1,2})\s+NAM\s+(\d{4})/);
  return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : "";
}

function parseTime(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value >= 1 ? value % 1 : value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return (value.getHours() * 3600 + value.getMinutes() * 60 + value.getSeconds()) / 86400;
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
    const labels = [];
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      labels[columnNumber] = comparable(cellValue(cell));
    });
    const hasLabel = label => labels.some(value => value && value.includes(label));
    // Không khóa vị trí cột: một số biểu mẫu đặt NGÀY ở cột D, còn biểu mẫu
    // cũ đặt NGÀY ở cột G. Nhận diện hàng tiêu đề theo tên cột để hỗ trợ cả hai.
    if (hasLabel("STT") && hasLabel("CHI NHANH") && hasLabel("TUYEN") && hasLabel("SO XE")) {
      headerRow = rowNumber;
    }
  });
  return headerRow;
}

function findM02Columns(sheet, headerRow) {
  const headers = [];
  sheet.getRow(headerRow).eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    const label = comparable(cellValue(cell));
    if (label) headers.push({ column: columnNumber, label });
  });
  const columnFor = (aliases, fallback) => {
    const normalizedAliases = aliases.map(comparable);
    for (const alias of normalizedAliases) {
      const exact = headers.find(header => header.label === alias);
      if (exact) return exact.column;
    }
    for (const alias of normalizedAliases) {
      const partial = headers.find(header => header.label.includes(alias));
      if (partial) return partial.column;
    }
    return fallback;
  };
  return {
    branch: columnFor(["CHI NHÁNH"], 2),
    route: columnFor(["TUYẾN"], 3),
    vehicle: columnFor(["SỐ XE", "BIỂN SỐ XE"], 4),
    departureTime: columnFor(["GIỜ ĐI", "THỜI GIAN ĐI"], 5),
    arrivalTime: columnFor(["GIỜ VỀ", "THỜI GIAN VỀ"], 6),
    date: columnFor(["NGÀY"], 7),
    driver: columnFor(["LÁI XE", "TÊN LÁI XE", "HỌ TÊN LÁI XE", "HỌ VÀ TÊN LÁI XE"], 8),
    assistant: columnFor(["TIẾP VIÊN", "TÊN TIẾP VIÊN", "HỌ TÊN TIẾP VIÊN"], 9),
    serviceQuality: columnFor(["CHẤT LƯỢNG DỊCH VỤ"], 10),
    roadSafety: columnFor(["AN TOÀN GIAO THÔNG"], 11),
    actualPassengers: columnFor(["SỐ KHÁCH THỰC TẾ"], 12),
    actualLuggage: columnFor(["HÀNH LÝ THỰC TẾ"], 13),
    actualFreeTickets: columnFor(["VÉ MIỄN PHÍ THỰC TẾ"], 14),
    reportedPassengers: columnFor(["SỐ KHÁCH BÁO CÁO"], 15),
    reportedLuggage: columnFor(["HÀNH LÝ BÁO CÁO"], 16),
    reportedFreeTickets: columnFor(["VÉ MIỄN PHÍ BÁO CÁO"], 17),
    note: columnFor(["GHI CHÚ"], 21),
  };
}

function parseM02(sheet) {
  const headerRow = findM02Header(sheet);
  if (!headerRow) throw new Error(`Sheet “${sheet.name}” thiếu bảng M02 với các cột STT, CHI NHÁNH, TUYẾN, SỐ XE`);
  const columns = findM02Columns(sheet, headerRow);
  const rows = [];
  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const serviceQualityCell = row.getCell(columns.serviceQuality);
    const roadSafetyCell = row.getCell(columns.roadSafety);
    const noteCell = row.getCell(columns.note);
    const branch = cleanText(cellValue(row.getCell(columns.branch)));
    const route = cleanText(cellValue(row.getCell(columns.route)));
    const vehicle = cleanText(cellValue(row.getCell(columns.vehicle)));
    // NGÀY của báo cáo chi tiết phải lấy từ chính ô NGÀY của từng dòng M02.
    // Không thay bằng ngày trong tiêu đề M03 hoặc tên file, vì các ngày có thể khác nhau.
    const date = parseDate(cellValue(row.getCell(columns.date)));
    if (!branch || !route || !vehicle) continue;
    rows.push({
      sourceRow: rowNumber,
      branch,
      route,
      vehicle,
      departureTime: parseTime(cellValue(row.getCell(columns.departureTime))),
      arrivalTime: parseTime(cellValue(row.getCell(columns.arrivalTime))),
      date,
      driver: cleanText(cellValue(row.getCell(columns.driver))),
      assistant: cleanText(cellValue(row.getCell(columns.assistant))),
      serviceQuality: cleanText(cellValue(serviceQualityCell)),
      serviceQualityRuns: styledTextRuns(serviceQualityCell),
      roadSafety: cleanText(cellValue(roadSafetyCell)),
      roadSafetyRuns: styledTextRuns(roadSafetyCell),
      actualPassengers: cellValue(row.getCell(columns.actualPassengers)) ?? "",
      actualLuggage: cellValue(row.getCell(columns.actualLuggage)) ?? "",
      actualFreeTickets: cellValue(row.getCell(columns.actualFreeTickets)) ?? "",
      reportedPassengers: cellValue(row.getCell(columns.reportedPassengers)) ?? "",
      reportedLuggage: cellValue(row.getCell(columns.reportedLuggage)) ?? "",
      reportedFreeTickets: cellValue(row.getCell(columns.reportedFreeTickets)) ?? "",
      note: preserveText(cellValue(noteCell)),
      noteRuns: styledTextRuns(noteCell),
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

function parseM03(sheet, reportDate = "") {
  const fallbackDate = reportDate || parseDate(cellValue(sheet.getCell("C1"))) || parseDate(cellValue(sheet.getCell("A1")));
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
    const date = fallbackDate || parseDate(cellValue(row.getCell(9)));
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
      date,
    });
  }
  return rows;
}

function findDateInTopRows(sheet, maxRows = 5, maxColumns = 10) {
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
  if (!left || !right || left === "OK" || right === "OK") return 0;
  if (left.includes(right) || right.includes(left)) return 1;
  const leftWords = new Set(left.split(" ").filter(word => word.length > 1));
  const rightWords = new Set(right.split(" ").filter(word => word.length > 1));
  if (!leftWords.size || !rightWords.size) return 0;
  const common = [...leftWords].filter(word => rightWords.has(word)).length;
  return common / Math.min(leftWords.size, rightWords.size);
}

function isViolationMatch(violation, detail) {
  const sameRoute = comparable(violation.branch) === comparable(detail.branch)
    && comparable(violation.route) === comparable(detail.route)
    && comparable(violation.vehicle) === comparable(detail.vehicle);
  if (!sameRoute) return false;
  return personMatches(violation.employeeName, detail)
    && contentSimilarity(violation.violation, detail.note) >= 0.75;
}

async function parseWorkbook(file) {
  if (!file?.name?.toLowerCase().endsWith(".xlsx")) throw new Error(`${file?.name || "File Hậu kiểm"}: chỉ chấp nhận định dạng .xlsx`);
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error(`${file.name}: file Excel không hợp lệ hoặc đã bị hỏng`);
  }
  const m02 = findSheet(workbook, "M02");
  const m03 = findSheet(workbook, "M03");
  if (!m02 || !m03) throw new Error(`${file.name}: phải có đủ hai sheet M02 và M03`);
  // Ngày chung chỉ dùng làm ngày dự phòng cho các dòng vi phạm M03:
  // ưu tiên tiêu đề M03, sau đó tên file, rồi mới quét phần đầu của M02.
  // Các dòng chi tiết M02 luôn lấy NGÀY trực tiếp từ cột tương ứng của từng dòng.
  const reportDate = findDateInTopRows(m03)
    || parseDate(file.name)
    || findDateInTopRows(m02);
  const detailRows = parseM02(m02);
  const violations = parseM03(m03, reportDate);
  return {
    fileName: file.name,
    reportDate,
    detailRows,
    violations,
    dates: [...new Set([...detailRows.map(row => row.date), ...violations.map(row => row.date).filter(Boolean)])].sort(),
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
    .sort((a, b) => a.branch.localeCompare(b.branch, "vi", { numeric: true }) || a.route.localeCompare(b.route, "vi", { numeric: true }))
    .map((row, index) => ({ ...row, stt: index + 1, total: row.finance + row.atgt + row.cldv }));
}

// Khoảng ngày do người dùng nhập không được truyền vào hàm này.
// Hàm xử lý chỉ đọc dữ liệu và ngày thực tế từ từng file Hậu kiểm.
export async function processHauKiemFiles(files) {
  if (!Array.isArray(files) || !files.length) throw new Error("Vui lòng chọn ít nhất 1 file Hậu kiểm");
  if (files.length > 7) throw new Error("Chỉ được xử lý tối đa 7 file Hậu kiểm trong một lần");
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
  // GHI CHÚ trong BCCT.HKVP phải giữ nguyên nội dung người dùng đã nhập ở
  // M02. Kết quả đối chiếu M03 chỉ hiển thị trên web, không nối thêm vào ô này.
  const reportDetailRows = detailRows.map(row => ({ ...row }));
  // BCCT.HKVP chỉ chứa các dòng hậu kiểm gốc của M02. Trường hợp có trong
  // danh sách vi phạm M03 nhưng không tìm thấy dòng M02 tương ứng vẫn được
  // giữ trong `violations` để hiển thị/đối chiếu trên web, nhưng tuyệt đối
  // không tạo thêm một dòng xe mới trong file Excel BCCT.HKVP.
  reportDetailRows.sort((left, right) => (left.date || "9999-12-31").localeCompare(right.date || "9999-12-31"));
  return {
    summary: buildSummary(detailRows, violations),
    detailRows: detailRows.map((row, index) => ({ ...row, stt: index + 1 })),
    reportDetailRows: reportDetailRows.map((row, index) => ({ ...row, stt: index + 1 })),
    violations: violations.map((row, index) => ({ ...row, stt: index + 1 })),
    fileSummaries: parsedFiles.map(item => ({ fileName: item.fileName, reportDate: item.reportDate, detailCount: item.detailRows.length, violationCount: item.violations.length, dates: item.dates })),
    unmatchedCount: violations.filter(row => !row.matchedM02).length,
    ignoredOtherCount: violations.filter(row => row.category === "other").length,
  };
}

export async function fingerprintHauKiemFile(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export const __test__ = { parseDate, parseTime, contentSimilarity, isViolationMatch, buildSummary, findM02Header, findM02Columns, parseM02 };
