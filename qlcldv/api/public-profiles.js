import { adminDb, onlyPost, parseBody, requireRole, sendApiError } from "./_firebaseAdmin.js";

const MAX_PROFILE_IDS = 100;

function cleanIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map(item => String(item || "").trim())
    .filter(item => item && item.length <= 128))]
    .slice(0, MAX_PROFILE_IDS);
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  try {
    await requireRole(req, ["user", "admin", "superadmin"]);
    const ids = cleanIds(parseBody(req).ids);
    if (!ids.length) return res.status(200).json({ ok: true, profiles: [] });

    const snapshots = await Promise.all(ids.map(id => adminDb.collection("users").doc(id).get()));
    const profiles = snapshots
      .filter(snapshot => snapshot.exists)
      .map(snapshot => {
        const data = snapshot.data() || {};
        return {
          id: snapshot.id,
          fullName: String(data.fullName || data.username || "Người dùng QLCL-DV").trim(),
          role: ["user", "admin", "superadmin"].includes(data.role) ? data.role : "user",
        };
      });

    return res.status(200).json({ ok: true, profiles });
  } catch (error) {
    return sendApiError(res, error);
  }
}
