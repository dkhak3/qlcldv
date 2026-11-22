import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { __test__ } from "../src/utils/hauKiemProcessor.js";

function createM02Sheet(headers, values) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("M02_BÁO CÁO KẾT QUẢ GS OL-HK");
  sheet.addRow(headers);
  sheet.addRow(values);
  return sheet;
}

const alternateLayoutHeaders = [
  "STT", "CHI NHÁNH", "TUYẾN", "NGÀY", "SỐ XE", "GIỜ ĐI", "GIỜ VỀ",
  "LÁI XE", "TIẾP VIÊN", "CHẤT LƯỢNG DỊCH VỤ", "AN TOÀN GIAO THÔNG",
  "SỐ KHÁCH THỰC TẾ", "HÀNH LÝ THỰC TẾ", "VÉ MIỄN PHÍ THỰC TẾ",
  "SỐ KHÁCH BÁO CÁO", "HÀNH LÝ BÁO CÁO", "VÉ MIỄN PHÍ BÁO CÁO",
  "CHÊNH LỆCH KHÁCH", "CHÊNH LỆCH HÀNH LÝ", "CHÊNH LỆCH VÉ", "GHI CHÚ",
];

const standardLayoutHeaders = [
  "STT", "CHI NHÁNH", "TUYẾN", "SỐ XE", "GIỜ ĐI", "GIỜ VỀ", "NGÀY",
  "LÁI XE", "TIẾP VIÊN", "CHẤT LƯỢNG DỊCH VỤ", "AN TOÀN GIAO THÔNG",
  "SỐ KHÁCH THỰC TẾ", "HÀNH LÝ THỰC TẾ", "VÉ MIỄN PHÍ THỰC TẾ",
  "SỐ KHÁCH BÁO CÁO", "HÀNH LÝ BÁO CÁO", "VÉ MIỄN PHÍ BÁO CÁO",
  "CHÊNH LỆCH KHÁCH", "CHÊNH LỆCH HÀNH LÝ", "CHÊNH LỆCH VÉ", "GHI CHÚ",
];

test("Hậu kiểm lấy NGÀY từ cột D theo tiêu đề M02, không lấy ngày từ tên file", () => {
  const sheet = createM02Sheet(alternateLayoutHeaders, [
    1, "BẠC LIÊU", "Tuyến 01", "01/09/2026", "94B-12345", "07:00", "09:00",
    "Nguyễn Văn A", "Trần Văn B", "OK", "OK", 30, 2, 1, 30, 2, 1, 0, 0, 0, "Ghi chú gốc",
  ]);

  const [row] = __test__.parseM02(sheet, "2026-09-02");

  assert.equal(row.date, "2026-09-01");
  assert.equal(row.vehicle, "94B-12345");
  assert.equal(row.branch, "BẠC LIÊU");
  assert.equal(row.note, "Ghi chú gốc");
});

test("Hậu kiểm vẫn đọc NGÀY từ cột G ở biểu mẫu M02 cũ", () => {
  const sheet = createM02Sheet(standardLayoutHeaders, [
    1, "BẠC LIÊU", "Tuyến 01", "94B-12345", "07:00", "09:00", "03/09/2026",
    "Nguyễn Văn A", "Trần Văn B", "OK", "OK", 30, 2, 1, 30, 2, 1, 0, 0, 0, "Ghi chú gốc",
  ]);

  const [row] = __test__.parseM02(sheet, "2026-09-02");

  assert.equal(row.date, "2026-09-03");
  assert.equal(row.vehicle, "94B-12345");
});

test("Hậu kiểm không tự điền ngày từ tên file khi ô NGÀY trong M02 trống", () => {
  const sheet = createM02Sheet(alternateLayoutHeaders, [
    1, "BẠC LIÊU", "Tuyến 01", "", "94B-12345", "07:00", "09:00",
    "Nguyễn Văn A", "Trần Văn B", "OK", "OK", 30, 2, 1, 30, 2, 1, 0, 0, 0, "Ghi chú gốc",
  ]);

  const [row] = __test__.parseM02(sheet, "2026-09-02");

  assert.equal(row.date, "");
});

test("Hậu kiểm đọc giờ Date theo UTC như ATGT, không lệch múi giờ lịch sử Việt Nam", () => {
  const originalTimeZone = process.env.TZ;
  process.env.TZ = "Asia/Ho_Chi_Minh";
  try {
    // ExcelJS có thể trả ô thời gian hh:mm:ss thành Date dựa trên mốc 1899-12-30.
    // Nếu dùng getHours() ở Việt Nam, thời gian sẽ lệch +07:06:30.
    const excelTime = new Date(Date.UTC(1899, 11, 30, 13, 8, 0));
    const expected = (13 * 3600 + 8 * 60) / 86400;
    assert.ok(Math.abs(__test__.parseTime(excelTime) - expected) < 1e-10);
  } finally {
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
  }
});

test("Hậu kiểm giữ nguyên giờ dạng số Excel và chuỗi hh:mm:ss", () => {
  const expectedNumeric = (13 * 3600 + 8 * 60) / 86400;
  const expectedText = (13 * 3600 + 8 * 60 + 45) / 86400;
  assert.ok(Math.abs(__test__.parseTime(0.5472222222222223) - expectedNumeric) < 1e-10);
  assert.ok(Math.abs(__test__.parseTime(" 13:08:45 ") - expectedText) < 1e-10);
});
