export const REPORT_FILE_SCHEMAS = {
  cameraMain: {
    label: "Camera chính",
    sheets: [
      { name: "SỔ THEO DÕI BA", aliases: ["SO THEO DOI BA"], headers: ["SỐ XE", "CHI NHÁNH", "TÌNH TRẠNG"] },
      { name: "SỔ THEO DÕI 16 TUYẾN", aliases: ["SỔ THEO DÕI 16 TUYẾN HCM"], headers: ["SỐ XE", "CHI NHÁNH", "TÌNH TRẠNG"] },
      { name: "SỔ THEO DÕI 35 TUYẾN", headers: ["SỐ XE", "CHI NHÁNH", "TÌNH TRẠNG"] },
      { name: "SỔ THEO DÕI SOJI", headers: ["SỐ XE", "CHI NHÁNH", "TÌNH TRẠNG"] },
    ],
  },
  cameraTongda: {
    label: "Camera TONGDA",
    sheets: [{ name: "Sổ theo dõi CAMERA", headers: ["SỐ XE", "CHI NHÁNH", "TÌNH TRẠNG"] }],
  },
  gpsMain: {
    label: "GPS chính – cấu trúc mới",
    sheets: [
      { name: "SỔ THEO DÕI BA", headers: ["CHI NHÁNH", "SỐ XE", "ĐÃ XỬ LÝ", "CHƯA XỬ LÝ"] },
      { name: "SỔ THEO DÕI VIETMAP", headers: ["CHI NHÁNH", "SỐ XE", "ĐÃ XỬ LÝ", "CHƯA XỬ LÝ"] },
    ],
    optionalSheets: ["SỔ THEO DÕI 16 TUYẾN HCM", "SỔ THEO DÕI 35 TUYẾN"],
  },
  gpsTongda: {
    label: "GPS TONGDA",
    sheets: [{ name: "Sổ theo dõi GPS", headers: ["CHI NHÁNH", "SỐ XE", "ĐÃ XỬ LÝ", "CHƯA XỬ LÝ"] }],
  },
  speed4h: {
    label: "Tốc độ, 4H",
    sheets: [
      { name: "TỐC ĐỘ", headers: ["ĐỐI TÁC", "CHI NHÁNH", "TUYẾN", "SỐ XE"] },
      { name: "4H", headers: ["ĐỐI TÁC", "CHI NHÁNH", "TUYẾN", "SỐ XE"] },
    ],
  },
  txdl: {
    label: "TXDL",
  },
  gstt: {
    label: "Hỗ trợ GSTT",
    dynamicSheetPattern: /^(0?[1-9]|1[0-2])(?:[.\/\-_ ]?)(20\d{2})$/,
    dynamicHeaders: ["THỜI GIAN YC HỖ TRỢ", "SỐ XE", "TUYẾN", "TRẠNG THÁI"],
  },
  haukiem: {
    label: "Hậu kiểm",
    prefixes: [{ prefix: "M02", headers: ["STT", "CHI NHÁNH", "SỐ XE"] }, { prefix: "M03" }],
  },
  atgt: {
    label: "ATGT",
    prefixes: [{ prefix: "M02", headers: ["STT", "CHI NHÁNH", "SỐ XE"] }, { prefix: "M03" }],
  },
};

export const REPORT_TEMPLATE_DEFINITIONS = {
  camera: { key: "camera", label: "Báo cáo tuần Camera", staticPath: "/templates/CITYBUS-BAO-CAO-CAMERA-BP-QLCL-DV.xlsx", requiredSheets: ["BCTH P.QLCL"] },
  gps: { key: "gps", label: "Báo cáo tuần GPS", staticPath: "/templates/CITYBUS-BAO-CAO-GPS-BP-QLCL-DV.xlsx", requiredSheets: ["BCTH P.QLCL"] },
  speed4h: { key: "speed4h", label: "Báo cáo Tốc độ, 4H", staticPath: "/templates/CITYBUS-BAO-CAO-TOC-DO-4H-BP-QLCL-DV.xlsx", requiredSheets: ["BCTH P.QLCL"] },
  gstt: { key: "gstt", label: "Báo cáo Hỗ trợ GSTT", staticPath: "/templates/CITYBUS-BAO-CAO-HO-TRO-GSTT-BP-QLCL-DV.xlsx", requiredSheets: ["SP BP.GSTT"] },
  txdl: { key: "txdl", label: "Báo cáo tuần TXDL", staticPath: "/templates/CITYBUS-BAO-CAO-TXDL-BP-QLCL-DV.xlsx", requiredSheets: ["BCTH P.QLCL"] },
  haukiem: { key: "haukiem", label: "Báo cáo Hậu kiểm", staticPath: "/templates/CITYBUS-BAO-CAO-HAU-KIEM-BP-QLCL-DV.xlsx", requiredSheets: ["BCTH.HKVP", "BCCT.HKVP"] },
  atgt: { key: "atgt", label: "Báo cáo ATGT", staticPath: "/templates/CITYBUS-BAO-CAO-ATGT-BP-QLCL-DV.xlsx", requiredSheets: ["BCTH.HKVP", "BCCT.HKVP"] },
};
