import FileSaver from "file-saver";
import { getReportTemplateBuffer } from "../services/reportTemplateService.js";
import { buildTxdlReportWorkbook } from "./txdlReportWorkbook.js";

const { saveAs } = FileSaver;
export const TXDL_REPORT_NAME = "CITYBUS - BÁO CÁO HỖ TRỢ TRÍCH XUẤT DỮ LIỆU BP.QLCL-DV";
const FILE_NAME = `${TXDL_REPORT_NAME}.xlsx`;

export async function exportTxdlReport(form) {
  const templateBuffer = await getReportTemplateBuffer("txdl");
  const workbook = await buildTxdlReportWorkbook(templateBuffer, form);
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), FILE_NAME);
}
