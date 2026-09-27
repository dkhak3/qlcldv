export function countNoAnswerEmployeeNames(rows = []) {
  return rows.reduce((total, row) => {
    const names = String(row?.noAnswerEmployee || "")
      .split(",")
      .map(name => name.trim())
      .filter(Boolean);
    return total + names.length;
  }, 0);
}
