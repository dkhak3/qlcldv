import ExcelJS from "exceljs";

const HEADER_ALIASES = {
  STT: ["STT", "STT JOB"],
  NGAY_TIEP_NHAN: ["NGAY TIEP NHAN"],
  NGAY_PHAN_HOI: ["NGAY PHAN HOI"],
  TEN_NHAN_VIEN_DVKH: ["TEN NHAN VIEN DVKH"],
  TEN_NHAN_VIEN_QLCL: ["TEN NHAN VIEN QLCL DV", "TEN NHAN VIEN QLCL-DV"],
  NOI_DUNG_TIEP_NHAN_PHAN_ANH: ["NOI DUNG TIEP NHAN PHAN ANH"],
  TUYEN: ["TUYEN"],
  BIEN_KIEM_SOAT: ["BIEN KIEM SOAT", "BKS"],
  HO_TEN_NHAN_VIEN_BI_PHAN_ANH: ["HO TEN NHAN VIEN BI PHAN ANH", "NHAN VIEN BI PHAN ANH"],
  VI_PHAM: ["XAC DINH TINH VI PHAM"],
};

const SHEET1_REQUIRED = ["STT", "NGAY_PHAN_HOI", "NOI_DUNG_TIEP_NHAN_PHAN_ANH"];
const SHEET2_REQUIRED = ["STT", "VI_PHAM"];

function scalarValue(value) {
  if (value?.result !== undefined) return value.result;
  if (value?.richText) return value.richText.map(item => item.text).join("");
  if (value?.text !== undefined) return value.text;
  return value;
}

function normalizeText(value = "") {
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

function cleanText(value = "") {
  return String(scalarValue(value) ?? "").replace(/\s+/g, " ").trim();
}

function normalizeStt(value) {
  const text = cleanText(value);
  return /^\d+\.0+$/.test(text) ? text.replace(/\.0+$/, "") : text;
}

function canonicalHeader(value) {
  const normalized = normalizeText(value);
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) return key;
  }
  return "";
}

function findHeaderLayout(sheet, required) {
  let best = null;
  for (let rowNumber = 1; rowNumber <= Math.min(12, sheet.rowCount || 12); rowNumber += 1) {
    const columns = {};
    for (let column = 1; column <= Math.min(40, sheet.columnCount || 40); column += 1) {
      const key = canonicalHeader(sheet.getCell(rowNumber, column).value);
      if (key && !columns[key]) columns[key] = column;
    }
    const score = required.filter(key => columns[key]).length;
    if (!best || score > best.score) best = { rowNumber, columns, score };
    if (score === required.length) return { headerRow: rowNumber, columns, missing: [] };
  }
  const missing = required.filter(key => !best?.columns?.[key]);
  return { headerRow: best?.rowNumber || 0, columns: best?.columns || {}, missing };
}

function dateParts(value) {
  const item = scalarValue(value);
  if (item instanceof Date && !Number.isNaN(item.getTime())) {
    return { year: item.getFullYear(), month: item.getMonth() + 1, day: item.getDate() };
  }
  if (typeof item === "number" && Number.isFinite(item)) {
    const date = new Date(Math.round((item - 25569) * 86400 * 1000));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  }
  const text = String(item ?? "").trim();
  let match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (match) return { year: Number(match[3]), month: Number(match[2]), day: Number(match[1]) };
  match = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  return null;
}

function dateToIso(value) {
  const parts = dateParts(value);
  if (!parts) return "";
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function dateToDisplay(value) {
  const parts = dateParts(value);
  if (!parts) return cleanText(value);
  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

function readRows(sheet, layout) {
  const rows = [];
  for (let rowNumber = layout.headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const item = {};
    Object.entries(layout.columns).forEach(([key, column]) => {
      item[key] = scalarValue(sheet.getCell(rowNumber, column).value);
    });
    const stt = normalizeStt(item.STT);
    if (!stt) continue;
    rows.push({ ...item, STT: stt, __ROW: rowNumber });
  }
  return rows;
}

function classifyViolation(value) {
  const text = normalizeText(value);
  if (text.includes("HO TRO KHACH HANG")) return "SUPPORT";
  if (text.includes("KHONG VI PHAM")) return "NO";
  if (text.includes("CO VI PHAM")) return "YES";
  return "";
}

function normalizeContentText(content = "") {
  return String(content ?? "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTxdlBranch(content = "") {
  const text = normalizeContentText(content);
  if (!text) return "";
  if (/1\/\s*Nguồn tiếp nhận:/i.test(text)) {
    const match = text.match(/2\/[\s\S]*?:\s*([\s\S]*?)(?=\s*3\/|\s*4\/|\s*5\/|\s*6\/|\s*7\/|$)/i);
    return match ? match[1].trim() : "";
  }
  const match = text.match(/1\/[\s\S]*?:\s*([\s\S]*?)(?=\s*2\/|\s*3\/|\s*4\/|\s*5\/|\s*6\/|$)/i);
  return match ? match[1].trim() : "";
}

export function extractTxdlContent(content = "") {
  const text = normalizeContentText(content);
  if (!text) return "";
  if (/1\/\s*Nguồn tiếp nhận:/i.test(text)) {
    const match = text.match(/6\/[\s\S]*?:\s*([\s\S]*?)(?=\s*7\/[\s\S]*?:|$)/i);
    return match ? match[1].trim() : "";
  }
  const match = text.match(/5\/[\s\S]*?:\s*([\s\S]*?)(?=\s*6\/[\s\S]*?:|$)/i);
  return match ? match[1].trim() : "";
}

async function loadTxdlWorkbook(file) {
  if (!file || !file.name?.toLowerCase().endsWith(".xlsx")) throw new Error("File TXDL: chỉ chấp nhận định dạng .xlsx");
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(await file.arrayBuffer()); }
  catch { throw new Error("File TXDL bị hỏng hoặc không phải XLSX hợp lệ"); }
  if (workbook.worksheets.length < 2) throw new Error("File TXDL phải có tối thiểu 2 sheet");
  return workbook;
}

function inspectWorkbook(workbook) {
  const sheet1 = workbook.worksheets[0];
  const sheet2 = workbook.worksheets[1];
  const layout1 = findHeaderLayout(sheet1, SHEET1_REQUIRED);
  const layout2 = findHeaderLayout(sheet2, SHEET2_REQUIRED);
  const missing1 = [
    ...layout1.missing,
    ...["NGAY_TIEP_NHAN", "TEN_NHAN_VIEN_DVKH", "TEN_NHAN_VIEN_QLCL"].filter(key => !layout1.columns[key]),
  ];
  const missing2 = [
    ...layout2.missing,
    ...["TUYEN", "BIEN_KIEM_SOAT", "HO_TEN_NHAN_VIEN_BI_PHAN_ANH"].filter(key => !layout2.columns[key]),
  ];
  return { sheet1, sheet2, layout1, layout2, missing1: [...new Set(missing1)], missing2: [...new Set(missing2)] };
}

const LABELS = {
  STT: "STT",
  NGAY_TIEP_NHAN: "NGÀY TIẾP NHẬN",
  NGAY_PHAN_HOI: "NGÀY PHẢN HỒI",
  TEN_NHAN_VIEN_DVKH: "TÊN NHÂN VIÊN DVKH",
  TEN_NHAN_VIEN_QLCL: "TÊN NHÂN VIÊN QLCL-DV",
  NOI_DUNG_TIEP_NHAN_PHAN_ANH: "NỘI DUNG TIẾP NHẬN PHẢN ÁNH",
  TUYEN: "TUYẾN",
  BIEN_KIEM_SOAT: "BIỂN KIỂM SOÁT",
  HO_TEN_NHAN_VIEN_BI_PHAN_ANH: "HỌ TÊN NHÂN VIÊN BỊ PHẢN ÁNH",
  VI_PHAM: "XÁC ĐỊNH TÍNH VI PHẠM",
};

export async function inspectTxdlFile(file) {
  const workbook = await loadTxdlWorkbook(file);
  const info = inspectWorkbook(workbook);
  const errors = [];
  if (info.missing1.length) errors.push(`${info.sheet1.name}: thiếu ${info.missing1.map(key => LABELS[key] || key).join(", ")}`);
  if (info.missing2.length) errors.push(`${info.sheet2.name}: thiếu ${info.missing2.map(key => LABELS[key] || key).join(", ")}`);
  return {
    valid: errors.length === 0,
    label: "TXDL",
    matchedSheets: [info.sheet1.name, info.sheet2.name],
    foundSheets: workbook.worksheets.map(sheet => sheet.name),
    message: errors.length ? "File TXDL chưa đúng cấu trúc dữ liệu cần dùng." : "File TXDL hợp lệ – đã nhận diện 2 sheet dữ liệu.",
    detail: errors.join("; "),
  };
}

export async function processTxdlFile(file, startDate, endDate) {
  const workbook = await loadTxdlWorkbook(file);
  const info = inspectWorkbook(workbook);
  if (info.missing1.length || info.missing2.length) {
    const inspected = await inspectTxdlFile(file);
    throw new Error(inspected.detail || inspected.message);
  }

  const sheet1Rows = readRows(info.sheet1, info.layout1).map(row => ({
    ...row,
    __DATE: dateToIso(row.NGAY_PHAN_HOI),
  }));
  const sheet2Rows = readRows(info.sheet2, info.layout2);

  const filtered = sheet1Rows.filter(row => {
    if (!row.__DATE) return false;
    if (startDate && row.__DATE < startDate) return false;
    if (endDate && row.__DATE > endDate) return false;
    return true;
  });

  const sheet2Map = new Map();
  sheet2Rows.forEach(row => {
    const stt = normalizeStt(row.STT);
    if (!stt || Number.isNaN(Number(stt))) return;
    sheet2Map.set(stt, row);
  });

  const rows = [];
  const removedRows = [];
  let totalViolation = 0;
  let totalNoViolation = 0;
  let totalSupportCustomer = 0;

  filtered.forEach(source => {
    const matched = sheet2Map.get(normalizeStt(source.STT));
    if (!matched) {
      removedRows.push({
        jobStt: source.STT,
        receivedDate: dateToDisplay(source.NGAY_TIEP_NHAN),
        responseDate: dateToDisplay(source.NGAY_PHAN_HOI),
        dvkhEmployee: cleanText(source.TEN_NHAN_VIEN_DVKH),
        qlclEmployee: cleanText(source.TEN_NHAN_VIEN_QLCL),
        content: cleanText(source.NOI_DUNG_TIEP_NHAN_PHAN_ANH),
        reason: `Không tìm thấy STT ${source.STT} của Sheet 1 trong Sheet 2`,
      });
      return;
    }

    const type = classifyViolation(matched.VI_PHAM);
    if (type === "YES") totalViolation += 1;
    if (type === "NO") totalNoViolation += 1;
    if (type === "SUPPORT") totalSupportCustomer += 1;

    rows.push({
      jobStt: source.STT,
      branch: extractTxdlBranch(source.NOI_DUNG_TIEP_NHAN_PHAN_ANH),
      route: cleanText(matched.TUYEN),
      vehicle: cleanText(matched.BIEN_KIEM_SOAT),
      content: extractTxdlContent(source.NOI_DUNG_TIEP_NHAN_PHAN_ANH),
      employeeName: cleanText(matched.HO_TEN_NHAN_VIEN_BI_PHAN_ANH),
      noViolation: type === "NO" ? 1 : 0,
      violation: type === "YES" ? 1 : 0,
      supportCustomer: type === "SUPPORT",
      violationType: type,
    });
  });

  rows.sort((a, b) => Number(a.jobStt) - Number(b.jobStt));
  return {
    rows: rows.map((row, index) => ({ ...row, stt: index + 1 })),
    removedRows,
    totalBeforeFilter: sheet1Rows.length,
    totalAfterFilter: filtered.length,
    totalMatched: rows.length,
    totalRemoved: removedRows.length,
    totalViolation,
    totalNoViolation,
    totalSupportCustomer,
    sourceSheets: [info.sheet1.name, info.sheet2.name],
  };
}

export const __test__ = {
  classifyViolation,
  dateToIso,
  extractTxdlBranch,
  extractTxdlContent,
  normalizeStt,
};
