import FileSaver from "file-saver";
import JSZip from "jszip";
import { formatDateVi } from "./cameraProcessor.js";

const { saveAs } = FileSaver;
const TEMPLATE_URL = "/templates/CITYBUS-BAO-CAO-ATGT-BP-QLCL-DV.xlsx";
const SUMMARY_SHEET_PATH = "xl/worksheets/sheet1.xml";
const DETAIL_SHEET_PATH = "xl/worksheets/sheet2.xml";
const REPORT_TITLE = "BÁO CÁO CÔNG VIỆC BỘ PHẬN QUẢN LÝ CLDV CITYBUS";
// File mẫu trắng có một dòng dữ liệu mẫu ở hàng 7, dòng Tổng ở hàng 8
// và phần Khó khăn/đề xuất bắt đầu từ hàng 9.
const SUMMARY_TEMPLATE_ROWS = 1;
const SUMMARY_DATA_START_ROW = 7;
const SUMMARY_TOTAL_ROW = 8;
const SUMMARY_FOOTER_START_ROW = 9;
const SUMMARY_TEMPLATE_LAST_ROW = 17;

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function reportHeaderXml(startDate, endDate) {
  const period = `(Từ ngày ${formatDateVi(startDate)} đến ngày ${formatDateVi(endDate)})`;
  return `<is><r><rPr><rFont val="Times New Roman"/><sz val="16"/><b/></rPr><t>${escapeXml(REPORT_TITLE)}</t></r><r><rPr><rFont val="Times New Roman"/><sz val="13"/><b/><i/></rPr><t xml:space="preserve">&#10;${escapeXml(period)}</t></r></is>`;
}

function rowNumberOf(rowXml) {
  return Number(rowXml.match(/<row\b[^>]*\br="(\d+)"/)?.[1] || 0);
}

function extractRows(sheetXml) {
  const sheetData =
    sheetXml.match(/<sheetData>([\s\S]*?)<\/sheetData>/)?.[1] || "";
  return [...sheetData.matchAll(/<row\b[^>]*>[\s\S]*?<\/row>/g)].map(
    (match) => match[0],
  );
}

function getRow(rows, number) {
  const row = rows.find((item) => rowNumberOf(item) === number);
  if (!row) throw new Error(`File mẫu thiếu dòng ${number}`);
  return row;
}

function cellXml(address, attributes, value) {
  const cleanAttributes = attributes
    .replace(/\s+r="[^"]*"/, "")
    .replace(/\s+t="[^"]*"/, "")
    .replace(/\s*\/\s*$/, "");
  const prefix = `<c r="${address}"${cleanAttributes}>`;
  if (value == null || value === "")
    return `<c r="${address}"${cleanAttributes}/>`;
  if (value?.kind === "rich")
    return `<c r="${address}"${cleanAttributes} t="inlineStr">${value.xml}</c>`;
  if (value?.kind === "formula")
    return `${prefix}<f>${escapeXml(value.formula)}</f><v>${Number(value.result) || 0}</v></c>`;
  if (typeof value === "number" && Number.isFinite(value))
    return `${prefix}<v>${value}</v></c>`;
  return `<c r="${address}"${cleanAttributes} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function rewriteRow(rowXml, newRowNumber, values = {}) {
  const opening = rowXml.match(/<row\b[^>]*>/)?.[0];
  if (!opening) throw new Error("Dòng trong file mẫu không hợp lệ");
  const rowAttributes = opening.slice(4, -1).replace(/\s+r="\d+"/, "");
  const cells = [...rowXml.matchAll(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g)]
    .map((match) => {
      const fullCell = match[0];
      const openingCell = fullCell.match(/<c\b([^>]*)/)?.[1] || "";
      const column = openingCell.match(/\br="([A-Z]+)\d+"/)?.[1];
      if (!column) return "";
      const address = `${column}${newRowNumber}`;
      return cellXml(
        address,
        openingCell,
        Object.prototype.hasOwnProperty.call(values, column)
          ? values[column]
          : null,
      );
    })
    .join("");
  return `<row r="${newRowNumber}"${rowAttributes}>${cells}</row>`;
}

function shiftExistingRow(rowXml, newRowNumber) {
  const oldRowNumber = rowNumberOf(rowXml);
  return rowXml
    .replace(
      new RegExp(`(<row\\b[^>]*\\br=")${oldRowNumber}("[^>]*>)`),
      `$1${newRowNumber}$2`,
    )
    .replace(
      new RegExp(`(\\br="[A-Z]+)${oldRowNumber}(?=")`, "g"),
      `$1${newRowNumber}`,
    );
}

function replaceSheetRows(sheetXml, rows) {
  return sheetXml.replace(
    /<sheetData>[\s\S]*?<\/sheetData>/,
    `<sheetData>${rows.join("")}</sheetData>`,
  );
}

function replaceDimension(sheetXml, reference) {
  return sheetXml.replace(
    /<dimension\b[^>]*\bref="[^"]*"\s*\/>/,
    `<dimension ref="${reference}"/>`,
  );
}

function shiftMergeReference(reference, fromRow, delta) {
  if (!delta) return reference;
  return reference.replace(/([A-Z]+)(\d+)/g, (match, column, rowText) => {
    const row = Number(rowText);
    return `${column}${row >= fromRow ? row + delta : row}`;
  });
}

function shiftMerges(sheetXml, fromRow, delta) {
  if (!delta) return sheetXml;
  return sheetXml.replace(
    /(<mergeCell\b[^>]*\bref=")([^"]+)("\s*\/>)/g,
    (match, before, reference, after) =>
      `${before}${shiftMergeReference(reference, fromRow, delta)}${after}`,
  );
}

function excelDateSerial(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value || "";
  return (
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) /
      86400000 +
    25569
  );
}

function summaryValues(item, index, rowNumber) {
  return {
    A: index + 1,
    B: item.branch || "",
    C: item.route || "",
    D: {
      kind: "formula",
      formula: `SUM(E${rowNumber}:G${rowNumber})`,
      result: Number(item.total) || 0,
    },
    E: Number(item.finance) || 0,
    F: Number(item.atgt) || 0,
    G: Number(item.cldv) || 0,
  };
}

function patchSummarySheet(sheetXml, summary, startDate, endDate) {
  const rows = extractRows(sheetXml);
  const dataCount = Math.max(SUMMARY_TEMPLATE_ROWS, summary.length);
  const delta = dataCount - SUMMARY_TEMPLATE_ROWS;
  const headerRows = rows.filter((row) => rowNumberOf(row) <= 6);
  headerRows[0] = rewriteRow(headerRows[0], 1, {
    A: { kind: "rich", xml: reportHeaderXml(startDate, endDate) },
  });

  const templateDataRow = getRow(rows, SUMMARY_DATA_START_ROW);
  const dataRows = Array.from({ length: dataCount }, (_, index) => {
    const rowNumber = SUMMARY_DATA_START_ROW + index;
    return rewriteRow(
      templateDataRow,
      rowNumber,
      summary[index] ? summaryValues(summary[index], index, rowNumber) : {},
    );
  });

  const totalRowNumber = SUMMARY_TOTAL_ROW + delta;
  const totalRow = rewriteRow(getRow(rows, SUMMARY_TOTAL_ROW), totalRowNumber, {
    A: "Tổng",
    D: {
      kind: "formula",
      formula: `SUM(D${SUMMARY_DATA_START_ROW}:D${totalRowNumber - 1})`,
      result: summary.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    },
    E: {
      kind: "formula",
      formula: `SUM(E${SUMMARY_DATA_START_ROW}:E${totalRowNumber - 1})`,
      result: summary.reduce(
        (sum, item) => sum + (Number(item.finance) || 0),
        0,
      ),
    },
    F: {
      kind: "formula",
      formula: `SUM(F${SUMMARY_DATA_START_ROW}:F${totalRowNumber - 1})`,
      result: summary.reduce((sum, item) => sum + (Number(item.atgt) || 0), 0),
    },
    G: {
      kind: "formula",
      formula: `SUM(G${SUMMARY_DATA_START_ROW}:G${totalRowNumber - 1})`,
      result: summary.reduce((sum, item) => sum + (Number(item.cldv) || 0), 0),
    },
  });
  const footerRows = rows
    .filter((row) => rowNumberOf(row) >= SUMMARY_FOOTER_START_ROW)
    .map((row) => shiftExistingRow(row, rowNumberOf(row) + delta));

  let output = replaceSheetRows(sheetXml, [
    ...headerRows,
    ...dataRows,
    totalRow,
    ...footerRows,
  ]);
  output = replaceDimension(output, `A1:G${SUMMARY_TEMPLATE_LAST_ROW + delta}`);
  return shiftMerges(output, SUMMARY_TOTAL_ROW, delta);
}

function detailValues(item, index, rowNumber) {
  return {
    A: index + 1,
    B: item.branch || "",
    C: item.route || "",
    D: item.vehicle || "",
    E: item.departureTime ?? "",
    F: item.arrivalTime ?? "",
    G: excelDateSerial(item.date),
    H: item.driver || "",
    I: item.assistant || "",
    J: item.serviceQuality || "",
    K: item.roadSafety || "",
    L: item.actualPassengers ?? "",
    M: item.actualLuggage ?? "",
    N: item.actualFreeTickets ?? "",
    O: item.reportedPassengers ?? "",
    P: item.reportedLuggage ?? "",
    Q: item.reportedFreeTickets ?? "",
    R: { kind: "formula", formula: `O${rowNumber}-L${rowNumber}`, result: 0 },
    S: { kind: "formula", formula: `P${rowNumber}-M${rowNumber}`, result: 0 },
    T: { kind: "formula", formula: `Q${rowNumber}-N${rowNumber}`, result: 0 },
    U: item.note || "",
  };
}

function patchDetailSheet(sheetXml, detailRows, employees, startDate, endDate) {
  const rows = extractRows(sheetXml);
  const dataCount = detailRows.length;
  const headerRows = rows.filter((row) => rowNumberOf(row) <= 7);
  headerRows[0] = rewriteRow(getRow(rows, 1), 1, {
    F: { kind: "rich", xml: reportHeaderXml(startDate, endDate) },
    R: "Mã hiệu: FCB/QLCL/QT02/M01\nLần ban hành: 02\nNgày hiệu lực: 15/05/2025",
  });
  headerRows[1] = rewriteRow(headerRows[1], 2, {
    A: `Họ & tên nhân viên kiểm tra: ${String(employees || "").trim()}`,
    I: "Phòng Quản lý Chất Lượng - Futa CityBus",
  });
  const templateDataRow = getRow(rows, 8);
  const dataRows = Array.from({ length: dataCount }, (_, index) => {
    const rowNumber = 8 + index;
    return rewriteRow(
      templateDataRow,
      rowNumber,
      detailRows[index]
        ? detailValues(detailRows[index], index, rowNumber)
        : {},
    );
  });
  const output = replaceSheetRows(sheetXml, [...headerRows, ...dataRows]);
  return replaceDimension(output, `A1:U${7 + dataCount}`);
}

async function removeCalculationChain(zip) {
  zip.remove("xl/calcChain.xml");
  const contentTypesFile = zip.file("[Content_Types].xml");
  if (contentTypesFile) {
    const contentTypes = await contentTypesFile.async("string");
    zip.file(
      "[Content_Types].xml",
      contentTypes.replace(
        /<Override\b[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/g,
        "",
      ),
    );
  }
  const relationsFile = zip.file("xl/_rels/workbook.xml.rels");
  if (relationsFile) {
    const relations = await relationsFile.async("string");
    zip.file(
      "xl/_rels/workbook.xml.rels",
      relations.replace(
        /<Relationship\b[^>]*Type="[^"]*\/calcChain"[^>]*\/>/g,
        "",
      ),
    );
  }
  const workbookFile = zip.file("xl/workbook.xml");
  if (workbookFile) {
    const workbookXml = await workbookFile.async("string");
    zip.file(
      "xl/workbook.xml",
      workbookXml.replace(
        /<calcPr\b[^>]*\/>/,
        '<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>',
      ),
    );
  }
}

export async function buildAtgtReportFile(
  templateBuffer,
  { results, startDate, endDate, employees },
) {
  const zip = await JSZip.loadAsync(templateBuffer);
  const summaryFile = zip.file(SUMMARY_SHEET_PATH);
  const detailFile = zip.file(DETAIL_SHEET_PATH);
  if (!summaryFile || !detailFile)
    throw new Error("File mẫu phải có đủ hai sheet BCTH.HKVP và BCCT.HKVP");

  const [summaryXml, detailXml] = await Promise.all([
    summaryFile.async("string"),
    detailFile.async("string"),
  ]);
  zip.file(
    SUMMARY_SHEET_PATH,
    patchSummarySheet(summaryXml, results?.summary || [], startDate, endDate),
  );
  zip.file(
    DETAIL_SHEET_PATH,
    patchDetailSheet(
      detailXml,
      results?.reportDetailRows || results?.detailRows || [],
      employees,
      startDate,
      endDate,
    ),
  );
  await removeCalculationChain(zip);
  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export async function exportAtgtReport({
  results,
  startDate,
  endDate,
  employees,
}) {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) throw new Error("Không tải được file mẫu báo cáo ATGT");
  const fileBytes = await buildAtgtReportFile(await response.arrayBuffer(), {
    results,
    startDate,
    endDate,
    employees,
  });
  saveAs(
    new Blob([fileBytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "CITYBUS - BÁO CÁO ATGT BP.QLCL-DV.xlsx",
  );
}

export const __test__ = {
  patchSummarySheet,
  patchDetailSheet,
  rewriteRow,
  shiftExistingRow,
  shiftMergeReference,
};
