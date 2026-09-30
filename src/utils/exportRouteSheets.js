import FileSaver from "file-saver";
import { buildRouteWorkbook } from "./routeWorkbook.js";

const { saveAs } = FileSaver;
const MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const ROUTE_EXPORT_FILE_NAME = "QLCL-DV - TUYẾN.xlsx";

export async function exportRouteSheetsToExcel(sheets) {
  const workbook = await buildRouteWorkbook(sheets);
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: MIME }), ROUTE_EXPORT_FILE_NAME);
}
