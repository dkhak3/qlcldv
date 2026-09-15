import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "../lib/firebaseClient";
import { getDefaultTetYear, normalizeTetYear } from "../utils/tet";

const SETTINGS_DOC = "_tet_theme";
const SETTINGS_COLLECTION = "site_pages";

export const DEFAULT_TET_THEME_SETTINGS = {
  enabled: false,
  year: getDefaultTetYear(),
};

function normalizeSettings(value = {}) {
  return {
    enabled: Boolean(value.enabled),
    year: normalizeTetYear(value.year, DEFAULT_TET_THEME_SETTINGS.year),
  };
}

export function subscribeTetThemeSettings(onValue, onError) {
  if (!firestore) {
    onValue(DEFAULT_TET_THEME_SETTINGS);
    return () => {};
  }
  return onSnapshot(
    doc(firestore, SETTINGS_COLLECTION, SETTINGS_DOC),
    snapshot => onValue(snapshot.exists() ? normalizeSettings(snapshot.data()) : DEFAULT_TET_THEME_SETTINGS),
    error => onError?.(error),
  );
}

export async function saveTetThemeSettings(settings) {
  if (!firestore) throw new Error("Firebase chưa được cấu hình");
  const normalized = normalizeSettings(settings);
  await setDoc(doc(firestore, SETTINGS_COLLECTION, SETTINGS_DOC), {
    key: SETTINGS_DOC,
    title: "Giao diện Tết",
    slug: SETTINGS_DOC,
    hidden: true,
    roles: ["superadmin"],
    enabled: normalized.enabled,
    year: normalized.year,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return normalized;
}
