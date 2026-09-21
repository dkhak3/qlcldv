import ExcelJS from "exceljs";
import FileSaver from "file-saver";
import { getReportTemplateBuffer } from "../services/reportTemplateService.js";
import { applyStandardReportHeader } from "./reportHeader.js";

const { saveAs } = FileSaver;
const FILE_NAME = "CITYBUS - BÁO CÁO HỖ TRỢ TRÍCH XUẤT DỮ LIỆU BP.QLCL-DV.xlsx";
const FIRST_DATA_ROW = 8;

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function copyRowStyle(sheet, fromRow, toRow) {
  const source = sheet.getRow(fromRow);
  const target = sheet.getRow(toRow);
  target.height = source.height;
  source.eachCell({ includeEmpty: true }, (cell, col) => {
    const dest = target.getCell(col);
    dest.style = clone(cell.style);
    dest.font = clone(cell.font);
    dest.border = clone(cell.border);
    dest.fill = clone(cell.fill);
    dest.alignment = clone(cell.alignment);
    dest.numFmt = cell.numFmt;
    dest.protection = clone(cell.protection);
  });
}

function findSummaryRow(sheet) {
  for (let row = FIRST_DATA_ROW; row <= sheet.rowCount; row += 1) {
    const value = String(sheet.getCell(row, 1).value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
    if (value === "TONG") return row;
  }
  throw new Error("Không tìm thấy dòng TỔNG trong template TXDL");
}

function prepareRows(sheet, count) {
  const summaryRow = findSummaryRow(sheet);
  const capacity = Math.max(1, summaryRow - FIRST_DATA_ROW);
  const extra = Math.max(0, count - capacity);
  if (!extra) return;
  sheet.spliceRows(summaryRow, 0, ...Array.from({ length: extra }, () => []));
  for (let index = 0; index < extra; index += 1) copyRowStyle(sheet, FIRST_DATA_ROW, FIRST_DATA_ROW + 1 + index);
}

function fillRows(sheet, rows) {
  prepareRows(sheet, rows.length);
  const summaryRow = findSummaryRow(sheet);

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
      const cell = row.getCell(column);
      cell.font = { ...cell.font, name: "Times New Roman", size: 11, bold: column === 7 && item.supportCustomer, color: cell.font?.color || { argb: "FF000000" } };
      cell.alignment = {
        ...cell.alignment,
        vertical: "middle",
        horizontal: [3, 5, 6].includes(column) ? "left" : "center",
        wrapText: true,
      };
    }
  });

  const total = sheet.getRow(findSummaryRow(sheet));
  try { sheet.unMergeCells(`A${total.number}:F${total.number}`); } catch {}
  sheet.mergeCells(`A${total.number}:F${total.number}`);
  total.getCell(1).value = "TỔNG";
  total.getCell(7).value = rows.filter(row => Number(row.noViolation) === 1).length;
  total.getCell(8).value = rows.filter(row => Number(row.violation) === 1).length;
}

export async function buildTxdlReportWorkbook(templateBuffer, { results, startDate, endDate, employees }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.getWorksheet("BCTH P.QLCL");
  if (!sheet) throw new Error("Không tìm thấy sheet BCTH P.QLCL trong template TXDL");

  applyStandardReportHeader(sheet, startDate, endDate, "A2");
  sheet.getCell("A4").value = `Họ & Tên: ${String(employees || "").trim()}`;
  fillRows(sheet, results?.rows || []);

  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "landscape";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.printArea = `A1:H${sheet.rowCount}`;
  delete sheet.pageSetup.scale;
  return workbook;
}

export async function exportTxdlReport(form) {
  const templateBuffer = await getReportTemplateBuffer("txdl");
  const workbook = await buildTxdlReportWorkbook(templateBuffer, form);
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), FILE_NAME);
}

export const __test__ = { findSummaryRow, fillRows, prepareRows };
