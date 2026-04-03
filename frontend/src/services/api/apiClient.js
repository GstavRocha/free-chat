import { getStoredToken } from "../../router/session";

const DEFAULT_API_BASE_URL = "/api";

let unauthorizedHandler = null;

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function isAbsoluteUrl(path) {
  return /^https?:\/\//u.test(path);
}

function buildApiUrl(path) {
  if (!path) {
    return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/api" || normalizedPath.startsWith("/api/")) {
    return normalizedPath;
  }

  return `${normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)}${normalizedPath}`;
}

async function parseResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

function buildHeaders(headers = {}, body) {
  const normalizedHeaders = new Headers(headers);
  const token = getStoredToken();

  if (!normalizedHeaders.has("Accept")) {
    normalizedHeaders.set("Accept", "application/json");
  }

  if (body !== undefined && body !== null && !normalizedHeaders.has("Content-Type")) {
    normalizedHeaders.set("Content-Type", "application/json");
  }

  if (token && !normalizedHeaders.has("Authorization")) {
    normalizedHeaders.set("Authorization", `Bearer ${token}`);
  }

  return normalizedHeaders;
}

function createRequestInit(method, options = {}) {
  const { body, headers, ...rest } = options;
  const init = {
    ...rest,
    method,
    headers: buildHeaders(headers, body),
  };

  if (body !== undefined && body !== null) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  return init;
}

export class ApiClientError extends Error {
  constructor({ status, code, message, details, data }) {
    super(message || "Nao foi possivel concluir a requisicao.");
    this.name = "ApiClientError";
    this.status = status;
    this.code = code || "HTTP_REQUEST_FAILED";
    this.details = details || null;
    this.data = data || null;
  }
}

function buildApiError(response, data) {
  const errorPayload = data?.error;

  return new ApiClientError({
    status: response.status,
    code: errorPayload?.code || `HTTP_${response.status}`,
    message: errorPayload?.message || "Nao foi possivel concluir a requisicao.",
    details: errorPayload?.details || null,
    data,
  });
}

function shouldHandleUnauthorized(error) {
  if (error.status === 401) {
    return true;
  }

  return [
    "AUTH_USER_NOT_APPROVED",
    "AUTH_REQUIRED",
    "AUTH_TOKEN_MISSING",
    "AUTH_TOKEN_INVALID_FORMAT",
    "AUTH_TOKEN_INVALID",
  ].includes(error.code);
}

async function handleUnauthorized(error) {
  if (typeof unauthorizedHandler === "function" && shouldHandleUnauthorized(error)) {
    await unauthorizedHandler(error);
  }
}

async function request(method, path, options = {}) {
  const response = await fetch(buildApiUrl(path), createRequestInit(method, options));
  const data = await parseResponseBody(response);

  if (!response.ok) {
    const error = buildApiError(response, data);
    await handleUnauthorized(error);
    throw error;
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export const apiClient = {
  request,
  get(path, options) {
    return request("GET", path, options);
  },
  post(path, body, options = {}) {
    return request("POST", path, { ...options, body });
  },
  patch(path, body, options = {}) {
    return request("PATCH", path, { ...options, body });
  },
  delete(path, options) {
    return request("DELETE", path, options);
  },
};
