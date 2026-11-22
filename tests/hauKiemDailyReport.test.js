import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_HAUKIEM_DAILY_REPORT_BYTES,
  formatHauKiemDailyReportSize,
  sanitizeHauKiemDailyReportFileName,
  validateHauKiemDailyReportFile,
} from "../src/utils/hauKiemDailyReport.js";

test("accepts Excel, PDF and Word files and resolves a fallback MIME type", () => {
  const result = validateHauKiemDailyReportFile({
    name: "Báo cáo ngày.xlsx",
    size: 1024,
    type: "",
  });
  assert.equal(result.extension, ".xlsx");
  assert.equal(result.contentType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(result.originalName, "Báo cáo ngày.xlsx");
});

test("rejects unsupported file extensions", () => {
  assert.throws(
    () => validateHauKiemDailyReportFile({ name: "malware.exe", size: 100, type: "application/octet-stream" }),
    /Chỉ hỗ trợ file Excel/,
  );
});

test("rejects empty and oversized files", () => {
  assert.throws(() => validateHauKiemDailyReportFile({ name: "report.pdf", size: 0 }), /đang trống/);
  assert.throws(
    () => validateHauKiemDailyReportFile({ name: "report.pdf", size: MAX_HAUKIEM_DAILY_REPORT_BYTES + 1 }),
    /tối đa là 25 MB/,
  );
});

test("formats file sizes and sanitizes storage object names", () => {
  assert.equal(formatHauKiemDailyReportSize(1024), "1.0 KB");
  assert.equal(sanitizeHauKiemDailyReportFileName("Báo cáo ngày 01.xlsx"), "Bao-cao-ngay-01.xlsx");
});
