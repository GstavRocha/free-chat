import { ApiClientError } from "./apiClient";

export function isApiServerError(error) {
  return error instanceof ApiClientError && error.status >= 500;
}

export function isApiNetworkError(error) {
  return !(error instanceof ApiClientError) && error instanceof Error;
}

export function getRequestErrorMessage(
  error,
  fallbackMessage = "Não foi possível concluir a operação.",
) {
  if (error instanceof ApiClientError) {
    if (error.status >= 500) {
      return "O servidor não conseguiu concluir a operação. Tente novamente em instantes.";
    }

    return error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return "Não foi possível conectar ao servidor. Tente novamente em instantes.";
  }

  return fallbackMessage;
}
