import test from "node:test";
import assert from "node:assert/strict";
import {
  countRouteSelectionCells,
  deleteRouteColumn,
  deleteRouteRow,
  findRouteMatches,
  insertRouteColumn,
  insertRouteRow,
  routeColumnName,
  routeSelectionToText,
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
