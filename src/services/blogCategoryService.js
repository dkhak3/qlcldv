import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../lib/firebaseClient";

export const DEFAULT_BLOG_CATEGORIES = ["Excel", "Dữ liệu", "Quy trình", "Báo cáo", "Năng suất"];
const mapCategory = snapshot => ({ id: snapshot.id, name: snapshot.data().name || "Khác" });

export async function getBlogCategories() {
  const snapshots = await getDocs(collection(firestore, "blog_categories"));
  const initialized = snapshots.docs.some(item => item.id === "__initialized__");
  const categories = snapshots.docs.filter(item => item.id !== "__initialized__").map(mapCategory).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  if (categories.length) return categories;
  if (initialized) return [];
  const seeded = await Promise.all(DEFAULT_BLOG_CATEGORIES.map(createBlogCategory));
  await setDoc(doc(firestore, "blog_categories", "__initialized__"), { initialized: true, createdAt: serverTimestamp() });
  return seeded;
}

export async function createBlogCategory(name) {
  const cleanName = String(name || "").replace(/\s+/g, " ").trim();
  if (!cleanName) throw new Error("Tên chuyên mục không được để trống");
  const reference = await addDoc(collection(firestore, "blog_categories"), { name: cleanName, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return { id: reference.id, name: cleanName };
}

export async function updateBlogCategory(id, name) {
  const cleanName = String(name || "").replace(/\s+/g, " ").trim();
  if (!cleanName) throw new Error("Tên chuyên mục không được để trống");
  await updateDoc(doc(firestore, "blog_categories", id), { name: cleanName, updatedAt: serverTimestamp() });
  return { id, name: cleanName };
}

export async function deleteBlogCategory(id) {
  await deleteDoc(doc(firestore, "blog_categories", id));
}
