import ExcelJS from "exceljs";
import FileSaver from "file-saver";
import { formatDateVi } from "./cameraProcessor.js";

const { saveAs } = FileSaver;
const DETAIL_GROUPS = ["BA", "BA35", "VIETMAP", "TONGDA"];
const STATUS_LABELS = { processed: "ĐÃ XỬ LÝ", unprocessed: "CHƯA XỬ LÝ" };
const SHEET_NAMES = { BA: "1 BINH ANH", BA35: "2 BA 35 TUYEN", VIETMAP: "3 VIETMAP", TONGDA: "4 TONGDA" };

export async function buildGpsVehicleDetailWorkbook(results, startDate, endDate) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nguyễn Hữu Duy Kha";
  workbook.created = new Date();

  results.filter(group => DETAIL_GROUPS.includes(group.key)).forEach(group => {
    const sheet = workbook.addWorksheet(SHEET_NAMES[group.key], { views: [{ state: "frozen", ySplit: 4 }] });
    sheet.properties.defaultRowHeight = 22;
    sheet.columns = [
      { key: "stt", width: 10 },
      { key: "branch", width: 24 },
      { key: "status", width: 30 },
      { key: "vehicle", width: 24 },
    ];
    sheet.mergeCells("A1:D1");
    sheet.getCell("A1").value = `CHI TIẾT CÁC XE GPS — ${group.title}`;
    sheet.getCell("A1").font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 34;
    sheet.mergeCells("A2:D2");
    sheet.getCell("A2").value = `Từ ngày ${formatDateVi(startDate)} đến ngày ${formatDateVi(endDate)}`;
    sheet.getCell("A2").font = { name: "Arial", italic: true, color: { argb: "FF64748B" } };
    sheet.getCell("A2").alignment = { horizontal: "center" };
    sheet.getRow(4).values = ["STT", "CHI NHÁNH", "TRẠNG THÁI", "BIỂN SỐ XE"];
    sheet.getRow(4).eachCell(cell => {
      cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF263247" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { bottom: { style: "thin", color: { argb: "FFD8DEE8" } } };
    });
    sheet.getRow(4).height = 28;

    let index = 1;
    group.rows.forEach(branch => {
      ["processed", "unprocessed"].forEach(status => {
        branch.vehicles[status].forEach(vehicle => {
          const row = sheet.addRow([index, branch.branch, STATUS_LABELS[status], vehicle]);
          row.eachCell(cell => {
            cell.font = { name: "Arial", size: 11 };
            cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
            cell.alignment = { vertical: "middle" };
          });
          row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
          row.getCell(4).font = { name: "Arial", size: 11, bold: true, color: { argb: "FF172033" } };
          row.getCell(3).font = { name: "Arial", size: 11, color: { argb: status === "processed" ? "FF059669" : "FFE11D48" } };
          index += 1;
        });
      });
    });

    if (index === 1) {
      sheet.mergeCells("A5:D5");
      sheet.getCell("A5").value = "NO DATA";
      sheet.getCell("A5").alignment = { horizontal: "center" };
      sheet.getCell("A5").font = { name: "Arial", italic: true, color: { argb: "FF94A3B8" } };
    } else {
      sheet.autoFilter = { from: "A4", to: `D${index + 3}` };
    }
    sheet.pageSetup = { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.35, right: 0.35, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
  });
  return workbook;
}

export async function exportGpsVehicleDetails(results, startDate, endDate) {
  const workbook = await buildGpsVehicleDetailWorkbook(results, startDate, endDate);
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `CHI TIẾT XE GPS ${formatDateVi(startDate).replaceAll("/", "-")} đến ${formatDateVi(endDate).replaceAll("/", "-")}.xlsx`;
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}
