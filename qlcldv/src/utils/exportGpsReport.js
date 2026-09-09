import ExcelJS from "exceljs";
import FileSaver from "file-saver";
import { normalizeText } from "./cameraProcessor.js";
import { applyStandardReportHeader } from "./reportHeader.js";

const { saveAs } = FileSaver;
const SECTION_TITLES = {
  BA: "1. BINH ANH",
  BA35: "2. BINH ANH 35 TUYEN",
  VIETMAP: "3. VIETMAP",
  TONGDA: "4. TONGDA",
};

function findSection(sheet, title) {
  let headerRow = null;
  for (let row = 1; row <= sheet.rowCount; row += 1) {
    if (normalizeText(sheet.getCell(row, 1).value) === title) { headerRow = row; break; }
  }
  if (!headerRow) throw new Error(`Không tìm thấy khu vực “${title}” trong file mẫu GPS`);

  let totalRow = null;
  for (let row = headerRow + 1; row <= sheet.rowCount; row += 1) {
    if (normalizeText(sheet.getCell(row, 1).value) === "TONG") { totalRow = row; break; }
  }
  if (!totalRow) throw new Error(`Không tìm thấy dòng Tổng của “${title}”`);
  return { headerRow, dataStart: headerRow + 3, totalRow };
}

function moveMerge(range, insertions) {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return range;
  let start = Number(match[2]);
  let end = Number(match[4]);
  insertions.forEach(({ at, count }) => {
    if (start >= at) { start += count; end += count; }
    else if (end >= at) end += count;
  });
  return `${match[1]}${start}:${match[3]}${end}`;
}

function prepareDynamicRows(sheet, results) {
  const originalMerges = [...sheet.model.merges];
  originalMerges.forEach(range => sheet.unMergeCells(range));
  const plans = results
    .map(group => ({ group, section: findSection(sheet, SECTION_TITLES[group.key]) }))
    .sort((a, b) => b.section.dataStart - a.section.dataStart);
  const insertions = [];

  plans.forEach(({ group, section }) => {
    const extra = Math.max(0, group.rows.length - 1);
    if (extra) {
      sheet.duplicateRow(section.dataStart, extra, true);
      insertions.push({ at: section.totalRow, count: extra });
    }
  });
  originalMerges.forEach(range => sheet.mergeCells(moveMerge(range, insertions)));
}

export async function buildGpsReportWorkbook(templateBuffer, { results, startDate, endDate, employees }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.getWorksheet("BCTH P.QLCL");
  if (!sheet) throw new Error("Không tìm thấy sheet BCTH P.QLCL trong file mẫu GPS");

  prepareDynamicRows(sheet, results);
  applyStandardReportHeader(sheet, startDate, endDate);
  sheet.getCell("A4").value = `Họ & Tên: ${employees.trim()}`;

  results.forEach(group => {
    const title = SECTION_TITLES[group.key];
    if (!title) return;
    const section = findSection(sheet, title);
    for (let row = section.dataStart; row < section.totalRow; row += 1) {
      for (let column = 1; column <= 6; column += 1) sheet.getCell(row, column).value = null;
    }
    group.rows.forEach((item, index) => {
      const row = section.dataStart + index;
      [item.stt, item.branch, item.total, item.processed, item.unprocessed, 0]
        .forEach((value, column) => { sheet.getCell(row, column + 1).value = value; });
    });
    sheet.getCell(section.totalRow, 1).value = "Tổng";
    for (let column = 3; column <= 6; column += 1) {
      const letter = sheet.getColumn(column).letter;
      sheet.getCell(section.totalRow, column).value = { formula: `SUM(${letter}${section.dataStart}:${letter}${section.totalRow - 1})` };
    }
  });

  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "portrait";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.printArea = `A1:F${sheet.rowCount}`;
  delete sheet.pageSetup.scale;

  return workbook;
}

export async function exportGpsReport({ results, startDate, endDate, employees }) {
  const response = await fetch("/templates/CITYBUS-BAO-CAO-GPS-BP-QLCL-DV.xlsx");
  if (!response.ok) throw new Error("Không tải được file mẫu báo cáo GPS");
  const workbook = await buildGpsReportWorkbook(await response.arrayBuffer(), { results, startDate, endDate, employees });
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = "CITYBUS - BÁO CÁO ĐỊNH VỊ BP.QLCL-DV.xlsx";
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}
