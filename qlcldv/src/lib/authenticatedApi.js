import { firebaseAuth } from "./firebaseClient";

export async function authenticatedApi(path, payload) {
  const user = firebaseAuth?.currentUser;
  if (!user) throw new Error("Phiên đăng nhập đã hết hạn");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || "Không thể kết nối máy chủ");
  return data;
}
