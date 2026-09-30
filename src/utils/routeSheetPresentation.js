import { normalizeRouteSheet } from "./routeSheet.js";

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function upperText(value) {
  return text(value).toLocaleUpperCase("vi");
}

function hasLetters(value) {
  return /[A-ZÀ-ỸĐ]/i.test(text(value));
}

function looksUppercaseLabel(value) {
  const source = text(value);
  if (!source || !hasLetters(source)) return false;
  const lettersOnly = source.replace(/[^A-Za-zÀ-ỹĐđ]/g, "");
  if (!lettersOnly) return false;
  return source === source.toLocaleUpperCase("vi");
}

function looksHeaderKeyword(value) {
  const source = upperText(value);
  return [
    "STT",
    "CHI NHÁNH",
    "TÊN TUYẾN",
    "COPY - PASTE",
    "MÃ SỐ TUYẾN",
    "MST",
    "CỰ LY",
    "KHT",
    "ĐIỀU ĐỘ",
    "THÔNG TIN LIÊN HỆ",
    "CHỨC VỤ",
    "TUYẾN HCM",
    "TUYẾN BUÝT",
    "TÊN",
    "LINK",
  ].some(keyword => source.includes(keyword));
}

export function routeRowKind(sheet, rowIndex) {
  const normalized = normalizeRouteSheet(sheet);
  const row = normalized.rows[rowIndex];
  if (!row) return "body";

  const values = row.cells.map(text).filter(Boolean);
  if (!values.length) return "blank";
  if (rowIndex === 0) return "header";

  if (values.some(value => upperText(value).includes("COPY - PASTE VÔ BA GPS"))) return "header";

  if (values.length === 1) {
    const value = values[0];
    const upper = upperText(value);
    if (
      looksUppercaseLabel(value)
      || upper.includes("BẢNG THÔNG TIN")
      || upper.includes("CÔNG THỨC")
      || upper.includes("TUYẾN BUÝT")
    ) return "section";
  }

  const headerLike = values.filter(value => looksUppercaseLabel(value) || looksHeaderKeyword(value)).length;
  if (values.length >= 2 && headerLike / values.length >= 0.6) return "header";

  return "body";
}

export function routeColumnMetrics(sheet, colIndex) {
  const normalized = normalizeRouteSheet(sheet);
  const values = normalized.rows
    .map(row => text(row.cells[colIndex]))
    .filter(Boolean);

  if (!values.length) return { widthPx: 26, excelWidth: 4, empty: true };

  const longest = Math.max(...values.map(value => Math.max(...value.split(/\r?\n/).map(line => line.length))));
  const numericRatio = values.filter(value => /^\d+(?:[.,-]\d+)*$/.test(value)).length / values.length;

  let widthPx;
  if (numericRatio >= 0.75 && longest <= 10) widthPx = 72;
  else if (longest <= 5) widthPx = 76;
  else if (longest <= 10) widthPx = 96;
  else if (longest <= 18) widthPx = 132;
  else if (longest <= 30) widthPx = 176;
  else if (longest <= 48) widthPx = 220;
  else widthPx = 286;

  const density = values.length / Math.max(normalized.rows.length, 1);
  if (density < 0.08 && longest <= 18) widthPx = Math.min(widthPx, 72);

  return {
    widthPx,
    excelWidth: Math.max(8, Math.min(42, Math.round(widthPx / 7))),
    empty: false,
  };
}

export function routeSheetColumnMetrics(sheet) {
  const normalized = normalizeRouteSheet(sheet);
  return Array.from(
    { length: normalized.columnCount },
    (_, colIndex) => routeColumnMetrics(normalized, colIndex),
  );
}

export const __test__ = {
  looksUppercaseLabel,
  looksHeaderKeyword,
};
