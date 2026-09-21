import { exportCameraReport } from "./exportReport";
import { exportGpsReport } from "./exportGpsReport";
import { exportTxdlReport } from "./exportTxdlReport";
import { exportGsttReport } from "./exportGsttReport";
import { exportSpeed4hReport } from "./exportSpeed4hReport";
import { exportHauKiemReport } from "./exportHauKiemReport";
import { exportAtgtReport } from "./exportAtgtReport";

const exporters = {
  camera: exportCameraReport,
  gps: exportGpsReport,
  txdl: exportTxdlReport,
  speed4h: exportSpeed4hReport,
  gstt: exportGsttReport,
  haukiem: exportHauKiemReport,
  atgt: exportAtgtReport,
};

export async function exportSavedReport(report) {
  const exporter = exporters[report?.type];
  if (!exporter) throw new Error("Loại báo cáo này chưa hỗ trợ xuất Excel");
  if (!report?.data) throw new Error("Báo cáo đã lưu không có dữ liệu để xuất");

  await exporter({
    results: report.data,
    startDate: report.startDate,
    endDate: report.endDate,
    employees: report.employees || "",
  });
}
