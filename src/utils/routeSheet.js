export function routeColumnName(index) {
  let value = Number(index) + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result || "A";
}

export function normalizeRouteCell(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
}

export function normalizeRouteSheet(sheet) {
  const columnCount = Math.max(1, Math.min(Number(sheet?.columnCount) || 1, 50));
  const rows = Array.isArray(sheet?.rows) ? sheet.rows : [];
  return {
    ...sheet,
    columnCount,
    rows: rows.map(row => {
      const source = Array.isArray(row) ? row : (Array.isArray(row?.cells) ? row.cells : []);
      return { cells: Array.from({ length: columnCount }, (_, index) => normalizeRouteCell(source[index])) };
    }),
  };
}

export function routeSelectionBounds(selection) {
  if (!selection?.anchor || !selection?.focus) return null;
  return {
    rowStart: Math.min(selection.anchor.row, selection.focus.row),
    rowEnd: Math.max(selection.anchor.row, selection.focus.row),
    colStart: Math.min(selection.anchor.col, selection.focus.col),
    colEnd: Math.max(selection.anchor.col, selection.focus.col),
  };
}

export function isRouteCellSelected(selection, row, col) {
  const bounds = routeSelectionBounds(selection);
  return Boolean(bounds
    && row >= bounds.rowStart
    && row <= bounds.rowEnd
    && col >= bounds.colStart
    && col <= bounds.colEnd);
}

export function routeSelectionToText(sheet, selection) {
  const bounds = routeSelectionBounds(selection);
  if (!bounds) return "";
  const normalized = normalizeRouteSheet(sheet);
  const lines = [];
  for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
    const values = [];
    for (let col = bounds.colStart; col <= bounds.colEnd; col += 1) {
      values.push(String(normalized.rows[row]?.cells?.[col] ?? ""));
    }
    lines.push(values.join("\t"));
  }
  return lines.join("\r\n");
}

export function countRouteSelectionCells(selection) {
  const bounds = routeSelectionBounds(selection);
  if (!bounds) return 0;
  return (bounds.rowEnd - bounds.rowStart + 1) * (bounds.colEnd - bounds.colStart + 1);
}

export function findRouteMatches(sheet, query) {
  const needle = String(query || "").trim().toLocaleLowerCase("vi");
  if (!needle) return [];
  const normalized = normalizeRouteSheet(sheet);
  const matches = [];
  normalized.rows.forEach((row, rowIndex) => {
    row.cells.forEach((value, colIndex) => {
      if (String(value ?? "").toLocaleLowerCase("vi").includes(needle)) {
        matches.push({ row: rowIndex, col: colIndex });
      }
    });
  });
  return matches;
}

export function updateRouteCell(sheet, rowIndex, colIndex, value) {
  const normalized = normalizeRouteSheet(sheet);
  const rows = normalized.rows.map(row => ({ cells: [...row.cells] }));
  while (rows.length <= rowIndex) rows.push({ cells: Array(normalized.columnCount).fill("") });
  rows[rowIndex].cells[colIndex] = normalizeRouteCell(value);
  return { ...normalized, rows };
}

export function insertRouteRow(sheet, afterRow = -1) {
  const normalized = normalizeRouteSheet(sheet);
  const rows = normalized.rows.map(row => ({ cells: [...row.cells] }));
  const index = Math.max(0, Math.min(afterRow + 1, rows.length));
  rows.splice(index, 0, { cells: Array(normalized.columnCount).fill("") });
  return { ...normalized, rows };
}

export function deleteRouteRow(sheet, rowIndex) {
  const normalized = normalizeRouteSheet(sheet);
  if (rowIndex < 0 || rowIndex >= normalized.rows.length) return normalized;
  const rows = normalized.rows.map(row => ({ cells: [...row.cells] }));
  rows.splice(rowIndex, 1);
  return { ...normalized, rows };
}

export function insertRouteColumn(sheet, afterCol = -1) {
  const normalized = normalizeRouteSheet(sheet);
  if (normalized.columnCount >= 50) throw new Error("Mỗi sheet tối đa 50 cột");
  const index = Math.max(0, Math.min(afterCol + 1, normalized.columnCount));
  const rows = normalized.rows.map(row => {
    const cells = [...row.cells];
    cells.splice(index, 0, "");
    return { cells };
  });
  return { ...normalized, columnCount: normalized.columnCount + 1, rows };
}

export function deleteRouteColumn(sheet, colIndex) {
  const normalized = normalizeRouteSheet(sheet);
  if (normalized.columnCount <= 1) throw new Error("Sheet phải còn ít nhất 1 cột");
  if (colIndex < 0 || colIndex >= normalized.columnCount) return normalized;
  const rows = normalized.rows.map(row => {
    const cells = [...row.cells];
    cells.splice(colIndex, 1);
    return { cells };
  });
  return { ...normalized, columnCount: normalized.columnCount - 1, rows };
}

export function routeSheetPayload(sheet) {
  const normalized = normalizeRouteSheet(sheet);
  return {
    name: String(normalized.name || "").trim(),
    sortOrder: Number(normalized.sortOrder) || 999,
    columnCount: normalized.columnCount,
    rows: normalized.rows.map(row => ({ cells: row.cells.map(normalizeRouteCell) })),
  };
}
