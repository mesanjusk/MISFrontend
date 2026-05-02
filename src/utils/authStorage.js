/**
 * Auth storage utility
 * Consolidates to a single token key and single role key.
 * Includes a one-time migration shim that reads legacy keys on first load.
 */

const TOKEN_KEY = "mis_token";
const LEGACY_TOKEN_KEYS = ["token", "authToken", "access_token", "ACCESS_TOKEN"];

export const STORAGE_KEYS = {
  userName: "mis_userName",
  userGroup: "mis_userGroup",
  mobileNumber: "mis_mobileNumber",
};

const LEGACY_STORAGE_KEYS = {
  userName: ["User_name"],
  userGroup: ["User_group", "Role", "role", "User_role"],
  mobileNumber: ["Mobile_number"],
};

/** Run once on app boot to migrate old keys → new keys and clean up */
export function migrateAuthStorage() {
  // Migrate token
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
  LEGACY_TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));

  // Migrate auth state fields
  for (const [field, legacyKeys] of Object.entries(LEGACY_STORAGE_KEYS)) {
    const newKey = STORAGE_KEYS[field];
    if (!localStorage.getItem(newKey)) {
      for (const lk of legacyKeys) {
        const val = localStorage.getItem(lk);
        if (val) {
          localStorage.setItem(newKey, val);
          break;
        }
      }
    }
    legacyKeys.forEach((lk) => localStorage.removeItem(lk));
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

export function persistAuthState(nextState = {}) {
  const { userName = "", userGroup = "", mobileNumber = "" } = nextState;

  if (userName) localStorage.setItem(STORAGE_KEYS.userName, userName);
  else localStorage.removeItem(STORAGE_KEYS.userName);

  if (userGroup) localStorage.setItem(STORAGE_KEYS.userGroup, userGroup);
  else localStorage.removeItem(STORAGE_KEYS.userGroup);

  if (mobileNumber) localStorage.setItem(STORAGE_KEYS.mobileNumber, mobileNumber);
  else localStorage.removeItem(STORAGE_KEYS.mobileNumber);
}

export function clearStoredSession() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  clearStoredToken();
}
