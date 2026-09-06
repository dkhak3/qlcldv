import ExcelJS from "exceljs";
import FileSaver from "file-saver";
import { normalizeText } from "./cameraProcessor.js";
import { applyStandardReportHeader } from "./reportHeader.js";

const { saveAs } = FileSaver;
const TEMPLATE_URL = "/templates/CITYBUS-BAO-CAO-HO-TRO-GSTT-BP-QLCL-DV.xlsx";
const FILE_NAME = "CITYBUS - BÁO CÁO HỖ TRỢ GSTT BP.QLCL-DV.xlsx";

function findReportArea(sheet) {
  let totalRow = null;
  for (let row = 1; row <= sheet.rowCount; row += 1) {
    if (normalizeText(sheet.getCell(row, 1).value) === "TONG") {
      totalRow = row;
      break;
    }
  }
  if (!totalRow) throw new Error("Không tìm thấy dòng Tổng trong file mẫu Hỗ trợ GSTT");
  const dataStart = 8;
  return { dataStart, totalRow, capacity: totalRow - dataStart };
}

function moveMerge(range, at, count) {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return range;
  let start = Number(match[2]);
  let end = Number(match[4]);
  if (start >= at) {
    start += count;
    end += count;
  } else if (end >= at) end += count;
  return `${match[1]}${start}:${match[3]}${end}`;
}

function prepareDynamicRows(sheet, rows) {
  const area = findReportArea(sheet);
  const extra = Math.max(0, rows.length - area.capacity);
  if (!extra) return;
  const originalMerges = [...sheet.model.merges];
  originalMerges.forEach(range => sheet.unMergeCells(range));
  sheet.duplicateRow(area.dataStart, extra, true);
  originalMerges.forEach(range => sheet.mergeCells(moveMerge(range, area.totalRow, extra)));
}

function fillReport(sheet, rows) {
  const area = findReportArea(sheet);
  for (let row = area.dataStart; row < area.totalRow; row += 1) {
    for (let column = 1; column <= 9; column += 1) sheet.getCell(row, column).value = null;
  }

  rows.forEach((item, index) => {
    const rowNumber = area.dataStart + index;
    const values = [
      item.stt,
      item.branch,
      item.vehicle,
      item.route,
      item.fixed || null,
      item.pending || null,
      item.checked || null,
      item.unrecoverable || null,
      item.reason || null,
    ];
    values.forEach((value, column) => { sheet.getCell(rowNumber, column + 1).value = value; });
    sheet.getCell(rowNumber, 3).numFmt = "@";
    if (item.reason) sheet.getRow(rowNumber).height = Math.max(sheet.getRow(rowNumber).height || 0, 54);
  });

  sheet.getCell(area.totalRow, 1).value = "Tổng";
  for (let column = 5; column <= 8; column += 1) {
    const letter = sheet.getColumn(column).letter;
    sheet.getCell(area.totalRow, column).value = {
      formula: `SUM(${letter}${area.dataStart}:${letter}${area.totalRow - 1})`,
    };
  }
  sheet.getCell(area.totalRow, 9).value = null;
}

export async function buildGsttReportWorkbook(templateBuffer, { results, startDate, endDate, employees }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.getWorksheet("SP BP.GSTT");
  if (!sheet) throw new Error("Không tìm thấy sheet SP BP.GSTT trong file mẫu Hỗ trợ GSTT");

  prepareDynamicRows(sheet, results);
  applyStandardReportHeader(sheet, startDate, endDate);
  sheet.getCell("A4").value = `Họ & Tên: ${employees.trim()}`;
  fillReport(sheet, results);

  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "landscape";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.printArea = `A1:I${sheet.rowCount}`;
  delete sheet.pageSetup.scale;
  return workbook;
}

export async function exportGsttReport(form) {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) throw new Error("Không tải được file mẫu báo cáo Hỗ trợ GSTT");
  const workbook = await buildGsttReportWorkbook(await response.arrayBuffer(), form);
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), FILE_NAME);
}

export const __test__ = { fillReport, findReportArea, prepareDynamicRows };
