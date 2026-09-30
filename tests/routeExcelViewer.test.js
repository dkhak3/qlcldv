import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  getPreviewMergeAt,
  isPreviewMergeMaster,
  parseRouteWorkbook,
  previewSelectionCount,
  previewSelectionToHtml,
  previewSelectionToText,
  routePreviewColumnName,
} from "../src/utils/routeExcelPreview.js";
import {
  base64ToBytes,
  bytesToBase64,
  joinBase64Chunks,
  routeWorkbookChunkId,
  sha256Hex,
  splitBase64,
} from "../src/utils/routeWorkbookStorage.js";

async function makeWorkbookBuffer() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("TUYẾN HCM");
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 26;
  sheet.getRow(1).height = 30;
  sheet.mergeCells("A1:B1");

  const title = sheet.getCell("A1");
  title.value = "TIÊU ĐỀ TUYẾN";
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE699" } };
  title.font = { bold: true, color: { argb: "FF9C0006" }, size: 12 };
  title.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  title.border = {
    top: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
  };

  sheet.getCell("A2").value = "Tuyến 01";
  sheet.getCell("B2").value = { text: "Mở tài liệu", hyperlink: "https://example.com" };
  sheet.getCell("A3").value = { formula: "1+1", result: 2 };

  const second = workbook.addWorksheet("THÔNG TIN");
  second.getCell("A1").value = "Liên hệ";

  return workbook.xlsx.writeBuffer();
}

test("Excel Viewer đọc được sheet, merge, style, kích thước và hyperlink", async () => {
  const buffer = await makeWorkbookBuffer();
  const preview = await parseRouteWorkbook(buffer);

  assert.deepEqual(preview.sheetNames, ["TUYẾN HCM", "THÔNG TIN"]);
  assert.equal(preview.sheets.length, 2);

  const sheet = preview.sheets[0];
  assert.equal(sheet.name, "TUYẾN HCM");
  assert.equal(sheet.rows[0][0].text, "TIÊU ĐỀ TUYẾN");
  assert.equal(sheet.rows[0][1].text, "");
  assert.equal(sheet.rows[1][1].hyperlink, "https://example.com");
  assert.equal(sheet.rows[2][0].text, "2");

  assert.equal(sheet.merges.length, 1);
  assert.deepEqual(sheet.merges[0], {
    rowStart: 0,
    rowEnd: 0,
    colStart: 0,
    colEnd: 1,
  });
  assert.equal(isPreviewMergeMaster(getPreviewMergeAt(sheet, 0, 1), 0, 0), true);

  assert.equal(sheet.rows[0][0].css.backgroundColor, "#FFE699");
  assert.equal(sheet.rows[0][0].css.color, "#9C0006");
  assert.equal(sheet.rows[0][0].css.fontWeight, 700);
  assert.equal(sheet.rows[0][0].css.textAlign, "center");
  assert.ok(sheet.columnWidths[1] > sheet.columnWidths[0]);
  assert.ok(sheet.rowHeights[0] >= 39);
});

test("Excel Viewer copy vùng chọn giữ hàng/cột và merge", async () => {
  const preview = await parseRouteWorkbook(await makeWorkbookBuffer());
  const sheet = preview.sheets[0];
  const selection = {
    anchor: { row: 0, col: 0 },
    focus: { row: 1, col: 1 },
  };

  assert.equal(previewSelectionCount(selection), 4);
  assert.equal(
    previewSelectionToText(sheet, selection),
    "TIÊU ĐỀ TUYẾN\t\r\nTuyến 01\tMở tài liệu",
  );

  const html = previewSelectionToHtml(sheet, selection);
  assert.match(html, /colspan="2"/);
  assert.match(html, /TIÊU ĐỀ TUYẾN/);
  assert.match(html, /background-color:#FFE699/);
});

test("tên cột Excel Viewer hỗ trợ sau Z", () => {
  assert.equal(routePreviewColumnName(0), "A");
  assert.equal(routePreviewColumnName(25), "Z");
  assert.equal(routePreviewColumnName(26), "AA");
  assert.equal(routePreviewColumnName(51), "AZ");
});

test("chunk file Excel ghép lại đúng từng byte", async () => {
  const original = Uint8Array.from({ length: 750123 }, (_, index) => (index * 31) % 256);
  const base64 = bytesToBase64(original);
  const rawChunks = splitBase64(base64, 120000);
  assert.ok(rawChunks.length > 2);

  const shuffled = rawChunks
    .map((content, index) => ({ index, content }))
    .reverse();
  const restored = base64ToBytes(joinBase64Chunks(shuffled));

  assert.equal(restored.byteLength, original.byteLength);
  assert.deepEqual(restored, original);
  assert.equal(routeWorkbookChunkId("abc", 7), "abc_0007");

  const [beforeHash, afterHash] = await Promise.all([
    sha256Hex(original.buffer),
    sha256Hex(restored.buffer),
  ]);
  assert.equal(afterHash, beforeHash);
  assert.equal(beforeHash.length, 64);
});
