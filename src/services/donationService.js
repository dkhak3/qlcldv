import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../lib/firebaseClient";
import { writeAuditLog } from "./auditLogService";

const DONATION_SETTINGS_COLLECTION = "donation_settings";
const DONATION_SETTINGS_DOCUMENT = "general";

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
  if (account.id) { await updateDoc(doc(firestore, "donation_accounts", account.id), payload(account)); void writeAuditLog({ action: "update", entityType: "donation_account", entityId: account.id, label: account.bankName || account.methodType }); return { ...account, ...payload(account) }; }
  const reference = await addDoc(collection(firestore, "donation_accounts"), { ...payload(account), createdAt: serverTimestamp() });
  void writeAuditLog({ action: "create", entityType: "donation_account", entityId: reference.id, label: account.bankName || account.methodType });
  return { ...account, id: reference.id };
}

export async function deleteDonationAccount(id) {
  await deleteDoc(doc(firestore, "donation_accounts", id));
  void writeAuditLog({ action: "delete", entityType: "donation_account", entityId: id, label: "Tài khoản Donate" });
}

export async function getDonationSettings() {
  const snapshot = await getDoc(doc(firestore, DONATION_SETTINGS_COLLECTION, DONATION_SETTINGS_DOCUMENT));
  return {
    hidden: snapshot.exists() ? Boolean(snapshot.data().hidden) : false,
    updatedAt: snapshot.data()?.updatedAt?.toDate?.()?.toISOString?.() || "",
  };
}

export async function setDonationVisibility(hidden) {
  const nextSettings = {
    hidden: Boolean(hidden),
    updatedAt: serverTimestamp(),
  };
  await setDoc(
    doc(firestore, DONATION_SETTINGS_COLLECTION, DONATION_SETTINGS_DOCUMENT),
    nextSettings,
    { merge: true },
  );
  void writeAuditLog({ action: "visibility", entityType: "donation_settings", entityId: DONATION_SETTINGS_DOCUMENT, label: "Donate", details: { hidden: nextSettings.hidden } });
  return { hidden: nextSettings.hidden };
}
