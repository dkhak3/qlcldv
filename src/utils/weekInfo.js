const pad = value => String(value).padStart(2, "0");

export const formatDateVi = date => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

export function getWeekInfo(inputDate = new Date()) {
  const today = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

  // Tuần mang số thứ tự và tháng của ngày Chủ Nhật. Nhờ vậy tuần giao tháng
  // 31/08–06/09 là tuần 01 tháng 09, tuần kế tiếp 07/09–13/09 là tuần 02.
  const weekOfMonth = Math.ceil(sunday.getDate() / 7);
  const range = `${pad(monday.getDate())}/${pad(monday.getMonth() + 1)} – ${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)}`;
  const copyRange = `${pad(monday.getDate())}.${pad(monday.getMonth() + 1)} – ${pad(sunday.getDate())}.${pad(sunday.getMonth() + 1)}`;
  const label = `TUẦN ${pad(weekOfMonth)} THÁNG ${pad(sunday.getMonth() + 1)}`;

  return { monday, sunday, range, copyRange, label, copyText: `${label} (${copyRange})` };
}
