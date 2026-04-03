import { ApiClientError } from "../services/api/apiClient";

export function isPermissionDeniedError(error) {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  return error.status === 403 || error.code === "FORBIDDEN" || /_FORBIDDEN$/u.test(error.code);
}

export function getPermissionDeniedMessage(
  error,
  fallbackMessage = "Você não tem permissão para executar esta ação.",
) {
  if (!isPermissionDeniedError(error)) {
    return fallbackMessage;
  }

  return error.message || fallbackMessage;
}
