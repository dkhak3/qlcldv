import { useTetTheme } from "../TetThemeContext";

const blossoms = [
  ["8%", "13%", "0s", "1.05"],
  ["18%", "38%", "1.8s", ".8"],
  ["86%", "18%", ".7s", "1"],
  ["94%", "48%", "2.6s", ".72"],
  ["5%", "69%", "3.2s", ".75"],
  ["91%", "76%", "1.2s", ".92"],
];

export function TetThemeBanner() {
  const tet = useTetTheme();
  if (!tet.enabled) return null;
  return <div className="tet-top-banner" role="status">
    <span className="tet-banner-flower" aria-hidden="true">🌸</span>
    <span className="truncate"><b>Tết {tet.year}</b> · {tet.canChi} · Linh vật {tet.zodiac.emoji} {tet.zodiac.name}</span>
    <span className="hidden sm:inline">· Chúc mừng năm mới, vạn sự như ý</span>
    <span className="tet-banner-flower" aria-hidden="true">🌼</span>
  </div>;
}

export default function TetThemeDecor() {
  const tet = useTetTheme();
  if (!tet.enabled) return null;
  return <div className="tet-decor-layer" aria-hidden="true">
    <div className="tet-lantern tet-lantern-left"><span>Lộc</span></div>
    <div className="tet-lantern tet-lantern-right"><span>Phúc</span></div>
    <div className="tet-mascot-badge">
      <span className="tet-mascot-emoji">{tet.zodiac.emoji}</span>
      <span className="tet-mascot-copy">{tet.canChi}<small>{tet.year}</small></span>
    </div>
    {blossoms.map(([left, top, delay, scale], index) => <span
      key={`${left}-${top}`}
      className="tet-floating-blossom"
      style={{ left, top, animationDelay: delay, transform: `scale(${scale})` }}
    >{index % 2 ? "🌼" : "🌸"}</span>)}
  </div>;
}
