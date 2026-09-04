import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore, isFirebaseConfigured } from "../lib/firebaseClient";
import { DEFAULT_REPORT_BOXES, isCoreReportBox } from "../data/reportBoxes";

function toIso(value) {
  if (!value) return "";
  return value.toDate ? value.toDate().toISOString() : String(value);
}

function mapBox(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    key: data.key || snapshot.id,
    slug: data.slug || snapshot.id,
    title: data.title || "Báo cáo tuần",
    description: data.description || "",
    route: data.route || `/bao-cao/${data.slug || snapshot.id}`,
    externalUrl: data.externalUrl || "",
    videoUrl: data.videoUrl || "",
    appearance: data.appearance || "orange",
    icon: data.icon || "file-spreadsheet",
    hidden: Boolean(data.hidden),
    sortOrder: Number(data.sortOrder) || 99,
    system: Boolean(data.system),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getReportBoxes() {
  if (!isFirebaseConfigured || !firestore) return DEFAULT_REPORT_BOXES;
  try {
    const snapshots = await getDocs(collection(firestore, "report_boxes"));
    const stored = snapshots.docs.map(mapBox);
    const storedByKey = new Map(stored.map(item => [item.key, item]));
    const defaults = DEFAULT_REPORT_BOXES.map(item => storedByKey.has(item.key) ? { ...item, ...storedByKey.get(item.key), system: true } : item);
    const defaultKeys = new Set(DEFAULT_REPORT_BOXES.map(item => item.key));
    return [...defaults, ...stored.filter(item => !defaultKeys.has(item.key))].sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    console.warn("Không thể đồng bộ Box báo cáo từ Firebase; đang dùng dữ liệu mặc định.", error);
    return DEFAULT_REPORT_BOXES;
  }
}

export async function getReportBoxByKey(key) {
  const boxes = await getReportBoxes();
  return boxes.find(item => item.key === key) || null;
}

export async function getReportBoxBySlug(slug) {
  const boxes = await getReportBoxes();
  return boxes.find(item => item.slug === slug) || null;
}

function payload(box) {
  return {
    key: box.key,
    slug: box.slug,
    title: box.title.trim(),
    description: box.description.trim(),
    route: `/bao-cao/${box.slug}`,
    externalUrl: box.externalUrl?.trim() || "",
    videoUrl: box.videoUrl?.trim() || "",
    appearance: box.appearance || "orange",
    icon: box.icon || "file-spreadsheet",
    hidden: Boolean(box.hidden),
    sortOrder: Number(box.sortOrder) || 99,
    system: Boolean(box.system),
    updatedAt: serverTimestamp(),
  };
}

export async function saveReportBox(box) {
  if (box.id) {
    await setDoc(doc(firestore, "report_boxes", box.id), payload(box), { merge: true });
    return { ...box, updatedAt: new Date().toISOString() };
  }
  const reference = await addDoc(collection(firestore, "report_boxes"), payload(box));
  return { ...box, id: reference.id, updatedAt: new Date().toISOString() };
}

export async function deleteReportBox(box) {
  if (!box?.id) throw new Error("Không xác định được Box cần xóa");
  if (isCoreReportBox(box)) throw new Error("Không thể xóa 5 Box báo cáo chính");
  await deleteDoc(doc(firestore, "report_boxes", box.id));
}
