import { authenticatedApi } from "../lib/authenticatedApi";

export async function getPublicProfiles(ids) {
  const uniqueIds = [...new Set((ids || []).map(id => String(id || "").trim()).filter(Boolean))];
  if (!uniqueIds.length) return new Map();
  const result = await authenticatedApi("/api/public-profiles", { ids: uniqueIds });
  return new Map((result.profiles || []).map(profile => [profile.id, profile]));
}

export async function getPublicProfile(id) {
  const profiles = await getPublicProfiles([id]);
  return profiles.get(id) || null;
}
