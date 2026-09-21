import ExcelJS from "exceljs";
import FileSaver from "file-saver";

const { saveAs } = FileSaver;
const MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function styleSheet(sheet, widths) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: sheet.getRow(1).getCell(widths.length).address };
  sheet.getRow(1).height = 28;
  sheet.getRow(1).eachCell(cell => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD1D5DB" } },
      left: { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      right: { style: "thin", color: { argb: "FFD1D5DB" } },
    };
  });
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: "top", wrapText: true };
    row.eachCell({ includeEmpty: true }, cell => {
      cell.font = { name: "Arial", size: 10, color: { argb: "FF1F2937" } };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        top: { style: "hair", color: { argb: "FFE5E7EB" } },
        left: { style: "hair", color: { argb: "FFE5E7EB" } },
        bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
        right: { style: "hair", color: { argb: "FFE5E7EB" } },
      };
    });
  });
  sheet.pageSetup.orientation = "landscape";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
}

async function saveWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: MIME }), fileName);
}

export async function exportTxdlLookupExcel(results) {
  const rows = results?.lookupRows || [];
  if (!rows.length) throw new Error("Không có kết quả tra cứu để xuất");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Kết quả tra cứu");
  sheet.addRow(["STT JOB", "NGÀY TIẾP NHẬN DVKH", "TÊN NHÂN VIÊN DVKH", "NGÀY PHẢN HỒI QLCL-DV", "TÊN NHÂN VIÊN QLCL-DV", "NỘI DUNG PHẢN ÁNH"]);
  rows.forEach(row => sheet.addRow([row.jobStt, row.receivedDate, row.dvkhEmployee, row.responseDate, row.qlclEmployee, row.content]));
  styleSheet(sheet, [12, 22, 28, 24, 30, 90]);
  await saveWorkbook(workbook, "TXDL - KẾT QUẢ TRA CỨU.xlsx");
}

export async function exportTxdlRemovedExcel(results) {
  const rows = results?.removedRows || [];
  if (!rows.length) throw new Error("Không có phản ánh bị loại để xuất");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Phản ánh bị loại");
  sheet.addRow(["STT JOB", "NGÀY TIẾP NHẬN", "NGÀY PHẢN HỒI", "NHÂN VIÊN DVKH", "NHÂN VIÊN QLCL-DV", "NỘI DUNG TIẾP NHẬN", "LÝ DO LOẠI"]);
  rows.forEach(row => sheet.addRow([row.jobStt, row.receivedDate, row.responseDate, row.dvkhEmployee, row.qlclEmployee, row.content, row.reason]));
  styleSheet(sheet, [12, 20, 20, 26, 28, 80, 55]);
  await saveWorkbook(workbook, "TXDL - PHẢN ÁNH BỊ LOẠI.xlsx");
}
