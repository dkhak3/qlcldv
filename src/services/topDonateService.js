import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../lib/firebaseClient";

const COLLECTION_NAME = "top_donates";

function toIso(value) {
  if (!value) return "";
  if (value.toDate) return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function mapTopDonate(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    donorName: data.donorName || "Nhà hảo tâm",
    amount: Number(data.amount) || 0,
    message: data.message || "",
    donatedAt: toIso(data.donatedAt || data.createdAt),
    hidden: Boolean(data.hidden),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function sortTopDonates(items) {
  return [...items].sort((a, b) => {
    const amountDifference = Number(b.amount || 0) - Number(a.amount || 0);
    if (amountDifference) return amountDifference;
    return new Date(b.donatedAt || 0) - new Date(a.donatedAt || 0);
  });
}

export function rankTopDonates(items) {
  let rank = 0;
  let previousAmount = null;

  return sortTopDonates(items).map(item => {
    const amount = Number(item.amount || 0);
    if (previousAmount === null || amount !== previousAmount) rank += 1;
    previousAmount = amount;
    return { ...item, rank };
  });
}

export async function getTopDonates({ includeHidden = false } = {}) {
  const snapshots = await getDocs(collection(firestore, COLLECTION_NAME));
  const items = snapshots.docs.map(mapTopDonate);
  return sortTopDonates(includeHidden ? items : items.filter(item => !item.hidden));
}

function makePayload(item) {
  const donorName = String(item.donorName || "").replace(/\s+/g, " ").trim();
  const amount = Number(item.amount);
  const donatedAt = new Date(item.donatedAt);

  if (!donorName) throw new Error("Vui lòng nhập tên người Donate");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Số tiền Donate phải lớn hơn 0");
  if (Number.isNaN(donatedAt.getTime())) throw new Error("Thời gian Donate không hợp lệ");

  return {
    donorName,
    amount: Math.round(amount),
    message: String(item.message || "").replace(/\s+/g, " ").trim(),
    donatedAt: Timestamp.fromDate(donatedAt),
    hidden: Boolean(item.hidden),
    updatedAt: serverTimestamp(),
  };
}

export async function saveTopDonate(item) {
  const payload = makePayload(item);
  const saved = {
    ...item,
    donorName: payload.donorName,
    amount: payload.amount,
    message: payload.message,
    hidden: payload.hidden,
    donatedAt: new Date(item.donatedAt).toISOString(),
  };

  if (item.id) {
    await updateDoc(doc(firestore, COLLECTION_NAME, item.id), payload);
    return saved;
  }

  const reference = await addDoc(collection(firestore, COLLECTION_NAME), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return { ...saved, id: reference.id };
}

export async function setTopDonateVisibility(item, hidden) {
  await updateDoc(doc(firestore, COLLECTION_NAME, item.id), {
    hidden: Boolean(hidden),
    updatedAt: serverTimestamp(),
  });
  return { ...item, hidden: Boolean(hidden) };
}

export async function deleteTopDonate(id) {
  await deleteDoc(doc(firestore, COLLECTION_NAME, id));
}
