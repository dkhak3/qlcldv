import { formatDateVi } from "./cameraProcessor.js";

const REPORT_TITLE = "BÁO CÁO CÔNG VIỆC BỘ PHẬN QUẢN LÝ CLDV CITYBUS";
const FONT_NAME = "Times New Roman";

export function applyStandardReportHeader(sheet, startDate, endDate) {
  const headerCell = sheet.getCell("A1");

  headerCell.value = {
    richText: [
      {
        text: REPORT_TITLE,
        font: {
          name: FONT_NAME,
          size: 16,
          bold: true,
        },
      },
      {
        text: `\n(Từ ngày ${formatDateVi(startDate)} đến ngày ${formatDateVi(endDate)})`,
        font: {
          name: FONT_NAME,
          size: 13,
          bold: true,
          italic: true,
        },
      },
    ],
  };

  headerCell.alignment = {
    ...headerCell.alignment,
    wrapText: true,
  };
}

