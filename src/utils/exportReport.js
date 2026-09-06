import ExcelJS from "exceljs";
import FileSaver from "file-saver";
import { normalizeText } from "./cameraProcessor.js";
import { applyStandardReportHeader } from "./reportHeader.js";

const { saveAs } = FileSaver;

const SECTION_TITLES = {
  BA: "1. BINH ANH",
  BA35: "2. BINH ANH 35 TUYEN",
  SOJI: "3. SOJI",
  TONGDA: "4. TONGDA",
};

export function findSection(sheet, title) {
  let headerRow = null;
  for (let row = 1; row <= sheet.rowCount; row += 1) {
    if (normalizeText(sheet.getCell(row, 1).value) === title) { headerRow = row; break; }
  }
  if (!headerRow) throw new Error(`Không tìm thấy khu vực “${title}” trong file mẫu mới`);
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

export function prepareDynamicRows(sheet, results) {
  const originalMerges = [...sheet.model.merges];
  originalMerges.forEach(range => sheet.unMergeCells(range));
  const plans = results.map(group => ({ group, section: findSection(sheet, SECTION_TITLES[group.key]) }))
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

export async function buildCameraReportWorkbook(templateBuffer, { results, startDate, endDate, employees }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.getWorksheet("BCTH P.QLCL");
  if (!sheet) throw new Error("Không tìm thấy sheet BCTH P.QLCL trong file mẫu mới");
  prepareDynamicRows(sheet, results);
  applyStandardReportHeader(sheet, startDate, endDate);
  sheet.getCell("A4").value = `Họ & Tên: ${employees.trim()}`;

  results.forEach(group => {
    const title = SECTION_TITLES[group.key];
    if (!title) return;
    const section = findSection(sheet, title);
    for (let row = section.dataStart; row < section.totalRow; row += 1) {
      for (let col = 1; col <= 6; col += 1) sheet.getCell(row, col).value = null;
    }
    group.rows.forEach((item, index) => {
      const row = section.dataStart + index;
      [item.stt, item.branch, item.total, item.fixed, item.unfixed, item.checked].forEach((value, col) => { sheet.getCell(row, col + 1).value = value; });
    });
    sheet.getCell(section.totalRow, 1).value = "Tổng";
    for (let col = 3; col <= 6; col += 1) {
      const letter = sheet.getColumn(col).letter;
      sheet.getCell(section.totalRow, col).value = { formula: `SUM(${letter}${section.dataStart}:${letter}${section.totalRow - 1})` };
    }
  });

  return workbook;
}

export async function exportCameraReport({ results, startDate, endDate, employees }) {
  const response = await fetch("/templates/CITYBUS-BAO-CAO-CAMERA-BP-QLCL-DV.xlsx");
  if (!response.ok) throw new Error("Không tải được file mẫu báo cáo");
  const workbook = await buildCameraReportWorkbook(await response.arrayBuffer(), { results, startDate, endDate, employees });
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "CITYBUS - BÁO CÁO CAMERA BP.QLCL-DV.xlsx");
}
