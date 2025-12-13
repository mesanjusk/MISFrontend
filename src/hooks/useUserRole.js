import { useEffect, useMemo, useState } from "react";
import { ROLE_TYPES, isAdminRole, isOfficeRole, normalizeRole } from "../constants/roles";

const getStoredRole = () =>
  localStorage.getItem("User_group") ||
  localStorage.getItem("Role") ||
  localStorage.getItem("role") ||
  localStorage.getItem("User_role") ||
  "";

const getStoredUser = () => localStorage.getItem("User_name") || "";

export function useUserRole() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setRole(getStoredRole());
    setUserName(getStoredUser());
  }, []);

  const normalizedRole = useMemo(() => normalizeRole(role), [role]);

  const resolvedRole = useMemo(() => {
    if (isAdminRole(role)) return ROLE_TYPES.ADMIN;
    if (isOfficeRole(role)) return ROLE_TYPES.OFFICE;
    return role || ROLE_TYPES.OFFICE;
  }, [role]);

  return {
    role: resolvedRole,
    normalizedRole,
    userName,
    isAdmin: isAdminRole(role),
    isOfficeUser: isOfficeRole(role) || !role,
  };
}
