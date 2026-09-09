import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, updatePassword as firebaseUpdatePassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firestore, isFirebaseConfigured, usernameToInternalEmail } from "./lib/firebaseClient";

const AuthContext = createContext(null);

function mapProfile(snapshot, user, role) {
  const data = snapshot?.exists() ? snapshot.data() : {};
  return {
    id: user.uid,
    username: data.username || user.email?.split("@")[0] || "",
    fullName: data.fullName || user.displayName || "",
    role: data.role || role || "user",
    createdAt: data.createdAt?.toDate?.().toISOString?.() || data.createdAt || "",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async currentUser => {
    if (!currentUser || !firestore) {
      setProfile(null);
      return null;
    }
    try {
      const [token, snapshot] = await Promise.all([
        currentUser.getIdTokenResult(true),
        getDoc(doc(firestore, "users", currentUser.uid)),
      ]);
      const nextProfile = mapProfile(snapshot, currentUser, token.claims.role);
      setProfile(nextProfile);
      setError("");
      return nextProfile;
    } catch (profileError) {
      setProfile(null);
      setError(profileError.message || "Không thể tải thông tin tài khoản");
      return null;
    }
  }, []);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(firebaseAuth, async nextUser => {
      setLoading(true);
      setUser(nextUser);
      await loadProfile(nextUser);
      setLoading(false);
    });
  }, [loadProfile]);

  const role = profile?.role || "user";
  const value = useMemo(() => ({
    configured: isFirebaseConfigured,
    user,
    profile,
    role,
    loading,
    error,
    canManageBlog: role === "admin" || role === "superadmin",
    canManageUsers: role === "admin" || role === "superadmin",
    canManageReports: role === "admin" || role === "superadmin",
    canManageDonate: role === "admin" || role === "superadmin",
    isSuperAdmin: role === "superadmin",
    refreshProfile: () => loadProfile(user),
    signIn: async (username, password) => {
      if (!firebaseAuth) throw new Error("Firebase chưa được cấu hình");
      setLoading(true);
      try {
        const credential = await signInWithEmailAndPassword(firebaseAuth, usernameToInternalEmail(username), password);
        setUser(credential.user);
        await loadProfile(credential.user);
        return credential;
      } finally {
        setLoading(false);
      }
    },
    signOut: async () => {
      if (firebaseAuth) await firebaseSignOut(firebaseAuth);
    },
    updatePassword: async password => {
      if (!firebaseAuth?.currentUser) throw new Error("Phiên đăng nhập đã hết hạn");
      await firebaseUpdatePassword(firebaseAuth.currentUser, password);
    },
  }), [error, loadProfile, loading, profile, role, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  return context;
}
