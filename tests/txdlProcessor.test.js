import test from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { __test__, processTxdlFile } from "../src/utils/txdlProcessor.js";
import { buildTxdlReportWorkbook, findTxdlSummaryRow } from "../src/utils/txdlReportWorkbook.js";

test("TXDL tách Chi nhánh và nội dung cho form cũ/mới", () => {
  const oldForm = "1/ Chi nhánh/Đơn vị: CN Bình Tân 2/ Tuyến: 01 5/ Nội dung tiếp nhận PA/KN: Xe chạy ẩu 6/ Thông tin KH: A";
  assert.equal(__test__.extractTxdlBranch(oldForm), "CN Bình Tân");
  assert.equal(__test__.extractTxdlContent(oldForm), "Xe chạy ẩu");

  const newForm = "1/ Nguồn tiếp nhận: App 2/ Chi nhánh/Đơn vị: CN Thủ Đức 3/ Tuyến: 08 6/ Nội dung tiếp nhận PA/KN: Bỏ trạm 7/ Thông tin KH: B";
  assert.equal(__test__.extractTxdlBranch(newForm), "CN Thủ Đức");
  assert.equal(__test__.extractTxdlContent(newForm), "Bỏ trạm");
});

test("TXDL phân loại tính vi phạm", () => {
  assert.equal(__test__.classifyViolation("CÓ VI PHẠM"), "YES");
  assert.equal(__test__.classifyViolation("KHÔNG VI PHẠM"), "NO");
  assert.equal(__test__.classifyViolation("HỖ TRỢ KHÁCH HÀNG"), "SUPPORT");
});

test("TXDL lọc Sheet 1 theo ngày và ghép Sheet 2 bằng STT", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet1 = workbook.addWorksheet("Phản ánh");
  sheet1.addRow(["DANH SÁCH PHẢN ÁNH"]);
  sheet1.addRow(["STT", "NGÀY TIẾP NHẬN", "NGÀY PHẢN HỒI", "TÊN NHÂN VIÊN DVKH", "TÊN NHÂN VIÊN QLCL-DV", "NỘI DUNG TIẾP NHẬN PHẢN ÁNH"]);
  sheet1.addRow([1, "01/09/2026", "02/09/2026", "DVKH A", "QLCL A", "1/ Chi nhánh/Đơn vị: CN Bình Tân 2/ Tuyến: 01 5/ Nội dung tiếp nhận PA/KN: Xe chạy ẩu 6/ Thông tin KH: A"]);
  sheet1.addRow([2, "03/09/2026", "04/09/2026", "DVKH B", "QLCL B", "1/ Nguồn tiếp nhận: App 2/ Chi nhánh/Đơn vị: CN Thủ Đức 3/ Tuyến: 08 6/ Nội dung tiếp nhận PA/KN: Cần hỗ trợ 7/ Thông tin KH: B"]);
  sheet1.addRow([3, "05/09/2026", "06/09/2026", "DVKH C", "QLCL C", "1/ Chi nhánh/Đơn vị: CN HCM 2/ Tuyến: 10 5/ Nội dung tiếp nhận PA/KN: Không khớp 6/ Thông tin KH: C"]);
  sheet1.addRow([4, "20/08/2026", "21/08/2026", "DVKH D", "QLCL D", "1/ Chi nhánh/Đơn vị: CN Huế 2/ Tuyến: 11 5/ Nội dung tiếp nhận PA/KN: Ngoài kỳ 6/ Thông tin KH: D"]);

  const sheet2 = workbook.addWorksheet("Xác minh");
  sheet2.addRow(["STT", "TUYẾN", "BIỂN KIỂM SOÁT", "HỌ TÊN NHÂN VIÊN BỊ PHẢN ÁNH", "XÁC ĐỊNH TÍNH VI PHẠM"]);
  sheet2.addRow([1, "01", "51B-12345", "Nguyễn Văn A", "CÓ VI PHẠM"]);
  sheet2.addRow([2, "08", "51B-54321", "Trần Văn B", "HỖ TRỢ KHÁCH HÀNG"]);

  const buffer = await workbook.xlsx.writeBuffer();
  const file = new File([buffer], "TXDL.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const result = await processTxdlFile(file, "2026-09-01", "2026-09-30");

  assert.equal(result.totalBeforeFilter, 4);
  assert.equal(result.totalAfterFilter, 3);
  assert.equal(result.totalMatched, 2);
  assert.equal(result.totalRemoved, 1);
  assert.equal(result.lookupRows.length, 3);
  assert.equal(result.lookupRows[0].jobStt, "1");
  assert.equal(result.lookupRows[0].receivedDate, "01/09/2026");
  assert.equal(result.lookupRows[0].qlclEmployee, "QLCL A");
  assert.equal(result.totalViolation, 1);
  assert.equal(result.totalNoViolation, 0);
  assert.equal(result.totalSupportCustomer, 1);
  assert.equal(result.rows[0].branch, "CN Bình Tân");
  assert.equal(result.rows[0].content, "Xe chạy ẩu");
  assert.equal(result.rows[1].supportCustomer, true);
  assert.match(result.removedRows[0].reason, /STT 3/);
});

test("Template TXDL mặc định là XLSX hợp lệ và có sheet BCTH P.QLCL", async () => {
  const path = new URL("../public/templates/CITYBUS-BAO-CAO-TXDL-BP-QLCL-DV.xlsx", import.meta.url);
  const bytes = await readFile(path);
  assert.ok(bytes.byteLength > 1000);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.getWorksheet("BCTH P.QLCL");
  assert.ok(sheet);
  assert.ok(findTxdlSummaryRow(sheet) >= 9);
});

test("TXDL xuất báo cáo chính với nhiều dòng và giữ phần Khó khăn/đề xuất", async () => {
  const path = new URL("../public/templates/CITYBUS-BAO-CAO-TXDL-BP-QLCL-DV.xlsx", import.meta.url);
  const bytes = await readFile(path);
  const rows = Array.from({ length: 12 }, (_, index) => ({
    stt: index + 1,
    jobStt: String(index + 1),
    branch: "HCM",
    route: `Tuyến ${index + 1}`,
    vehicle: `50E${String(index + 1).padStart(5, "0")}`,
    content: `Nội dung ${index + 1}`,
    employeeName: `Nhân viên ${index + 1}`,
    noViolation: index % 3 === 0 ? 1 : 0,
    violation: index % 3 === 1 ? 1 : 0,
    supportCustomer: index % 3 === 2,
  }));
  const workbook = await buildTxdlReportWorkbook(bytes, {
    results: { rows },
    startDate: "2026-09-01",
    endDate: "2026-09-07",
    employees: "QLCL-DV",
  });
  const sheet = workbook.getWorksheet("BCTH P.QLCL");
  const summaryRow = findTxdlSummaryRow(sheet);
  assert.equal(summaryRow, 20);
  assert.equal(sheet.getCell("A8").value, 1);
  assert.equal(sheet.getCell("B19").value, "HCM");
  assert.equal(sheet.getCell("G10").value, "HỖ TRỢ KHÁCH HÀNG");
  assert.equal(sheet.getCell(summaryRow, 7).value, 4);
  assert.equal(sheet.getCell(summaryRow, 8).value, 4);
  assert.equal(sheet.getCell(summaryRow, 1).alignment.horizontal, "center");
  assert.equal(sheet.getCell(summaryRow, 1).font.bold, true);
  assert.equal(sheet.getCell(summaryRow, 7).font.bold, true);
  assert.equal(sheet.getCell(summaryRow, 7).font.color.argb, "FF000000");
  assert.equal(sheet.getCell(summaryRow, 8).font.bold, true);
  assert.equal(sheet.getCell(summaryRow, 8).font.color.argb, "FF000000");
  assert.equal(sheet.getCell("G10").font.bold, true);
  assert.equal(sheet.getCell("G10").font.color.argb, "FFFF0000");
  assert.match(String(sheet.getCell(summaryRow + 1, 1).value || ""), /Khó khăn|KHO KHĂN/i);

  const output = await workbook.xlsx.writeBuffer();
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(output);
  const reopenedSheet = reopened.getWorksheet("BCTH P.QLCL");
  assert.equal(findTxdlSummaryRow(reopenedSheet), summaryRow);
  assert.match(String(reopenedSheet.getCell(summaryRow + 1, 1).value || ""), /Khó khăn|KHO KHĂN/i);
});
