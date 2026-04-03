const AUTH_TOKEN_STORAGE_KEY = "free-chat-token";
const AUTH_USER_STORAGE_KEY = "free-chat-user";
const AUTH_SESSION_VERSION = 1;

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function hasStoredSession() {
  return Boolean(getStoredSessionSnapshot().autenticado);
}

function sanitizeToken(token) {
  if (typeof token !== "string") {
    return null;
  }

  const normalizedToken = token.trim();
  return normalizedToken || null;
}

function sanitizeUser(usuario) {
  if (!usuario || typeof usuario !== "object") {
    return null;
  }

  if (!usuario.id || !usuario.nomeCompleto || !usuario.papel) {
    return null;
  }

  return {
    id: usuario.id,
    nomeCompleto: usuario.nomeCompleto,
    papel: usuario.papel,
    status: usuario.status || null,
  };
}

function readRawStoredUser(storage) {
  const rawUser = storage.getItem(AUTH_USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

function clearStoredKeys(storage) {
  storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  storage.removeItem(AUTH_USER_STORAGE_KEY);
}

function writeStoredKeys(storage, { token, usuario }) {
  if (token) {
    storage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  if (usuario) {
    storage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({
        ...usuario,
        _sessionVersion: AUTH_SESSION_VERSION,
      }),
    );
  } else {
    storage.removeItem(AUTH_USER_STORAGE_KEY);
  }
}

function readControlledSession() {
  const storage = getStorage();

  if (!storage) {
    return {
      token: null,
      usuario: null,
      autenticado: false,
      administrador: false,
    };
  }

  const rawToken = storage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const rawUser = storage.getItem(AUTH_USER_STORAGE_KEY);
  const token = sanitizeToken(rawToken);
  const usuario = sanitizeUser(readRawStoredUser(storage));

  if (!token && !usuario) {
    clearStoredKeys(storage);
    return {
      token: null,
      usuario: null,
      autenticado: false,
      administrador: false,
    };
  }

  const normalizedRawUser = usuario
    ? JSON.stringify({
        ...usuario,
        _sessionVersion: AUTH_SESSION_VERSION,
      })
    : null;

  if (rawToken !== token || rawUser !== normalizedRawUser) {
    writeStoredKeys(storage, { token, usuario });
  }

  return {
    token,
    usuario,
    autenticado: Boolean(token),
    administrador: Boolean(token && usuario?.papel === "ADMIN"),
  };
}

export function getStoredToken() {
  return readControlledSession().token;
}

export function setStoredSession({ token, usuario }) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  writeStoredKeys(storage, {
    token: sanitizeToken(token),
    usuario: sanitizeUser(usuario),
  });
}

export function getStoredUser() {
  return readControlledSession().usuario;
}

export function hasAdminSession() {
  return readControlledSession().administrador;
}

export function clearStoredSession() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  clearStoredKeys(storage);
}

export function getStoredSessionSnapshot() {
  return readControlledSession();
}

export { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY };
