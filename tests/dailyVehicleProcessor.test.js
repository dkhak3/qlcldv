import test from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";
import ExcelJS from "exceljs";
import {
  buildDailyVehicleNote,
  processDailyVehicleFiles,
  resolveDailyVehicleBranchSheets,
} from "../src/utils/dailyVehicleProcessor.js";

function addVehicleSheet(workbook, name, rows) {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow([`CHI NHÁNH ${name}`]);
  sheet.addRow(["21-09", "KÝ HIỆU", "BIỂN SỐ XE", "TUYẾN", "Dòng xe", "TÌNH TRẠNG", "NGUYÊN NHÂN", "VỊ TRÍ HIỆN TẠI", "NỘI DUNG ĐỀ XUẤT TMS", "NGÀY VÀO XƯỞNG", "DỰ KIẾN RA XƯỞNG", "GHI CHÚ"]);
  rows.forEach((row, index) => sheet.addRow([
    index + 1,
    "KYHIEU",
    row.vehicle,
    row.route || "Tuyến mẫu",
    "Dòng xe",
    "Không hoạt động",
    row.reason ?? "",
    "Xưởng",
    "",
    row.workshopIn ?? "",
    row.expectedOut ?? "",
    row.note ?? "",
  ]));
  sheet.addRow(["22-09", "KÝ HIỆU", "BIỂN SỐ XE", "TUYẾN", "Dòng xe", "TÌNH TRẠNG", "NGUYÊN NHÂN", "VỊ TRÍ HIỆN TẠI", "NỘI DUNG ĐỀ XUẤT TMS", "NGÀY VÀO XƯỞNG", "DỰ KIẾN RA XƯỞNG", "GHI CHÚ"]);
  return sheet;
}

function addGpsSection(sheet, rows, includeNoteHeader = true) {
  sheet.addRow(["TỔNG HỢP XE SỬA CHỮA, XE TAI NẠN, XE TRẢ XƯỞNG KHÔNG VẬN DOANH"]);
  sheet.addRow(["STT", "CHI NHÁNH", "TUYẾN", "SỐ XE", "THỜI GIAN", "ĐỊA ĐIỂM", includeNoteHeader ? "GHI CHÚ" : ""]);
  rows.forEach((row, index) => sheet.addRow([
    index + 1,
    row.branch,
    row.route,
    row.vehicle,
    "",
    "",
    row.note ?? "",
  ]));
  sheet.addRow(["TÌNH TRẠNG XE SỬA CHỮA ĐỊNH VỊ HẰNG NGÀY"]);
}

async function asFile(workbook, name) {
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], name, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

test("ghi chú phương tiện đúng format và không hiện ngoặc khi GHI CHÚ trống", () => {
  assert.equal(
    buildDailyVehicleNote({
      reason: "Sửa chữa",
      workshopIn: "30/06/2026",
      expectedOut: "17/09/2026",
      note: "",
    }),
    "Sửa chữa. Ngày vào xưởng 30/06/2026 - Dự kiến ra xưởng 17/09/2026",
  );

  assert.equal(
    buildDailyVehicleNote({
      reason: "Sửa chữa",
      workshopIn: "30/06/2026",
      expectedOut: "17/09/2026",
      note: "Xe tai nạn",
    }),
    "Sửa chữa. Ngày vào xưởng 30/06/2026 - Dự kiến ra xưởng 17/09/2026 (Xe tai nạn)",
  );
});

test("mapping HCM và ĐỒNG THÁP dùng đúng sheet phương tiện", () => {
  const names = ["AN GIANG", "CAO LÃNH", "SA ĐÉC", "TP HỒ CHÍ MINH"];
  assert.deepEqual(resolveDailyVehicleBranchSheets("HCM", names), ["TP HỒ CHÍ MINH"]);
  assert.deepEqual(resolveDailyVehicleBranchSheets("ĐỒNG THÁP", names), ["CAO LÃNH", "SA ĐÉC"]);
  assert.deepEqual(resolveDailyVehicleBranchSheets("AN GIANG", names), ["AN GIANG"]);
});

test("BA-VIETMAP giữ nguyên thứ tự GPS, nối đúng xe và giữ cả Ghi chú trống", async () => {
  const vehicleBook = new ExcelJS.Workbook();
  addVehicleSheet(vehicleBook, "AN GIANG", [
    { vehicle: "50A11111", reason: "Sửa chữa", workshopIn: "01/09/2026", expectedOut: "25/09/2026", note: "" },
  ]);
  addVehicleSheet(vehicleBook, "TP HỒ CHÍ MINH", [
    { vehicle: "50H12345", reason: "Bảo dưỡng", workshopIn: "10/09/2026", expectedOut: "", note: "Xe tai nạn" },
  ]);
  addVehicleSheet(vehicleBook, "CAO LÃNH", [
    { vehicle: "66B12345", reason: "Sửa chữa", workshopIn: "20/09/2026", expectedOut: "24/09/2026", note: "" },
  ]);
  addVehicleSheet(vehicleBook, "SA ĐÉC", [
    { vehicle: "66B54321", reason: "Sửa chữa", workshopIn: "18/09/2026", expectedOut: "25/09/2026", note: "Theo dõi thêm" },
  ]);

  const gpsBook = new ExcelJS.Workbook();
  const ba = gpsBook.addWorksheet("TỔNG HỢP BA");
  addGpsSection(ba, [
    { branch: "AN GIANG", route: "Tuyến A", vehicle: "50A11111", note: "Ghi chú cũ A" },
    { branch: "HCM", route: "Tuyến H", vehicle: "50H12345", note: "Ghi chú cũ H" },
    { branch: "ĐỒNG THÁP", route: "Tuyến ĐT", vehicle: "66B12345", note: "Ghi chú cũ ĐT" },
    { branch: "AN GIANG", route: "Tuyến X", vehicle: "50Z99999", note: "" },
  ], false);

  const vietmap = gpsBook.addWorksheet("TỔNG HỢP VIETMAP");
  addGpsSection(vietmap, [
    { branch: "ĐỒNG THÁP", route: "Tuyến SĐ", vehicle: "66B54321", note: "Ghi chú cũ SĐ" },
  ]);

  const result = await processDailyVehicleFiles(
    await asFile(vehicleBook, "BAO CAO PHUONG TIEN HANG NGAY.xlsx"),
    await asFile(gpsBook, "GPS BA VIETMAP.xlsx"),
    "2026-09-21",
  );

  assert.equal(result.gpsType, "ba-vietmap");
  assert.deepEqual(result.groups.map(group => group.title), ["BÌNH ANH", "VIETMAP"]);
  assert.deepEqual(result.groups[0].rows.map(row => row.vehicle), ["50A11111", "50H12345", "66B12345", "50Z99999"]);
  assert.equal(result.groups[0].rows[0].note, "Sửa chữa. Ngày vào xưởng 01/09/2026 - Dự kiến ra xưởng 25/09/2026");
  assert.equal(result.groups[0].rows[1].note, "Bảo dưỡng. Ngày vào xưởng 10/09/2026 (Xe tai nạn)");
  assert.equal(result.groups[0].rows[2].matchedSheet, "CAO LÃNH");
  assert.equal(result.groups[0].rows[3].note, "");
  assert.equal(result.groups[0].rows[3].matchStatus, "preserved");
  assert.equal(result.groups[1].rows[0].matchedSheet, "SA ĐÉC");
  assert.equal(result.groups[1].rows[0].note, "Sửa chữa. Ngày vào xưởng 18/09/2026 - Dự kiến ra xưởng 25/09/2026 (Theo dõi thêm)");
  assert.equal(result.updated, 4);
  assert.equal(result.preserved, 1);
});

test("ĐỒNG THÁP có cùng biển số ở CAO LÃNH và SA ĐÉC thì giữ nguyên GPS", async () => {
  const vehicleBook = new ExcelJS.Workbook();
  addVehicleSheet(vehicleBook, "CAO LÃNH", [
    { vehicle: "66B77777", reason: "Sửa chữa", workshopIn: "20/09/2026", expectedOut: "24/09/2026", note: "" },
  ]);
  addVehicleSheet(vehicleBook, "SA ĐÉC", [
    { vehicle: "66B77777", reason: "Bảo dưỡng", workshopIn: "21/09/2026", expectedOut: "25/09/2026", note: "" },
  ]);

  const gpsBook = new ExcelJS.Workbook();
  const vietmap = gpsBook.addWorksheet("TỔNG HỢP VIETMAP");
  addGpsSection(vietmap, []);
  const ba = gpsBook.addWorksheet("TỔNG HỢP BA");
  addGpsSection(ba, [
    { branch: "ĐỒNG THÁP", route: "Tuyến ĐT", vehicle: "66B77777", note: "GIỮ NGUYÊN TÔI" },
  ]);

  const result = await processDailyVehicleFiles(
    await asFile(vehicleBook, "BAO CAO PHUONG TIEN HANG NGAY.xlsx"),
    await asFile(gpsBook, "GPS BA VIETMAP.xlsx"),
    "2026-09-21",
  );

  const row = result.groups.find(group => group.key === "ba").rows[0];
  assert.equal(row.note, "GIỮ NGUYÊN TÔI");
  assert.equal(row.matchStatus, "ambiguous");
  assert.equal(result.ambiguous, 1);
});

test("TONGDA được nhận diện từ sheet GPS", async () => {
  const vehicleBook = new ExcelJS.Workbook();
  addVehicleSheet(vehicleBook, "ĐÀ LẠT", [
    { vehicle: "50F04365", reason: "Sửa chữa", workshopIn: "20/09/2026", expectedOut: "30/09/2026", note: "" },
  ]);

  const gpsBook = new ExcelJS.Workbook();
  const gps = gpsBook.addWorksheet("GPS");
  addGpsSection(gps, [
    { branch: "ĐÀ LẠT", route: "Tuyến 02", vehicle: "50F04365", note: "Ghi chú cũ" },
  ]);

  const result = await processDailyVehicleFiles(
    await asFile(vehicleBook, "BAO CAO PHUONG TIEN HANG NGAY.xlsx"),
    await asFile(gpsBook, "GPS TONGDA.xlsx"),
    "2026-09-21",
  );

  assert.equal(result.gpsType, "tongda");
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].title, "TONGDA");
  assert.equal(result.groups[0].rows[0].note, "Sửa chữa. Ngày vào xưởng 20/09/2026 - Dự kiến ra xưởng 30/09/2026");
});
