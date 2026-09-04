export const DEFAULT_REPORT_BOXES = [
  { id: "camera", key: "camera", slug: "bao-cao-camera", title: "Báo cáo tuần Camera", description: "Tổng hợp tình trạng sửa chữa camera theo từng chi nhánh.", route: "/bao-cao-camera", externalUrl: "", videoUrl: "", appearance: "orange", icon: "camera", hidden: false, sortOrder: 1, system: true },
  { id: "gps", key: "gps", slug: "bao-cao-gps", title: "Báo cáo tuần GPS", description: "Tổng hợp và xuất báo cáo dữ liệu GPS theo tuần.", route: "/bao-cao-gps", externalUrl: "", videoUrl: "", appearance: "blue", icon: "map-pin", hidden: false, sortOrder: 2, system: true },
  { id: "txdl", key: "txdl", slug: "bao-cao-txdl", title: "Báo cáo tuần TXDL", description: "Xem hướng dẫn và truy cập hệ thống tổng hợp, xử lý dữ liệu.", route: "/bao-cao-txdl", externalUrl: "https://txdl-project.vercel.app/", videoUrl: "", appearance: "emerald", icon: "file-spreadsheet", hidden: false, sortOrder: 3, system: true },
  { id: "speed-4h", key: "speed-4h", slug: "bao-cao-toc-do-4h", title: "Báo cáo Tốc độ, 4H", description: "Theo dõi dữ liệu tốc độ và thời gian lái xe liên tục 4 giờ.", route: "/bao-cao-toc-do-4h", externalUrl: "", videoUrl: "", appearance: "violet", icon: "gauge", hidden: false, sortOrder: 4, system: true },
  { id: "gstt", key: "gstt", slug: "bao-cao-ho-tro-gstt", title: "Báo cáo Hỗ trợ GSTT", description: "Tổng hợp các trường hợp hỗ trợ giám sát trực tuyến.", route: "/bao-cao-ho-tro-gstt", externalUrl: "", videoUrl: "", appearance: "cyan", icon: "headphones", hidden: false, sortOrder: 5, system: true },
];

export const CORE_REPORT_BOX_KEYS = Object.freeze(DEFAULT_REPORT_BOXES.map(box => box.key));

export function isCoreReportBox(box) {
  return Boolean(box && CORE_REPORT_BOX_KEYS.includes(box.key));
}

export const REPORT_APPEARANCES = {
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
  cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-300",
  pink: "bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-300",
};
