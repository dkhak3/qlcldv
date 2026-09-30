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

export function normalizeRouteFill(value) {
  const match = String(value || "").trim().match(/^#?([0-9a-f]{6})$/i);
  return match ? `#${match[1].toUpperCase()}` : "";
}

export function routeCellStyleKey(row, col) {
  return `${Number(row)}:${Number(col)}`;
}

function parseRouteCellStyleKey(key) {
  const match = String(key || "").match(/^(\d+):(\d+)$/);
  return match ? { row: Number(match[1]), col: Number(match[2]) } : null;
}

function normalizeRouteCellStyles(styles, rowCount, columnCount) {
  const source = styles && typeof styles === "object" && !Array.isArray(styles) ? styles : {};
  const output = {};
  Object.entries(source).forEach(([key, style]) => {
    const position = parseRouteCellStyleKey(key);
    const fill = normalizeRouteFill(style?.fill);
    if (!position || !fill) return;
    if (position.row < 0 || position.row >= rowCount || position.col < 0 || position.col >= columnCount) return;
    output[routeCellStyleKey(position.row, position.col)] = { fill };
  });
  return output;
}

function normalizeDimensionMap(source, maxIndex, min, max) {
  const input = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  const output = {};
  Object.entries(input).forEach(([key, value]) => {
    const index = Number(key);
    const size = Number(value);
    if (!Number.isInteger(index) || index < 0 || index >= maxIndex || !Number.isFinite(size)) return;
    output[String(index)] = Math.round(Math.max(min, Math.min(max, size)));
  });
  return output;
}

function remapDimensionMap(source, mapper) {
  const output = {};
  Object.entries(source || {}).forEach(([key, value]) => {
    const index = Number(key);
    if (!Number.isInteger(index)) return;
    const nextIndex = mapper(index);
    if (nextIndex == null || nextIndex < 0) return;
    output[String(nextIndex)] = value;
  });
  return output;
}

export function normalizeRouteSheet(sheet) {
  const columnCount = Math.max(1, Math.min(Number(sheet?.columnCount) || 1, 50));
  const rows = Array.isArray(sheet?.rows) ? sheet.rows : [];
  const normalizedRows = rows.map(row => {
    const source = Array.isArray(row) ? row : (Array.isArray(row?.cells) ? row.cells : []);
    return { cells: Array.from({ length: columnCount }, (_, index) => normalizeRouteCell(source[index])) };
  });
  return {
    ...sheet,
    columnCount,
    rows: normalizedRows,
    cellStyles: normalizeRouteCellStyles(sheet?.cellStyles, normalizedRows.length, columnCount),
    columnWidths: normalizeDimensionMap(sheet?.columnWidths, columnCount, 40, 520),
    rowHeights: normalizeDimensionMap(sheet?.rowHeights, normalizedRows.length, 24, 240),
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

export function getRouteCellFill(sheet, row, col) {
  return normalizeRouteFill(sheet?.cellStyles?.[routeCellStyleKey(row, col)]?.fill);
}

export function getRouteColumnWidth(sheet, col, fallback = 120) {
  const custom = Number(sheet?.columnWidths?.[String(col)]);
  return Number.isFinite(custom) ? custom : fallback;
}

export function getRouteRowHeight(sheet, row, fallback = 0) {
  const custom = Number(sheet?.rowHeights?.[String(row)]);
  return Number.isFinite(custom) ? custom : fallback;
}

export function setRouteColumnWidth(sheet, col, width) {
  const normalized = normalizeRouteSheet(sheet);
  if (!Number.isInteger(col) || col < 0 || col >= normalized.columnCount) return normalized;
  const columnWidths = { ...normalized.columnWidths };
  columnWidths[String(col)] = Math.round(Math.max(40, Math.min(520, Number(width) || 40)));
  return { ...normalized, columnWidths };
}

export function setRouteRowHeight(sheet, row, height) {
  const normalized = normalizeRouteSheet(sheet);
  if (!Number.isInteger(row) || row < 0 || row >= normalized.rows.length) return normalized;
  const rowHeights = { ...normalized.rowHeights };
  rowHeights[String(row)] = Math.round(Math.max(24, Math.min(240, Number(height) || 24)));
  return { ...normalized, rowHeights };
}

export function clearRouteColumnWidths(sheet) {
  const normalized = normalizeRouteSheet(sheet);
  return { ...normalized, columnWidths: {} };
}

export function clearRouteRowHeights(sheet) {
  const normalized = normalizeRouteSheet(sheet);
  return { ...normalized, rowHeights: {} };
}

export function getReadableTextColor(fill) {
  const normalized = normalizeRouteFill(fill);
  if (!normalized) return "";
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance >= 150 ? "#0F172A" : "#FFFFFF";
}

export function applyRouteFillToSelection(sheet, selection, fill) {
  const normalized = normalizeRouteSheet(sheet);
  const bounds = routeSelectionBounds(selection);
  if (!bounds) return normalized;

  const nextFill = normalizeRouteFill(fill);
  const cellStyles = { ...normalized.cellStyles };

  for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
    if (row < 0 || row >= normalized.rows.length) continue;
    for (let col = bounds.colStart; col <= bounds.colEnd; col += 1) {
      if (col < 0 || col >= normalized.columnCount) continue;
      const key = routeCellStyleKey(row, col);
      if (nextFill) cellStyles[key] = { fill: nextFill };
      else delete cellStyles[key];
    }
  }

  return { ...normalized, cellStyles };
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

function remapCellStyles(styles, mapper) {
  const output = {};
  Object.entries(styles || {}).forEach(([key, style]) => {
    const position = parseRouteCellStyleKey(key);
    if (!position) return;
    const next = mapper(position);
    if (!next) return;
    output[routeCellStyleKey(next.row, next.col)] = { ...style };
  });
  return output;
}

export function insertRouteRow(sheet, afterRow = -1) {
  const normalized = normalizeRouteSheet(sheet);
  const rows = normalized.rows.map(row => ({ cells: [...row.cells] }));
  const index = Math.max(0, Math.min(afterRow + 1, rows.length));
  rows.splice(index, 0, { cells: Array(normalized.columnCount).fill("") });
  const cellStyles = remapCellStyles(normalized.cellStyles, position => ({
    row: position.row >= index ? position.row + 1 : position.row,
    col: position.col,
  }));
  const rowHeights = remapDimensionMap(normalized.rowHeights, row => row >= index ? row + 1 : row);
  return { ...normalized, rows, cellStyles, rowHeights };
}

export function deleteRouteRow(sheet, rowIndex) {
  const normalized = normalizeRouteSheet(sheet);
  if (rowIndex < 0 || rowIndex >= normalized.rows.length) return normalized;
  const rows = normalized.rows.map(row => ({ cells: [...row.cells] }));
  rows.splice(rowIndex, 1);
  const cellStyles = remapCellStyles(normalized.cellStyles, position => {
    if (position.row === rowIndex) return null;
    return {
      row: position.row > rowIndex ? position.row - 1 : position.row,
      col: position.col,
    };
  });
  const rowHeights = remapDimensionMap(normalized.rowHeights, row => {
    if (row === rowIndex) return null;
    return row > rowIndex ? row - 1 : row;
  });
  return { ...normalized, rows, cellStyles, rowHeights };
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
  const cellStyles = remapCellStyles(normalized.cellStyles, position => ({
    row: position.row,
    col: position.col >= index ? position.col + 1 : position.col,
  }));
  const columnWidths = remapDimensionMap(normalized.columnWidths, col => col >= index ? col + 1 : col);
  return { ...normalized, columnCount: normalized.columnCount + 1, rows, cellStyles, columnWidths };
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
  const cellStyles = remapCellStyles(normalized.cellStyles, position => {
    if (position.col === colIndex) return null;
    return {
      row: position.row,
      col: position.col > colIndex ? position.col - 1 : position.col,
    };
  });
  const columnWidths = remapDimensionMap(normalized.columnWidths, col => {
    if (col === colIndex) return null;
    return col > colIndex ? col - 1 : col;
  });
  return { ...normalized, columnCount: normalized.columnCount - 1, rows, cellStyles, columnWidths };
}

export function routeSheetPayload(sheet) {
  const normalized = normalizeRouteSheet(sheet);
  return {
    name: String(normalized.name || "").trim(),
    sortOrder: Number(normalized.sortOrder) || 999,
    columnCount: normalized.columnCount,
    rows: normalized.rows.map(row => ({ cells: row.cells.map(normalizeRouteCell) })),
    cellStyles: normalized.cellStyles,
    columnWidths: normalized.columnWidths,
    rowHeights: normalized.rowHeights,
  };
}
