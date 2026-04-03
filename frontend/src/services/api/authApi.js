import { apiClient } from "./apiClient";
import {
  clearStoredSession,
  getStoredSessionSnapshot,
  setStoredSession,
} from "../../router/session";
import {
  normalizeAuthSession,
  normalizeLoginPayload,
} from "./resourceAdapters";

export async function login(credentials) {
  const response = await apiClient.post("/api/auth/login", normalizeLoginPayload(credentials));
  const session = normalizeAuthSession(response.data);

  setStoredSession(session);

  return session;
}

export async function getCurrentSession() {
  const { token: persistedToken } = getStoredSessionSnapshot();
  const response = await apiClient.get("/api/auth/me");
  const session = normalizeAuthSession({
    token: persistedToken || null,
    usuario: response.data?.usuario || null,
  });

  setStoredSession({
    token: persistedToken || session.token || undefined,
    usuario: session.usuario,
  });

  return session;
}

export function logout() {
  clearStoredSession();
}

export async function checkAdminAccess() {
  const response = await apiClient.get("/api/auth/admin-check");
  return response.data?.authorized === true;
}
