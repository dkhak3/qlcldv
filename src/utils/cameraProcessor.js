import ExcelJS from "exceljs";

const MAIN_GROUPS = [
  { key: "BA", title: "1. BÌNH ANH", sheets: ["SỔ THEO DÕI BA", "SỔ THEO DÕI 16 TUYẾN"] },
  { key: "BA35", title: "2. BÌNH ANH 35 TUYẾN", sheets: ["SỔ THEO DÕI 35 TUYẾN"] },
  { key: "SOJI", title: "3. SOJI", sheets: ["SỔ THEO DÕI SOJI"] },
];

const TONGDA_GROUP = { key: "TONGDA", title: "4. TONGDA", sheets: ["Sổ theo dõi CAMERA"] };
const VALID_STATUSES = ["DA SUA", "CHUA SUA", "DA KIEM TRA CHUA KHAC PHUC"];

export const normalizeText = value => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .replace(/\s+/g, " ")
  .trim()
  .toUpperCase();

export function countUniqueBranches(results) {
  const branches = new Set();
  results.forEach(group => {
    group.rows.forEach(row => {
      const branch = normalizeText(row.branch);
      if (branch) branches.add(branch);
    });
  });
  return branches.size;
}

const normalizeVehicle = value => normalizeText(value).replace(/[^A-Z0-9]/g, "");

function cellText(value) {
  if (value?.richText) return value.richText.map(item => item.text).join("");
  if (value?.text) return value.text;
  return value;
}

function parseHeaderDate(values) {
  for (const value of values) {
    const match = normalizeText(value).match(/NGAY\s+(\d{1,2})\s+THANG\s+(\d{1,2})\s+NAM\s+(\d{4})/);
    if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

function parseCellDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  const text = String(value ?? "").trim();
  let match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : null;
}

function findWorksheet(workbook, expectedName) {
  const target = normalizeText(expectedName);
  return workbook.worksheets.find(sheet => normalizeText(sheet.name) === target);
}

function readSheet(worksheet, startDate, endDate) {
  const records = [];
  const datesSeen = new Set();
  let activeDate = null;
  let columns = null;
  let hasDateHeader = false;
  let hasColumnHeader = false;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values = row.values.slice(1).map(cellText);
    const headerDate = parseHeaderDate(values);
    if (headerDate) {
      activeDate = headerDate;
      datesSeen.add(headerDate);
      columns = null;
      hasDateHeader = true;
      return;
    }

    const normalized = values.map(normalizeText);
    const vehicleColumn = normalized.indexOf("SO XE");
    const branchColumn = normalized.indexOf("CHI NHANH");
    const statusColumn = normalized.indexOf("TINH TRANG");
    const issueDateColumn = normalized.findIndex(value => value === "NGAY" || value?.startsWith("NGAY "));
    if (activeDate && vehicleColumn >= 0 && branchColumn >= 0 && statusColumn >= 0 && issueDateColumn >= 0) {
      columns = { vehicle: vehicleColumn, branch: branchColumn, status: statusColumn, issueDate: issueDateColumn };
      hasColumnHeader = true;
      return;
    }

    if (!columns || !activeDate || activeDate < startDate || activeDate > endDate) return;
    const vehicle = normalizeVehicle(values[columns.vehicle]);
    const rawBranch = String(values[columns.branch] ?? "").replace(/\s+/g, " ").trim().toUpperCase();
    const branch = normalizeText(rawBranch);
    const status = normalizeText(values[columns.status]);
    if (!vehicle || !branch || !VALID_STATUSES.includes(status)) return;
    records.push({
      headerDate: activeDate,
      issueDate: parseCellDate(values[columns.issueDate]),
      vehicle,
      branch,
      branchLabel: rawBranch,
      status,
      rowNumber,
    });
  });

  return { records, datesSeen, hasDateHeader, hasColumnHeader };
}

function resolveVehicleStates(records, endDate, hasEndSnapshot) {
  const ordered = [...records].sort((a, b) => a.headerDate.localeCompare(b.headerDate) || a.rowNumber - b.rowNumber);
  const states = new Map();

  for (const record of ordered) {
    const current = states.get(record.vehicle) || { state: null, issueDate: null, checkedIssueDate: null };
    if (record.status === "DA SUA") {
      current.state = "fixed";
      current.issueDate = record.issueDate || current.issueDate;
      current.checkedIssueDate = null;
    } else if (record.status === "DA KIEM TRA CHUA KHAC PHUC") {
      // Chuyển xe đang CHƯA SỬA sang ĐÃ KIỂM TRA. Nếu đây là lần đầu xe xuất hiện
      // trong khoảng chọn, hoặc là một lỗi mới sau lần sửa trước, vẫn giữ trạng thái
      // kiểm tra để không làm mất phương tiện thực tế khỏi báo cáo.
      const isNewIssueAfterFixed = current.state === "fixed" && Boolean(record.issueDate && current.issueDate && record.issueDate !== current.issueDate);
      if (current.state === "unfixed" || current.state === "checked" || current.state === null || isNewIssueAfterFixed) {
        current.state = "checked";
        current.checkedIssueDate = record.issueDate || current.issueDate || record.headerDate;
        current.issueDate = record.issueDate || current.issueDate;
      }
    } else if (record.status === "CHUA SUA") {
      if (current.state === "checked") {
        const isNewIssue = Boolean(record.issueDate && current.checkedIssueDate && record.issueDate !== current.checkedIssueDate);
        if (isNewIssue) {
          current.state = "unfixed";
          current.issueDate = record.issueDate;
          current.checkedIssueDate = null;
        }
      } else {
        current.state = "unfixed";
        current.issueDate = record.issueDate || current.issueDate;
      }
    }
    states.set(record.vehicle, current);
  }

  // Với trạng thái CHƯA SỬA thông thường, danh sách ngày kết thúc là ảnh chụp chốt kỳ.
  // Xe biến mất khỏi ảnh chụp cuối kỳ được xem là đã xử lý. Xe ĐÃ KIỂM TRA được giữ
  // cho đến khi có ĐÃ SỬA hoặc một lỗi mới (ngày cột B khác) xuất hiện phía sau.
  if (hasEndSnapshot) {
    const endUnfixedVehicles = new Set(ordered.filter(record => record.headerDate === endDate && record.status === "CHUA SUA").map(record => record.vehicle));
    states.forEach((current, plate) => {
      if (current.state === "unfixed" && !endUnfixedVehicles.has(plate)) current.state = "fixed";
    });
  }

  return states;
}

function summarize(records, endDate, hasEndSnapshot) {
  const branches = new Map();
  records.forEach(record => {
    if (!branches.has(record.branch)) branches.set(record.branch, []);
    branches.get(record.branch).push(record);
  });

  return [...branches.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "vi"))
    .map(([branch, rows], index) => {
      const vehicleStates = resolveVehicleStates(rows, endDate, hasEndSnapshot);
      const vehicles = { fixed: [], unfixed: [], checked: [] };
      vehicleStates.forEach((current, plate) => {
        if (vehicles[current.state]) vehicles[current.state].push(plate);
      });
      Object.values(vehicles).forEach(list => list.sort((a, b) => a.localeCompare(b, "vi", { numeric: true })));
      return {
        stt: index + 1,
        branch: rows[0].branchLabel || branch,
        total: vehicles.fixed.length + vehicles.unfixed.length + vehicles.checked.length,
        fixed: vehicles.fixed.length,
        unfixed: vehicles.unfixed.length,
        checked: vehicles.checked.length,
        vehicles,
      };
    });
}

async function loadWorkbook(file, fileLabel) {
  if (!file || !file.name?.toLowerCase().endsWith(".xlsx")) throw new Error(`${fileLabel}: file không hợp lệ. Vui lòng chọn đúng file Excel .xlsx`);
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(await file.arrayBuffer()); }
  catch { throw new Error(`${fileLabel}: file không hợp lệ hoặc đã bị hỏng`); }
  return workbook;
}

async function processGroups(workbook, groups, startDate, endDate, fileLabel) {
  const results = [];
  const missingSheets = groups.flatMap(group => group.sheets).filter(name => !findWorksheet(workbook, name));
  if (missingSheets.length) throw new Error(`${fileLabel}: cấu trúc không hợp lệ. Thiếu sheet: ${missingSheets.join(", ")}`);

  for (const group of groups) {
    const records = [];
    const datesSeen = new Set();
    for (const sheetName of group.sheets) {
      const parsed = readSheet(findWorksheet(workbook, sheetName), startDate, endDate);
      if (!parsed.hasDateHeader || !parsed.hasColumnHeader) {
        throw new Error(`${fileLabel}: cấu trúc không hợp lệ tại sheet “${sheetName}”. Cần có tiêu đề ngày và các cột NGÀY, SỐ XE, CHI NHÁNH, TÌNH TRẠNG`);
      }
      parsed.records.forEach(record => records.push(record));
      parsed.datesSeen.forEach(date => datesSeen.add(date));
    }
    results.push({ ...group, rows: summarize(records, endDate, datesSeen.has(endDate)) });
  }
  return results;
}

export async function processCameraFiles(mainFile, tongdaFile, startDate, endDate) {
  const mainWorkbook = await loadWorkbook(mainFile, "File Camera chính");
  const tongdaWorkbook = await loadWorkbook(tongdaFile, "File TONGDA");
  const mainResults = await processGroups(mainWorkbook, MAIN_GROUPS, startDate, endDate, "File Camera chính");
  const tongdaResults = await processGroups(tongdaWorkbook, [TONGDA_GROUP], startDate, endDate, "File TONGDA");
  return [...mainResults, ...tongdaResults];
}

export function formatDateVi(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export const __test__ = { resolveVehicleStates, parseCellDate };
