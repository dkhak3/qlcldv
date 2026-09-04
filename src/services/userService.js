import { authenticatedApi } from "../lib/authenticatedApi";

async function invokeUserManager(action, payload = {}) {
  return authenticatedApi("/api/manage-users", { action, payload });
}

export const listManagedUsers = () => invokeUserManager("list").then(data => data.users || []);
export const createManagedUser = payload => invokeUserManager("create", payload).then(data => data.user);
export const updateManagedUser = payload => invokeUserManager("update", payload).then(data => data.user);
export const deleteManagedUser = id => invokeUserManager("delete", { id });
