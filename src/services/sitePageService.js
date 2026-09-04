import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { DEFAULT_SITE_PAGES } from "../data/sitePages";
import { firestore } from "../lib/firebaseClient";

const mapPage = snapshot => ({ id: snapshot.id, ...snapshot.data(), key: snapshot.data().key || snapshot.id });

export async function getSitePages() {
  const snapshots = await getDocs(collection(firestore, "site_pages"));
  const stored = snapshots.docs.map(mapPage);
  const byKey = new Map(stored.map(item => [item.key, item]));
  return DEFAULT_SITE_PAGES.map(item => ({ ...item, ...byKey.get(item.key) }));
}

export async function saveSitePage(page) {
  const payload = { key: page.key, title: page.title.trim(), slug: page.slug, hidden: Boolean(page.hidden), roles: page.roles, updatedAt: serverTimestamp() };
  await setDoc(doc(firestore, "site_pages", page.key), payload, { merge: true });
  return { ...page, ...payload };
}
