import ExcelJS from "exceljs";

export const MAX_ROUTE_WORKBOOK_BYTES = 8 * 1024 * 1024;
export const MAX_ROUTE_PREVIEW_CELLS = 160000;

function argbToHex(color) {
  const argb = String(color?.argb || "").replace("#", "").trim();
  if (/^[0-9A-F]{8}$/i.test(argb)) return `#${argb.slice(2).toUpperCase()}`;
  if (/^[0-9A-F]{6}$/i.test(argb)) return `#${argb.toUpperCase()}`;
  return "";
}

function borderToCss(border) {
  if (!border?.style) return "";
  const width = ["medium", "mediumDashed", "mediumDashDot", "mediumDashDotDot"].includes(border.style)
    ? 2
    : ["thick", "double"].includes(border.style) ? 3 : 1;
  const style = border.style === "double" ? "double"
    : /dash/i.test(border.style) ? "dashed"
      : /dot/i.test(border.style) ? "dotted" : "solid";
  return `${width}px ${style} ${argbToHex(border.color) || "#D1D5DB"}`;
}

function cellText(cell) {
  const value = cell?.value;
  if (value == null) return "";
  if (typeof value === "object") {
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text || "").join("");
    if (Object.prototype.hasOwnProperty.call(value, "formula")) {
      const result = value.result;
      if (result == null) return String(value.formula || "");
      if (result instanceof Date) return cell.text || result.toLocaleDateString("vi-VN");
      return cell.text || String(result);
    }
    if (value instanceof Date) return cell.text || value.toLocaleDateString("vi-VN");
    if (value.text != null) return String(value.text);
  }
  return cell.text || String(value);
}

function cellCss(cell) {
  const fill = cell?.fill?.type === "pattern" && cell.fill.pattern === "solid"
    ? argbToHex(cell.fill.fgColor)
    : "";
  const fontColor = argbToHex(cell?.font?.color);
  const alignment = cell?.alignment || {};
  const font = cell?.font || {};
  const css = {};

  if (fill) css.backgroundColor = fill;
  if (fontColor) css.color = fontColor;
  if (font.bold) css.fontWeight = 700;
  if (font.italic) css.fontStyle = "italic";
  if (font.size) css.fontSize = `${Math.max(8, Math.min(28, Number(font.size) * 1.333)).toFixed(1)}px`;
  if (font.name) css.fontFamily = `"${String(font.name).replace(/"/g, "")}", sans-serif`;
  if (font.underline) css.textDecoration = "underline";

  const horizontal = alignment.horizontal;
  if (["left", "center", "right", "justify"].includes(horizontal)) css.textAlign = horizontal;
  const vertical = alignment.vertical;
  if (vertical === "middle") css.verticalAlign = "middle";
  else if (vertical === "top") css.verticalAlign = "top";
  else if (vertical === "bottom") css.verticalAlign = "bottom";
  if (alignment.wrapText) css.whiteSpace = "pre-wrap";

  const top = borderToCss(cell?.border?.top);
  const right = borderToCss(cell?.border?.right);
  const bottom = borderToCss(cell?.border?.bottom);
  const left = borderToCss(cell?.border?.left);
  if (top) css.borderTop = top;
  if (right) css.borderRight = right;
  if (bottom) css.borderBottom = bottom;
  if (left) css.borderLeft = left;

  return css;
}

function excelColumnWidthToPx(width) {
  const numeric = Number(width);
  if (!Number.isFinite(numeric) || numeric <= 0) return 96;
  return Math.max(28, Math.min(520, Math.round(numeric * 7 + 5)));
}

function excelRowHeightToPx(height) {
  const numeric = Number(height);
  if (!Number.isFinite(numeric) || numeric <= 0) return 24;
  return Math.max(20, Math.min(320, Math.round(numeric * (96 / 72))));
}

function parseCellRef(ref) {
  const match = String(ref || "").match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const letters = match[1].toUpperCase();
  let col = 0;
  for (const letter of letters) col = col * 26 + (letter.charCodeAt(0) - 64);
  return { row: Number(match[2]) - 1, col: col - 1 };
}

export function parseMergeRef(ref) {
  const [startRef, endRef] = String(ref || "").split(":");
  const start = parseCellRef(startRef);
  const end = parseCellRef(endRef || startRef);
  if (!start || !end) return null;
  return {
    rowStart: Math.min(start.row, end.row),
    rowEnd: Math.max(start.row, end.row),
    colStart: Math.min(start.col, end.col),
    colEnd: Math.max(start.col, end.col),
  };
}

export function getPreviewMergeAt(sheet, row, col) {
  return (sheet?.merges || []).find(range =>
    row >= range.rowStart && row <= range.rowEnd
    && col >= range.colStart && col <= range.colEnd
  ) || null;
}

export function isPreviewMergeMaster(range, row, col) {
  return Boolean(range && range.rowStart === row && range.colStart === col);
}

export function previewSelectionBounds(selection) {
  if (!selection?.anchor || !selection?.focus) return null;
  return {
    rowStart: Math.min(selection.anchor.row, selection.focus.row),
    rowEnd: Math.max(selection.anchor.row, selection.focus.row),
    colStart: Math.min(selection.anchor.col, selection.focus.col),
    colEnd: Math.max(selection.anchor.col, selection.focus.col),
  };
}

export function previewSelectionCount(selection) {
  const bounds = previewSelectionBounds(selection);
  if (!bounds) return 0;
  return (bounds.rowEnd - bounds.rowStart + 1) * (bounds.colEnd - bounds.colStart + 1);
}

export function isPreviewCellSelected(selection, row, col) {
  const bounds = previewSelectionBounds(selection);
  return Boolean(bounds
    && row >= bounds.rowStart && row <= bounds.rowEnd
    && col >= bounds.colStart && col <= bounds.colEnd);
}

export function previewSelectionToText(sheet, selection) {
  const bounds = previewSelectionBounds(selection);
  if (!bounds) return "";
  const lines = [];
  for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
    const values = [];
    for (let col = bounds.colStart; col <= bounds.colEnd; col += 1) {
      const merge = getPreviewMergeAt(sheet, row, col);
      if (merge && !isPreviewMergeMaster(merge, row, col)) values.push("");
      else values.push(String(sheet?.rows?.[row]?.[col]?.text ?? ""));
    }
    lines.push(values.join("\t"));
  }
  return lines.join("\r\n");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cssObjectToString(css = {}) {
  return Object.entries(css)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => {
      const kebab = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      return `${kebab}:${String(value).replace(/"/g, "&quot;")}`;
    })
    .join(";");
}

export function previewSelectionToHtml(sheet, selection) {
  const bounds = previewSelectionBounds(selection);
  if (!bounds) return "";
  const rows = [];

  for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
    const cells = [];
    for (let col = bounds.colStart; col <= bounds.colEnd; col += 1) {
      const merge = getPreviewMergeAt(sheet, row, col);
      if (merge && !isPreviewMergeMaster(merge, row, col)) continue;
      const cell = sheet?.rows?.[row]?.[col] || {};
      const clippedRowEnd = merge ? Math.min(merge.rowEnd, bounds.rowEnd) : row;
      const clippedColEnd = merge ? Math.min(merge.colEnd, bounds.colEnd) : col;
      const rowspan = clippedRowEnd - row + 1;
      const colspan = clippedColEnd - col + 1;
      const attrs = [
        rowspan > 1 ? `rowspan="${rowspan}"` : "",
        colspan > 1 ? `colspan="${colspan}"` : "",
        `style="${cssObjectToString(cell.css)}"`,
      ].filter(Boolean).join(" ");
      cells.push(`<td ${attrs}>${escapeHtml(cell.text)}</td>`);
    }
    rows.push(`<tr>${cells.join("")}</tr>`);
  }

  return `<table><tbody>${rows.join("")}</tbody></table>`;
}

export function routePreviewColumnName(index) {
  let value = Number(index) + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result || "A";
}

function sheetPreview(worksheet, index) {
  const mergeRefs = Array.isArray(worksheet?.model?.merges) ? worksheet.model.merges : [];
  const merges = mergeRefs.map(parseMergeRef).filter(Boolean);

  const mergeMaxRow = merges.reduce((max, range) => Math.max(max, range.rowEnd + 1), 0);
  const mergeMaxCol = merges.reduce((max, range) => Math.max(max, range.colEnd + 1), 0);
  const rowCount = Math.max(worksheet.actualRowCount || 0, mergeMaxRow, 1);
  const columnCount = Math.max(worksheet.actualColumnCount || 0, mergeMaxCol, 1);

  const columnWidths = Array.from({ length: columnCount }, (_, col) => {
    const column = worksheet.getColumn(col + 1);
    return column.hidden ? 0 : excelColumnWidthToPx(column.width);
  });

  const rowHeights = Array.from({ length: rowCount }, (_, row) => {
    const excelRow = worksheet.getRow(row + 1);
    return excelRow.hidden ? 0 : excelRowHeightToPx(excelRow.height || worksheet.properties?.defaultRowHeight || 18);
  });

  const rows = Array.from({ length: rowCount }, (_, row) =>
    Array.from({ length: columnCount }, (_, col) => {
      const merge = merges.find(range =>
        row >= range.rowStart && row <= range.rowEnd
        && col >= range.colStart && col <= range.colEnd
      );
      const master = !merge || isPreviewMergeMaster(merge, row, col);
      const cell = worksheet.getCell(row + 1, col + 1);
      const hyperlink = master ? (cell.hyperlink || (typeof cell.value === "object" ? cell.value?.hyperlink : "") || "") : "";
      return {
        text: master ? cellText(cell) : "",
        hyperlink,
        css: master ? cellCss(cell) : {},
      };
    })
  );

  return {
    id: `${index}-${worksheet.name}`,
    index,
    name: worksheet.name,
    rowCount,
    columnCount,
    columnWidths,
    rowHeights,
    merges,
    rows,
  };
}

export async function parseRouteWorkbook(buffer) {
  const bytes = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer || []);
  if (!bytes.byteLength) throw new Error("File Excel trống");
  if (bytes.byteLength > MAX_ROUTE_WORKBOOK_BYTES) {
    throw new Error(`File Excel vượt quá ${Math.round(MAX_ROUTE_WORKBOOK_BYTES / 1024 / 1024)} MB`);
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(bytes);
  } catch {
    throw new Error("File Excel bị hỏng hoặc không đúng định dạng .xlsx");
  }

  if (!workbook.worksheets.length) throw new Error("File Excel không có sheet");

  const sheets = workbook.worksheets.map(sheetPreview);
  const totalCells = sheets.reduce((sum, sheet) => sum + sheet.rowCount * sheet.columnCount, 0);
  if (totalCells > MAX_ROUTE_PREVIEW_CELLS) {
    throw new Error(`File có quá nhiều ô để xem trước (${totalCells.toLocaleString("vi-VN")} ô, tối đa ${MAX_ROUTE_PREVIEW_CELLS.toLocaleString("vi-VN")})`);
  }

  return {
    sheetNames: sheets.map(sheet => sheet.name),
    totalCells,
    sheets,
  };
}
