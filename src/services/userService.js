import { authenticatedApi } from "../lib/authenticatedApi";
import { writeAuditLog } from "./auditLogService";

async function invokeUserManager(action, payload = {}) {
  return authenticatedApi("/api/manage-users", { action, payload });
}

export const listManagedUsers = () => invokeUserManager("list").then(data => data.users || []);
export const createManagedUser = async payload => {
  const data = await invokeUserManager("create", payload);
  void writeAuditLog({ action: "create", entityType: "user", entityId: data.user?.id || "", label: data.user?.fullName || payload.fullName, details: { username: data.user?.username || payload.username, role: data.user?.role || payload.role } });
  return data.user;
};
export const updateManagedUser = async payload => {
  const data = await invokeUserManager("update", payload);
  void writeAuditLog({ action: "update", entityType: "user", entityId: payload.id, label: data.user?.fullName || payload.fullName, details: { username: data.user?.username || payload.username, role: data.user?.role || payload.role } });
  return data.user;
};
export const deleteManagedUser = async id => {
  const data = await invokeUserManager("delete", { id });
  void writeAuditLog({ action: "delete", entityType: "user", entityId: id, label: data.user?.fullName || data.username || "Tài khoản" });
  return data;
};
