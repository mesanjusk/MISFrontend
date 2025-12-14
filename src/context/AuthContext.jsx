import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ROLE_TYPES, isAdminRole, isOfficeRole, normalizeRole } from "../constants/roles";

const STORAGE_KEYS = {
  userName: "User_name",
  userGroup: "User_group",
  mobileNumber: "Mobile_number",
  role: "Role",
  roleFallback: "role",
  userRoleLegacy: "User_role",
};

const TOKEN_KEYS = ["token", "authToken", "access_token", "ACCESS_TOKEN"];

const pickFirst = (keys) => keys.map((key) => localStorage.getItem(key)).find(Boolean) || "";

const initialAuthState = () => ({
  userName: pickFirst([STORAGE_KEYS.userName]),
  userGroup: pickFirst([
    STORAGE_KEYS.userGroup,
    STORAGE_KEYS.role,
    STORAGE_KEYS.roleFallback,
    STORAGE_KEYS.userRoleLegacy,
  ]),
  mobileNumber: pickFirst([STORAGE_KEYS.mobileNumber]),
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialAuthState);

  const persistState = useCallback((nextState) => {
    const { userName, userGroup, mobileNumber } = nextState;
    if (userName) localStorage.setItem(STORAGE_KEYS.userName, userName);
    else localStorage.removeItem(STORAGE_KEYS.userName);

    if (userGroup) {
      localStorage.setItem(STORAGE_KEYS.userGroup, userGroup);
      localStorage.setItem(STORAGE_KEYS.role, userGroup);
      localStorage.setItem(STORAGE_KEYS.roleFallback, userGroup);
      localStorage.setItem(STORAGE_KEYS.userRoleLegacy, userGroup);
    } else {
      localStorage.removeItem(STORAGE_KEYS.userGroup);
      localStorage.removeItem(STORAGE_KEYS.role);
      localStorage.removeItem(STORAGE_KEYS.roleFallback);
      localStorage.removeItem(STORAGE_KEYS.userRoleLegacy);
    }

    if (mobileNumber) localStorage.setItem(STORAGE_KEYS.mobileNumber, mobileNumber);
    else localStorage.removeItem(STORAGE_KEYS.mobileNumber);
  }, []);

  const setAuthData = useCallback((updates) => {
    setAuthState((prev) => {
      const next = { ...prev, ...updates };
      persistState(next);
      return next;
    });
  }, [persistState]);

  const clearAuth = useCallback(() => {
    setAuthState({ userName: "", userGroup: "", mobileNumber: "" });
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  }, []);

  const normalizedRole = useMemo(() => normalizeRole(authState.userGroup), [authState.userGroup]);

  const value = useMemo(
    () => ({
      ...authState,
      normalizedRole,
      role: authState.userGroup || ROLE_TYPES.OFFICE,
      isAdmin: isAdminRole(authState.userGroup),
      isOfficeUser: isOfficeRole(authState.userGroup) || !authState.userGroup,
      setAuthData,
      clearAuth,
    }),
    [authState, normalizedRole, setAuthData, clearAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
