import test from "node:test";
import assert from "node:assert/strict";
import {
  applyRouteFillToSelection,
  countRouteSelectionCells,
  deleteRouteColumn,
  deleteRouteRow,
  findRouteMatches,
  getReadableTextColor,
  getRouteCellFill,
  insertRouteColumn,
  insertRouteRow,
  routeColumnName,
  routeSelectionToText,
  routeSheetPayload,
  updateRouteCell,
} from "../src/utils/routeSheet.js";
import thongTinLienHe from "../src/data/routeSheets/thong-tin-lien-he.js";
import tuyenHcm from "../src/data/routeSheets/tuyen-hcm.js";
import tuyenChiNhanh from "../src/data/routeSheets/tuyen-chi-nhanh.js";
import gsAtgtMienTay from "../src/data/routeSheets/gs-atgt-mien-tay.js";
import gsAtgtMienTrung from "../src/data/routeSheets/gs-atgt-mien-trung.js";
import tuyen3517 from "../src/data/routeSheets/35-tuyen-moi-17-tuyen-cu.js";
import tuyen84 from "../src/data/routeSheets/84-tuyen.js";
import congThucChiaSe from "../src/data/routeSheets/cong-thuc-chia-se.js";
import { routeColumnMetrics, routeRowKind } from "../src/utils/routeSheetPresentation.js";
import { buildRouteWorkbook } from "../src/utils/routeWorkbook.js";

const seedSheets = [
  thongTinLienHe,
  tuyenHcm,
  tuyenChiNhanh,
  gsAtgtMienTay,
  gsAtgtMienTrung,
  tuyen3517,
  tuyen84,
  congThucChiaSe,
];

test("Tuyến có đủ 8 sheet từ file Excel", () => {
  assert.equal(seedSheets.length, 8);
  assert.deepEqual(seedSheets.map(sheet => sheet.name), [
    "Thông tin Liên hệ",
    "TUYẾN HCM",
    "TUYẾN CHI NHÁNH",
    "GS ATGT MIỀN TÂY",
    "GS ATGT MIỀN TRUNG",
    "35 TUYẾN MỚI + 17 TUYẾN CŨ",
    "84 TUYẾN",
    "CÔNG THỨC CHIA SẺ",
  ]);
});

test("sheet GS ATGT đã được materialize thành giá trị, không còn #NAME?", () => {
  for (const sheet of [gsAtgtMienTay, gsAtgtMienTrung]) {
    const text = JSON.stringify(sheet.rows);
    assert.equal(text.includes("#NAME?"), false);
  }
  assert.match(JSON.stringify(gsAtgtMienTay.rows), /AN GIANG/);
  assert.match(JSON.stringify(gsAtgtMienTrung.rows), /ĐÀ LẠT/);
});

test("copy theo hàng dọc giữ nguyên ô trống để paste không lệch", () => {
  const sheet = {
    columnCount: 2,
    rows: [
      ["A1", "B1"],
      ["A2", ""],
      ["A3", "B3"],
      ["A4", ""],
    ],
  };
  const selection = {
    anchor: { row: 0, col: 1 },
    focus: { row: 3, col: 1 },
  };
  assert.equal(routeSelectionToText(sheet, selection), "B1\r\n\r\nB3\r\n");
  assert.equal(countRouteSelectionCells(selection), 4);
});

test("copy một vùng giống Excel dùng tab theo cột và xuống dòng theo hàng", () => {
  const sheet = {
    columnCount: 3,
    rows: [
      ["A1", "B1", "C1"],
      ["A2", "B2", "C2"],
    ],
  };
  assert.equal(routeSelectionToText(sheet, {
    anchor: { row: 0, col: 0 },
    focus: { row: 1, col: 1 },
  }), "A1\tB1\r\nA2\tB2");
});

test("tên cột Excel hỗ trợ A đến AA", () => {
  assert.equal(routeColumnName(0), "A");
  assert.equal(routeColumnName(25), "Z");
  assert.equal(routeColumnName(26), "AA");
  assert.equal(routeColumnName(27), "AB");
});

test("Admin có thể sửa ô, thêm/xóa hàng và cột bằng utility bất biến", () => {
  const original = {
    id: "demo",
    name: "DEMO",
    columnCount: 2,
    rows: [["A1", "B1"], ["A2", "B2"]],
  };

  const edited = updateRouteCell(original, 1, 0, "A2 mới");
  assert.equal(edited.rows[1].cells[0], "A2 mới");
  assert.equal(original.rows[1][0], "A2");

  const withRow = insertRouteRow(edited, 0);
  assert.equal(withRow.rows.length, 3);
  assert.deepEqual(withRow.rows[1].cells, ["", ""]);

  const withoutRow = deleteRouteRow(withRow, 1);
  assert.equal(withoutRow.rows.length, 2);

  const withColumn = insertRouteColumn(withoutRow, 0);
  assert.equal(withColumn.columnCount, 3);
  assert.equal(withColumn.rows[0].cells[1], "");

  const withoutColumn = deleteRouteColumn(withColumn, 1);
  assert.equal(withoutColumn.columnCount, 2);
});

test("tìm kiếm Tuyến trả đúng vị trí ô", () => {
  const matches = findRouteMatches(tuyenChiNhanh, "Cao Lãnh");
  assert.ok(matches.length >= 1);
  const first = matches[0];
  assert.ok(first.row >= 0);
  assert.ok(first.col >= 0);
});


test("giao diện Tuyến nhận diện header và thu gọn cột trống", () => {
  assert.equal(routeRowKind(tuyenChiNhanh, 0), "header");
  assert.equal(routeRowKind(tuyenHcm, 0), "header");

  const compactSheet = {
    columnCount: 4,
    rows: [
      ["STT", "TÊN TUYẾN", "", "COPY - PASTE VÔ BA GPS"],
      [1, "Tuyến A", "", "Nội dung A"],
      [2, "Tuyến B", "", "Nội dung B"],
    ],
  };
  assert.equal(routeColumnMetrics(compactSheet, 2).empty, true);
  assert.equal(routeColumnMetrics(compactSheet, 2).widthPx, 26);
  assert.ok(routeColumnMetrics(compactSheet, 1).widthPx > 26);
});

test("xuất Excel Tuyến giữ đủ sheet, style header và hyperlink", async () => {
  const workbook = await buildRouteWorkbook([
    {
      id: "demo",
      name: "TUYẾN DEMO",
      columnCount: 3,
      rows: [
        ["STT", "TÊN TUYẾN", "LINK"],
        [1, "Tuyến A", "https://example.com"],
      ],
    },
    {
      id: "demo-2",
      name: "THÔNG TIN",
      columnCount: 2,
      rows: [["TÊN", "GIÁ TRỊ"], ["A", "B"]],
    },
  ]);

  assert.equal(workbook.worksheets.length, 2);
  const sheet = workbook.getWorksheet("TUYẾN DEMO");
  assert.ok(sheet);
  assert.equal(sheet.getCell("A1").font.bold, true);
  assert.equal(sheet.getCell("A1").alignment.horizontal, "center");
  assert.equal(sheet.getCell("C2").value.hyperlink, "https://example.com");
  assert.ok(sheet.getColumn(2).width > sheet.getColumn(1).width);

  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.byteLength > 1000);
});


test("Admin có thể tô màu cả vùng và xóa màu", () => {
  const sheet = {
    id: "colors",
    name: "COLORS",
    columnCount: 3,
    rows: [["A1", "B1", "C1"], ["A2", "B2", "C2"]],
  };
  const selection = {
    anchor: { row: 0, col: 1 },
    focus: { row: 1, col: 2 },
  };

  const colored = applyRouteFillToSelection(sheet, selection, "#fef3c7");
  assert.equal(getRouteCellFill(colored, 0, 1), "#FEF3C7");
  assert.equal(getRouteCellFill(colored, 0, 2), "#FEF3C7");
  assert.equal(getRouteCellFill(colored, 1, 1), "#FEF3C7");
  assert.equal(getRouteCellFill(colored, 1, 2), "#FEF3C7");
  assert.equal(getRouteCellFill(colored, 0, 0), "");

  const cleared = applyRouteFillToSelection(colored, selection, "");
  assert.equal(Object.keys(cleared.cellStyles).length, 0);
});

test("màu ô dịch theo dữ liệu khi thêm/xóa hàng và cột", () => {
  const source = applyRouteFillToSelection({
    id: "shift",
    name: "SHIFT",
    columnCount: 3,
    rows: [["A1", "B1", "C1"], ["A2", "B2", "C2"], ["A3", "B3", "C3"]],
  }, {
    anchor: { row: 1, col: 1 },
    focus: { row: 1, col: 1 },
  }, "#DBEAFE");

  const withRow = insertRouteRow(source, 0);
  assert.equal(getRouteCellFill(withRow, 2, 1), "#DBEAFE");
  assert.equal(getRouteCellFill(withRow, 1, 1), "");

  const withoutRow = deleteRouteRow(withRow, 0);
  assert.equal(getRouteCellFill(withoutRow, 1, 1), "#DBEAFE");

  const withColumn = insertRouteColumn(withoutRow, 0);
  assert.equal(getRouteCellFill(withColumn, 1, 2), "#DBEAFE");

  const withoutColumn = deleteRouteColumn(withColumn, 0);
  assert.equal(getRouteCellFill(withoutColumn, 1, 1), "#DBEAFE");
});

test("payload Firestore chỉ lưu sparse style của các ô được tô", () => {
  const sheet = applyRouteFillToSelection({
    id: "payload",
    name: "PAYLOAD",
    columnCount: 2,
    rows: [["A", "B"], ["C", "D"]],
  }, {
    anchor: { row: 1, col: 0 },
    focus: { row: 1, col: 0 },
  }, "#FEE2E2");

  const payload = routeSheetPayload(sheet);
  assert.deepEqual(payload.cellStyles, {
    "1:0": { fill: "#FEE2E2" },
  });
  assert.equal(Object.keys(payload.cellStyles).length, 1);
});

test("màu chữ tự tương phản theo màu nền", () => {
  assert.equal(getReadableTextColor("#FEF3C7"), "#0F172A");
  assert.equal(getReadableTextColor("#0F766E"), "#FFFFFF");
});

test("Excel Tuyến giữ màu ô tùy chỉnh", async () => {
  const colored = applyRouteFillToSelection({
    id: "excel-color",
    name: "EXCEL COLOR",
    columnCount: 2,
    rows: [["STT", "TÊN TUYẾN"], [1, "Tuyến A"]],
  }, {
    anchor: { row: 1, col: 1 },
    focus: { row: 1, col: 1 },
  }, "#F3E8FF");

  const workbook = await buildRouteWorkbook([colored]);
  const sheet = workbook.getWorksheet("EXCEL COLOR");
  assert.equal(sheet.getCell("B2").fill.fgColor.argb, "FFF3E8FF");
  assert.equal(sheet.getCell("B2").font.color.argb, "FF0F172A");
});
