import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_HAUKIEM_DAILY_REPORT_BYTES,
  formatHauKiemDailyReportSize,
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

test("accepts a file at the 500 KB limit", () => {
  const result = validateHauKiemDailyReportFile({
    name: "report.pdf",
    size: MAX_HAUKIEM_DAILY_REPORT_BYTES,
    type: "application/pdf",
  });
  assert.equal(result.size, 500 * 1024);
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
    /tối đa là 500 KB/,
  );
});

test("formats file sizes", () => {
  assert.equal(formatHauKiemDailyReportSize(1024), "1.0 KB");
  assert.equal(formatHauKiemDailyReportSize(500 * 1024), "500.0 KB");
});
