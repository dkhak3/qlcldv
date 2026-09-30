import ExcelJS from "exceljs";
import { getReadableTextColor, getRouteCellFill, normalizeRouteSheet } from "./routeSheet.js";
import { routeRowKind, routeSheetColumnMetrics } from "./routeSheetPresentation.js";

function safeSheetName(name, used) {
  const base = String(name || "Sheet")
    .replace(/[\\/?*\[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31) || "Sheet";
  let candidate = base;
  let index = 2;
  while (used.has(candidate.toLocaleLowerCase("vi"))) {
    const suffix = ` (${index})`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }
  used.add(candidate.toLocaleLowerCase("vi"));
  return candidate;
}

function applyBorder(cell, color = "FFD7DEE8") {
  cell.border = {
    top: { style: "thin", color: { argb: color } },
    left: { style: "thin", color: { argb: color } },
    bottom: { style: "thin", color: { argb: color } },
    right: { style: "thin", color: { argb: color } },
  };
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function colorToArgb(value) {
  return `FF${String(value || "").replace("#", "").toUpperCase()}`;
}

function styleDataCell(cell, kind, rowIndex) {
  const baseFont = { name: "Arial", size: 10, color: { argb: "FF334155" } };
  cell.font = baseFont;
  cell.alignment = { vertical: "middle", wrapText: true };

  if (kind === "header") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDFF7FA" } };
    cell.font = { ...baseFont, bold: true, color: { argb: "FF0F4C5C" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    applyBorder(cell, "FF9EDBE5");
    return;
  }

  if (kind === "section") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", wrapText: true };
    applyBorder(cell, "FF0F766E");
    return;
  }

  if (kind === "blank") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    applyBorder(cell, "FFE8EDF3");
    return;
  }

  if (rowIndex % 2 === 1) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBFDFF" } };
  }
  applyBorder(cell);
}

export async function buildRouteWorkbook(sheets = []) {
  if (!Array.isArray(sheets) || !sheets.length) throw new Error("Không có dữ liệu Tuyến để xuất");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "QLCL-DV";
  workbook.subject = "Dữ liệu Tuyến";
  const usedNames = new Set();

  sheets.forEach(sourceSheet => {
    const normalized = normalizeRouteSheet(sourceSheet);
    const worksheet = workbook.addWorksheet(safeSheetName(normalized.name, usedNames));
    const metrics = routeSheetColumnMetrics(normalized);

    normalized.rows.forEach((row, rowIndex) => {
      const excelRow = worksheet.addRow(row.cells);
      const kind = routeRowKind(normalized, rowIndex);
      excelRow.height = kind === "header" ? 30 : kind === "section" ? 27 : 24;

      excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        styleDataCell(cell, kind, rowIndex);
        if (isUrl(cell.value)) {
          const url = String(cell.value);
          cell.value = { text: url, hyperlink: url };
          cell.font = {
            ...cell.font,
            bold: kind === "header" || kind === "section",
            color: { argb: kind === "section" ? "FFFFFFFF" : "FF2563EB" },
            underline: true,
          };
        }

        const customFill = getRouteCellFill(normalized, rowIndex, colNumber - 1);
        if (customFill) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorToArgb(customFill) },
          };
          cell.font = {
            ...cell.font,
            color: { argb: colorToArgb(getReadableTextColor(customFill)) },
          };
        }
      });
    });

    metrics.forEach((metric, index) => {
      worksheet.getColumn(index + 1).width = metric.excelWidth;
    });

    worksheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
    worksheet.pageSetup.orientation = "landscape";
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1;
    worksheet.pageSetup.fitToHeight = 0;
    worksheet.properties.defaultRowHeight = 22;
  });

  return workbook;
}
