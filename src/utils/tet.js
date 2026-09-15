const ZODIAC = [
  { branch: "Tý", name: "Chuột", emoji: "🐭" },
  { branch: "Sửu", name: "Trâu", emoji: "🐂" },
  { branch: "Dần", name: "Hổ", emoji: "🐯" },
  { branch: "Mão", name: "Mèo", emoji: "🐈" },
  { branch: "Thìn", name: "Rồng", emoji: "🐉" },
  { branch: "Tỵ", name: "Rắn", emoji: "🐍" },
  { branch: "Ngọ", name: "Ngựa", emoji: "🐎" },
  { branch: "Mùi", name: "Dê", emoji: "🐐" },
  { branch: "Thân", name: "Khỉ", emoji: "🐒" },
  { branch: "Dậu", name: "Gà", emoji: "🐓" },
  { branch: "Tuất", name: "Chó", emoji: "🐕" },
  { branch: "Hợi", name: "Heo", emoji: "🐖" },
];

const HEAVENLY_STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

export function getDefaultTetYear() {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
}

export function normalizeTetYear(value, fallback = getDefaultTetYear()) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2200 ? parsed : fallback;
}

export function getVietnameseZodiac(year) {
  const normalizedYear = normalizeTetYear(year);
  // Năm 2020 là Canh Tý, dùng làm mốc ổn định cho chu kỳ 12 con giáp Việt Nam.
  return ZODIAC[modulo(normalizedYear - 2020, 12)];
}

export function getCanChiYear(year) {
  const normalizedYear = normalizeTetYear(year);
  // 2024 = Giáp Thìn, tương ứng chỉ số 0 của Thiên Canh theo công thức (year - 4) mod 10.
  const stem = HEAVENLY_STEMS[modulo(normalizedYear - 4, 10)];
  return `${stem} ${getVietnameseZodiac(normalizedYear).branch}`;
}

export function getTetYearOptions(centerYear = getDefaultTetYear()) {
  const center = normalizeTetYear(centerYear);
  return Array.from({ length: 12 }, (_, index) => {
    const year = center - 5 + index;
    return { year, ...getVietnameseZodiac(year), canChi: getCanChiYear(year) };
  });
}
