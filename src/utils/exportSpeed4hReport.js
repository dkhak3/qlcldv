import ExcelJS from "exceljs";
import FileSaver from "file-saver";
import { formatDateVi, normalizeText } from "./cameraProcessor.js";

const { saveAs } = FileSaver;
const TEMPLATE_URL = "/templates/CITYBUS-BAO-CAO-TOC-DO-4H-BP-QLCL-DV.xlsx";
const FILE_NAME = "CITYBUS - BÁO CÁO TỐC ĐỘ 4H BP.QLCL-DV.xlsx";
const SECTION_TITLES = {
  speed: "1. CONG VIEC GOI TOC DO",
  fourHour: "2. CONG VIEC GOI 4H",
};

function findSection(sheet, title) {
  let headerRow = null;
  for (let row = 1; row <= sheet.rowCount; row += 1) {
    if (normalizeText(sheet.getCell(row, 1).value) === title) {
      headerRow = row;
      break;
    }
  }
  if (!headerRow) throw new Error(`Không tìm thấy khu vực “${title}” trong file mẫu Tốc độ, 4H`);

  let totalRow = null;
  for (let row = headerRow + 1; row <= sheet.rowCount; row += 1) {
    if (normalizeText(sheet.getCell(row, 1).value) === "TONG") {
      totalRow = row;
      break;
    }
  }
  if (!totalRow) throw new Error(`Không tìm thấy dòng Tổng của “${title}”`);
  return { headerRow, dataStart: headerRow + 3, totalRow, capacity: totalRow - (headerRow + 3) };
}

function moveMerge(range, insertions) {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return range;
  let start = Number(match[2]);
  let end = Number(match[4]);
  insertions.forEach(({ at, count }) => {
    if (start >= at) {
      start += count;
      end += count;
    } else if (end >= at) end += count;
  });
  return `${match[1]}${start}:${match[3]}${end}`;
}

function prepareDynamicRows(sheet, results) {
  const originalMerges = [...sheet.model.merges];
  originalMerges.forEach(range => sheet.unMergeCells(range));
  const plans = Object.entries(SECTION_TITLES)
    .map(([key, title]) => ({ key, rows: results[key], section: findSection(sheet, title) }))
    .sort((a, b) => b.section.dataStart - a.section.dataStart);
  const insertions = [];

  plans.forEach(({ rows, section }) => {
    const extra = Math.max(0, rows.length - section.capacity);
    if (extra) {
      sheet.duplicateRow(section.dataStart, extra, true);
      insertions.push({ at: section.totalRow, count: extra });
    }
  });
  originalMerges.forEach(range => sheet.mergeCells(moveMerge(range, insertions)));
}

function fillSection(sheet, title, rows) {
  const section = findSection(sheet, title);
  for (let row = section.dataStart; row < section.totalRow; row += 1) {
    for (let column = 1; column <= 9; column += 1) sheet.getCell(row, column).value = null;
  }

  rows.forEach((item, index) => {
    const row = section.dataStart + index;
    [
      item.stt,
      item.partner,
      item.branch,
      item.route,
      item.vehicle,
      item.employeeName,
      item.violationCount,
      item.noAnswerEmployee || null,
      item.noAnswerCount || null,
    ].forEach((value, column) => { sheet.getCell(row, column + 1).value = value; });
    sheet.getCell(row, 5).numFmt = "@";
  });

  sheet.getCell(section.totalRow, 1).value = "Tổng";
  for (let column = 7; column <= 9; column += 1) {
    const letter = sheet.getColumn(column).letter;
    sheet.getCell(section.totalRow, column).value = {
      formula: `SUM(${letter}${section.dataStart}:${letter}${section.totalRow - 1})`,
    };
  }
}

export async function buildSpeed4hReportWorkbook(templateBuffer, { results, startDate, endDate, employees }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.getWorksheet("BCTH P.QLCL");
  if (!sheet) throw new Error("Không tìm thấy sheet BCTH P.QLCL trong file mẫu Tốc độ, 4H");

  prepareDynamicRows(sheet, results);
  sheet.getCell("A1").value = `BÁO CÁO CÔNG VIỆC BỘ PHẬN QUẢN LÝ CLDV CITYBUS\n(Từ ngày ${formatDateVi(startDate)} đến ngày ${formatDateVi(endDate)})`;
  sheet.getCell("A4").value = `Họ & tên: ${employees.trim()}`;
  fillSection(sheet, SECTION_TITLES.speed, results.speed);
  fillSection(sheet, SECTION_TITLES.fourHour, results.fourHour);

  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "landscape";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.printArea = `A1:I${sheet.rowCount}`;
  delete sheet.pageSetup.scale;
  return workbook;
}

export async function exportSpeed4hReport(form) {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) throw new Error("Không tải được file mẫu báo cáo Tốc độ, 4H");
  const workbook = await buildSpeed4hReportWorkbook(await response.arrayBuffer(), form);
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), FILE_NAME);
}

export const __test__ = { findSection, prepareDynamicRows };
