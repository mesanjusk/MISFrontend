/**
 * Auth storage utility
 *
 * Strategy: write to BOTH old keys (User_name, User_group) and new keys
 * (mis_userName, mis_userGroup) so that legacy code across the app that
 * still reads the old keys keeps working without needing mass refactoring.
 */

const TOKEN_KEY = "mis_token";
const LEGACY_TOKEN_KEYS = ["token", "authToken", "access_token", "ACCESS_TOKEN"];

export const STORAGE_KEYS = {
  userName: "mis_userName",
  userGroup: "mis_userGroup",
  mobileNumber: "mis_mobileNumber",
};

// Legacy keys that many pages across the app still read directly
const LEGACY_WRITE_KEYS = {
  userName: "User_name",
  userGroup: "User_group",
  mobileNumber: "Mobile_number",
};

/** Run once on app boot — migrate token only, keep old auth keys intact */
export function migrateAuthStorage() {
  // Migrate token from old keys to mis_token
  const existingNew = localStorage.getItem(TOKEN_KEY);
  if (!existingNew) {
    for (const key of LEGACY_TOKEN_KEYS) {
      const val = localStorage.getItem(key);
      if (val) {
        localStorage.setItem(TOKEN_KEY, val);
        break;
      }
    }
  }
  // Remove old token keys only (not User_name/User_group — still needed by legacy code)
  LEGACY_TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));

  // If new keys are empty but old keys have values, copy them over
  if (!localStorage.getItem(STORAGE_KEYS.userName)) {
    const v = localStorage.getItem(LEGACY_WRITE_KEYS.userName);
    if (v) localStorage.setItem(STORAGE_KEYS.userName, v);
  }
  if (!localStorage.getItem(STORAGE_KEYS.userGroup)) {
    const v = localStorage.getItem(LEGACY_WRITE_KEYS.userGroup);
    if (v) localStorage.setItem(STORAGE_KEYS.userGroup, v);
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Reads the first key that has a value in localStorage */
export function pickFirst(keys) {
  for (const key of keys) {
    if (!key) continue;
    const val = localStorage.getItem(key);
    if (val) return val;
  }
  return "";
}

/** Write auth state to BOTH new and legacy keys so all pages work */
export function persistAuthState(nextState = {}) {
  const { userName = "", userGroup = "", mobileNumber = "" } = nextState;

  // New keys (used by AuthContext)
  if (userName) {
    localStorage.setItem(STORAGE_KEYS.userName, userName);
    localStorage.setItem(LEGACY_WRITE_KEYS.userName, userName);   // legacy: User_name
  } else {
    localStorage.removeItem(STORAGE_KEYS.userName);
    localStorage.removeItem(LEGACY_WRITE_KEYS.userName);
  }

  if (userGroup) {
    localStorage.setItem(STORAGE_KEYS.userGroup, userGroup);
    localStorage.setItem(LEGACY_WRITE_KEYS.userGroup, userGroup); // legacy: User_group
  } else {
    localStorage.removeItem(STORAGE_KEYS.userGroup);
    localStorage.removeItem(LEGACY_WRITE_KEYS.userGroup);
  }

  if (mobileNumber) {
    localStorage.setItem(STORAGE_KEYS.mobileNumber, mobileNumber);
    localStorage.setItem(LEGACY_WRITE_KEYS.mobileNumber, mobileNumber);
  } else {
    localStorage.removeItem(STORAGE_KEYS.mobileNumber);
    localStorage.removeItem(LEGACY_WRITE_KEYS.mobileNumber);
  }
}

export function clearStoredSession() {
  // Clear both new and legacy keys
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  Object.values(LEGACY_WRITE_KEYS).forEach((key) => localStorage.removeItem(key));
  clearStoredToken();
}
