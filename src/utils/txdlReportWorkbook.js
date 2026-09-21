import ExcelJS from "exceljs";
import { applyStandardReportHeader } from "./reportHeader.js";

const FIRST_DATA_ROW = 8;

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function cellText(value) {
  if (value?.richText) return value.richText.map(item => item.text || "").join("");
  if (value?.text !== undefined) return String(value.text || "");
  if (value?.result !== undefined) return String(value.result ?? "");
  return String(value ?? "");
}

function normalize(value) {
  return cellText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function copyRowStyle(sheet, fromRow, toRow) {
  const source = sheet.getRow(fromRow);
  const target = sheet.getRow(toRow);
  target.height = source.height;
  source.eachCell({ includeEmpty: true }, (cell, column) => {
    const dest = target.getCell(column);
    dest.style = clone(cell.style);
    dest.font = clone(cell.font);
    dest.border = clone(cell.border);
    dest.fill = clone(cell.fill);
    dest.alignment = clone(cell.alignment);
    dest.numFmt = cell.numFmt;
    dest.protection = clone(cell.protection);
  });
}

function rangeStartRow(range) {
  const match = String(range).match(/^[A-Z]+(\d+):/i);
  return match ? Number(match[1]) : 0;
}

function shiftMergeRange(range, offset) {
  return String(range).replace(/([A-Z]+)(\d+)/gi, (_, column, row) => `${column}${Number(row) + offset}`);
}

function moveMergesBelow(sheet, startRow, offset, callback) {
  const merges = [...(sheet.model?.merges || [])].filter(range => rangeStartRow(range) >= startRow);
  merges.forEach(range => {
    try { sheet.unMergeCells(range); } catch {}
  });
  callback();
  merges.forEach(range => {
    try { sheet.mergeCells(shiftMergeRange(range, offset)); } catch {}
  });
}

export function findTxdlSummaryRow(sheet) {
  for (let row = FIRST_DATA_ROW; row <= sheet.rowCount; row += 1) {
    const text = normalize(sheet.getCell(row, 1).value);
    if (text === "TONG" || text === "TOTAL") return row;

    const formulaG = String(sheet.getCell(row, 7).formula || "").toUpperCase();
    const formulaH = String(sheet.getCell(row, 8).formula || "").toUpperCase();
    if (formulaG.startsWith("SUM(") && formulaH.startsWith("SUM(")) return row;

    if (text.startsWith("2.") && (text.includes("KHO KHAN") || text.includes("DE XUAT")) && row > FIRST_DATA_ROW) {
      return row - 1;
    }
  }
  throw new Error("Không xác định được dòng Tổng trong template TXDL. Vui lòng dùng đúng file mẫu TXDL.");
}

function prepareRows(sheet, count) {
  const summaryRow = findTxdlSummaryRow(sheet);
  const currentCapacity = Math.max(1, summaryRow - FIRST_DATA_ROW);
  const extra = Math.max(0, count - currentCapacity);
  if (!extra) return summaryRow;

  moveMergesBelow(sheet, summaryRow, extra, () => {
    sheet.spliceRows(summaryRow, 0, ...Array.from({ length: extra }, () => []));
  });

  for (let index = 0; index < extra; index += 1) {
    copyRowStyle(sheet, FIRST_DATA_ROW, FIRST_DATA_ROW + 1 + index);
  }
  return summaryRow + extra;
}

function fillRows(sheet, rows) {
  const summaryRow = prepareRows(sheet, rows.length);

  for (let rowNumber = FIRST_DATA_ROW; rowNumber < summaryRow; rowNumber += 1) {
    try { sheet.unMergeCells(`G${rowNumber}:H${rowNumber}`); } catch {}
    for (let column = 1; column <= 8; column += 1) sheet.getCell(rowNumber, column).value = null;
  }

  rows.forEach((item, index) => {
    const rowNumber = FIRST_DATA_ROW + index;
    const row = sheet.getRow(rowNumber);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = item.branch || "";
    row.getCell(3).value = item.route || "";
    row.getCell(4).value = item.vehicle || "";
    row.getCell(5).value = item.content || "";
    row.getCell(6).value = item.employeeName || "";

    if (item.supportCustomer) {
      try { sheet.unMergeCells(`G${rowNumber}:H${rowNumber}`); } catch {}
      sheet.mergeCells(`G${rowNumber}:H${rowNumber}`);
      const supportCell = row.getCell(7);
      supportCell.value = "HỖ TRỢ KHÁCH HÀNG";
      supportCell.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFF0000" } };
      supportCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    } else {
      row.getCell(7).value = item.noViolation ? 1 : "";
      row.getCell(8).value = item.violation ? 1 : "";
    }

    for (let column = 1; column <= 8; column += 1) {
      if (item.supportCustomer && column === 8) continue;
      const cell = row.getCell(column);
      cell.font = {
        ...cell.font,
        name: "Times New Roman",
        size: 11,
        bold: item.supportCustomer && column === 7 ? true : Boolean(cell.font?.bold),
        color: item.supportCustomer && column === 7
          ? { argb: "FFFF0000" }
          : (cell.font?.color || { argb: "FF000000" }),
      };
      cell.alignment = {
        ...cell.alignment,
        vertical: "middle",
        horizontal: [3, 5, 6].includes(column) ? "left" : "center",
        wrapText: true,
      };
    }

    if (item.supportCustomer) {
      const supportCell = row.getCell(7);
      supportCell.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFF0000" } };
      supportCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    }
  });

  const total = sheet.getRow(summaryRow);
  try { sheet.unMergeCells(`A${summaryRow}:F${summaryRow}`); } catch {}
  sheet.mergeCells(`A${summaryRow}:F${summaryRow}`);
  const totalLabel = total.getCell(1);
  totalLabel.value = "TỔNG";
  totalLabel.font = { ...totalLabel.font, name: "Times New Roman", size: 12, bold: true, color: { argb: "FF000000" } };
  totalLabel.alignment = { ...totalLabel.alignment, horizontal: "center", vertical: "middle", wrapText: true };

  const noViolationTotal = total.getCell(7);
  noViolationTotal.value = rows.filter(row => Number(row.noViolation) === 1).length;
  noViolationTotal.font = { ...noViolationTotal.font, name: "Times New Roman", size: 11, bold: true, color: { argb: "FF000000" } };
  noViolationTotal.alignment = { ...noViolationTotal.alignment, horizontal: "center", vertical: "middle" };

  const violationTotal = total.getCell(8);
  violationTotal.value = rows.filter(row => Number(row.violation) === 1).length;
  violationTotal.font = { ...violationTotal.font, name: "Times New Roman", size: 11, bold: true, color: { argb: "FF000000" } };
  violationTotal.alignment = { ...violationTotal.alignment, horizontal: "center", vertical: "middle" };
  return summaryRow;
}

export async function buildTxdlReportWorkbook(templateBuffer, { results, startDate, endDate, employees }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.getWorksheet("BCTH P.QLCL");
  if (!sheet) throw new Error("Không tìm thấy sheet BCTH P.QLCL trong template TXDL");

  applyStandardReportHeader(sheet, startDate, endDate, "A1");
  sheet.getCell("A4").value = `Họ & Tên: ${String(employees || "").trim()}`;
  const summaryRow = fillRows(sheet, results?.rows || []);

  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "landscape";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.printArea = `A1:H${Math.max(sheet.rowCount, summaryRow)}`;
  delete sheet.pageSetup.scale;
  return workbook;
}

export const __test__ = { fillRows, prepareRows };
