import { exportCameraReport } from "./exportReport";
import { exportGpsReport } from "./exportGpsReport";
import { exportGsttReport } from "./exportGsttReport";
import { exportSpeed4hReport } from "./exportSpeed4hReport";

const exporters = {
  camera: exportCameraReport,
  gps: exportGpsReport,
  speed4h: exportSpeed4hReport,
  gstt: exportGsttReport,
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
