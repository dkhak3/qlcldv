import { adminDb } from "./_firebaseAdmin.js";

const FALLBACK_YEAR = new Date().getMonth() >= 6 ? new Date().getFullYear() + 1 : new Date().getFullYear();

function normalizeYear(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2200 ? parsed : FALLBACK_YEAR;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Phương thức không được hỗ trợ" });
  }
  try {
    const snapshot = await adminDb.collection("site_pages").doc("_tet_theme").get();
    const data = snapshot.exists ? snapshot.data() : {};
    return res.status(200).json({
      ok: true,
      settings: {
        enabled: Boolean(data.enabled),
        year: normalizeYear(data.year),
      },
    });
  } catch {
    return res.status(200).json({ ok: true, settings: { enabled: false, year: FALLBACK_YEAR } });
  }
}
