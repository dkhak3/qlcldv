import ExcelJS from "exceljs";
import { REPORT_FILE_SCHEMAS } from "./reportSchemas.js";

export const normalizeSchemaText = value => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .replace(/\s+/g, " ")
  .trim()
  .toUpperCase();

export function matchSheetName(sheetName, definition) {
  const normalized = normalizeSchemaText(sheetName);
  if (definition.name) {
    const candidates = [definition.name, ...(definition.aliases || [])].map(normalizeSchemaText);
    return candidates.includes(normalized);
  }
  if (definition.prefix) return normalized.startsWith(normalizeSchemaText(definition.prefix));
  return false;
}

export function evaluateSheetNames(sheetNames, schema) {
  const missing = [];
  const matched = [];
  (schema.sheets || []).forEach(definition => {
    const found = sheetNames.find(name => matchSheetName(name, definition));
    if (found) matched.push({ definition, sheetName: found });
    else missing.push(definition.name);
  });
  (schema.prefixes || []).forEach(definition => {
    const found = sheetNames.find(name => matchSheetName(name, definition));
    if (found) matched.push({ definition, sheetName: found });
    else missing.push(`${definition.prefix}*`);
  });
  if (schema.dynamicSheetPattern) {
    const found = sheetNames.filter(name => schema.dynamicSheetPattern.test(String(name).trim()));
    if (!found.length) missing.push("sheet tháng MM.YYYY");
    else found.forEach(sheetName => matched.push({ definition: { headers: schema.dynamicHeaders || [] }, sheetName }));
  }
  return { valid: missing.length === 0, missingSheets: missing, matched };
}

function workbookRowText(sheet, maxRows = 15, maxColumns = 35) {
  const rows = [];
  for (let row = 1; row <= Math.min(maxRows, sheet.rowCount || maxRows); row += 1) {
    const cells = [];
    for (let column = 1; column <= Math.min(maxColumns, sheet.columnCount || maxColumns); column += 1) {
      const value = sheet.getCell(row, column).value;
      const scalar = value?.richText ? value.richText.map(item => item.text).join("") : value?.text ?? value?.result ?? value;
      cells.push(normalizeSchemaText(scalar));
    }
    rows.push(cells.join(" | "));
  }
  return rows.join("\n");
}

export async function inspectExcelFile(file, schemaKey) {
  const schema = REPORT_FILE_SCHEMAS[schemaKey];
  if (!schema) throw new Error("Không tìm thấy cấu hình kiểm tra file");
  if (!file) return { valid: false, empty: true, label: schema.label, foundSheets: [], missingSheets: [] };
  if (!file.name?.toLowerCase().endsWith(".xlsx")) return { valid: false, label: schema.label, error: "Chỉ chấp nhận file .xlsx", foundSheets: [], missingSheets: [] };

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return { valid: false, label: schema.label, error: "File Excel bị hỏng hoặc không phải XLSX hợp lệ", foundSheets: [], missingSheets: [] };
  }

  const sheetNames = workbook.worksheets.map(sheet => sheet.name);
  const evaluated = evaluateSheetNames(sheetNames, schema);
  const missingHeaders = [];
  evaluated.matched.forEach(({ definition, sheetName }) => {
    const requiredHeaders = definition.headers || [];
    if (!requiredHeaders.length) return;
    const sheet = workbook.getWorksheet(sheetName);
    const haystack = workbookRowText(sheet);
    const absent = requiredHeaders.filter(header => !haystack.includes(normalizeSchemaText(header)));
    if (absent.length) missingHeaders.push({ sheetName, headers: absent });
  });

  const valid = evaluated.valid && missingHeaders.length === 0;
  return {
    valid,
    label: schema.label,
    foundSheets: sheetNames,
    matchedSheets: evaluated.matched.map(item => item.sheetName),
    missingSheets: evaluated.missingSheets,
    missingHeaders,
    message: valid
      ? `File hợp lệ – ${schema.label}`
      : [
          evaluated.missingSheets.length ? `Thiếu sheet: ${evaluated.missingSheets.join(", ")}` : "",
          missingHeaders.length ? `Thiếu cột: ${missingHeaders.map(item => `${item.sheetName} (${item.headers.join(", ")})`).join("; ")}` : "",
        ].filter(Boolean).join(". "),
  };
}
