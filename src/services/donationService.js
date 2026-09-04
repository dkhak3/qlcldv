import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { firestore } from "../lib/firebaseClient";

const mapAccount = snapshot => ({
  methodType: "bank",
  branch: "",
  ...snapshot.data(),
  id: snapshot.id,
  updatedAt: snapshot.data().updatedAt?.toDate?.()?.toISOString?.() || "",
});

export async function getDonationAccounts() {
  const snapshots = await getDocs(collection(firestore, "donation_accounts"));
  return snapshots.docs.map(mapAccount).sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
}

function payload(account) {
  return {
    methodType: account.methodType || "bank",
    bankName: account.bankName.trim(),
    accountNumber: account.accountNumber.trim(),
    accountName: account.accountName.trim().toUpperCase(),
    branch: account.branch?.trim() || "",
    note: account.note?.trim() || "",
    qrUrl: account.qrUrl?.trim() || "",
    sortOrder: Number(account.sortOrder) || 99,
    hidden: Boolean(account.hidden),
    updatedAt: serverTimestamp(),
  };
}

export async function saveDonationAccount(account) {
  if (account.id) { await updateDoc(doc(firestore, "donation_accounts", account.id), payload(account)); return { ...account, ...payload(account) }; }
  const reference = await addDoc(collection(firestore, "donation_accounts"), { ...payload(account), createdAt: serverTimestamp() });
  return { ...account, id: reference.id };
}

export async function deleteDonationAccount(id) {
  await deleteDoc(doc(firestore, "donation_accounts", id));
}
