import test from "node:test";
import assert from "node:assert/strict";
import { __test__ } from "../src/utils/gsttProcessor.js";

test("GSTT nhận dạng sheet tháng từ Google Sheets/XLSX", () => {
  assert.equal(__test__.monthKeyFromSheetName("09.2026"), "092026");
  assert.equal(__test__.monthKeyFromSheetName("09/2026"), "092026");
  assert.equal(__test__.monthKeyFromSheetName("092026"), "092026");
  assert.equal(__test__.monthKeyFromSheetName("012026 (THỜI GIAN YC HỖ TRỢ)"), "012026");
  assert.equal(__test__.monthKeyFromSheetName("Job CHỜ XỬ LÝ"), null);
});

test("GSTT chọn đúng các tháng theo khoảng ngày", () => {
  assert.deepEqual(
    __test__.selectedMonthKeys("2026-08-20", "2026-10-03"),
    ["082026", "092026", "102026"],
  );
});

test("GSTT phân loại đúng trạng thái nghiệp vụ", () => {
  assert.equal(__test__.classifyStatus("HOÀN TẤT KHÔI PHỤC GPS"), "fixed");
  assert.equal(__test__.classifyStatus("ĐÓNG (Trùng JOB)"), "fixed");
  assert.equal(__test__.classifyStatus("ĐÓNG (Trùng yêu cầu xử lý của BP.QLCL)"), "fixed");
  assert.equal(__test__.classifyStatus("HOÀN TẤT KHÔI PHỤC CAMERA"), "fixed");
  assert.equal(__test__.classifyStatus("HOÀN TẤT KHÔI PHỤC GPS VÀ CAMERA"), "fixed");
  assert.equal(__test__.classifyStatus("ĐÓNG (GSTT XÁC NHẬN)"), "fixed");
  assert.equal(__test__.classifyStatus("CHỜ XỬ LÝ"), "pending");
  assert.equal(__test__.classifyStatus("CHỜ LẮP ĐẶT/THAY THẾ THIẾT BỊ"), "pending");
  assert.equal(__test__.classifyStatus("KHÔNG THỂ KHÔI PHỤC/KHẮC PHỤC"), "unrecoverable");
  assert.equal(__test__.classifyStatus("ĐÃ KIỂM TRA - CHỜ XÁC NHẬN"), "checked");
});
