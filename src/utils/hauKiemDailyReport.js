export const MAX_HAUKIEM_DAILY_REPORT_BYTES = 500 * 1024;

const MIME_TYPES = {
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const ALLOWED_EXTENSIONS = new Set(Object.keys(MIME_TYPES));

export function validateHauKiemDailyReportFile(file) {
  if (!file) throw new Error("Vui lòng chọn File Báo cáo ngày");

  const name = String(file.name || "").trim();
  const extension = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Chỉ hỗ trợ file Excel (.xlsx, .xls, .xlsm), PDF hoặc Word (.doc, .docx)");
  }

  const size = Number(file.size) || 0;
  if (size <= 0) throw new Error("File được chọn đang trống");
  if (size > MAX_HAUKIEM_DAILY_REPORT_BYTES) {
    throw new Error("Dung lượng file tối đa là 500 KB");
  }

  const contentType = file.type && file.type !== "application/octet-stream"
    ? file.type
    : MIME_TYPES[extension];

  return { extension, contentType, size, originalName: name };
}

export function formatHauKiemDailyReportSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return value + " B";
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KB";
  return (value / (1024 * 1024)).toFixed(2) + " MB";
}

export function formatHauKiemDailyReportDate(value) {
  if (!value) return "—";
  const date = typeof value?.toDate === "function"
    ? value.toDate()
    : value instanceof Date
      ? value
      : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
