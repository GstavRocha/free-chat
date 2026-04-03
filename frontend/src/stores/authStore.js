import { defineStore } from "pinia";
import { ApiClientError, setUnauthorizedHandler } from "../services/api/apiClient";
import {
  getCurrentSession,
  login as loginRequest,
  logout as logoutSession,
} from "../services/api/authApi";
import { getStoredSessionSnapshot, getStoredToken } from "../router/session";

function getInitialState() {
  return {
    status: "NAO_AUTENTICADO",
    token: null,
    user: null,
    errorMessage: null,
    initialized: false,
  };
}

function mapAuthErrorCodeToStatus(code) {
  if (code === "USER_PENDING_APPROVAL") {
    return "PENDENTE_APROVACAO";
  }

  if (code === "USER_REJECTED") {
    return "REJEITADO";
  }

  if (code === "USER_BLOCKED") {
    return "BLOQUEADO";
  }

  return "ERRO_AUTENTICACAO";
}

function mapProtectedAccessErrorToStatus(error) {
  if (!(error instanceof ApiClientError)) {
    return {
      status: "SESSAO_EXPIRADA",
      message: "Sua sessão expirou. Faça login novamente.",
    };
  }

  if (error.code === "AUTH_USER_NOT_APPROVED") {
    if (error.details?.status === "BLOQUEADO") {
      return {
        status: "BLOQUEADO",
        message: error.message || "Seu acesso foi bloqueado e a sessão atual foi encerrada.",
      };
    }

    if (error.details?.status === "REJEITADO") {
      return {
        status: "REJEITADO",
        message: error.message || "Seu acesso foi rejeitado e a sessão atual foi encerrada.",
      };
    }

    if (error.details?.status === "PENDENTE") {
      return {
        status: "PENDENTE_APROVACAO",
        message: error.message || "Seu acesso ainda depende de aprovação administrativa.",
      };
    }
  }

  return {
    status: "SESSAO_EXPIRADA",
    message: error.message || "Sua sessão expirou. Faça login novamente.",
  };
}

export const useAuthStore = defineStore("auth", {
  state: () => getInitialState(),
  getters: {
    isAuthenticated: (state) => state.status === "AUTENTICADO",
    isAdmin: (state) => state.user?.papel === "ADMIN",
    hasStoredToken: () => Boolean(getStoredToken()),
  },
  actions: {
    async initialize() {
      this.hydrateFromStorage();

      setUnauthorizedHandler((error) => {
        this.handleProtectedAccessFailure(error);
      });

      if (!this.hasStoredToken) {
        return null;
      }

      try {
        return await this.restoreSession();
      } catch {
        return null;
      }
    },
    hydrateFromStorage() {
      const snapshot = getStoredSessionSnapshot();
      const token = getStoredToken();

      this.token = token;
      this.user = snapshot.usuario;
      this.errorMessage = null;
      this.initialized = true;
      this.status = snapshot.autenticado && snapshot.usuario ? "AUTENTICADO" : "NAO_AUTENTICADO";
    },
    async restoreSession() {
      const persistedToken = getStoredToken();

      if (!persistedToken) {
        this.status = "NAO_AUTENTICADO";
        this.token = null;
        this.user = null;
        this.errorMessage = null;
        this.initialized = true;
        return null;
      }

      try {
        const session = await getCurrentSession();

        this.token = session.token || persistedToken;
        this.user = session.usuario;
        this.status = session.usuario && this.token ? "AUTENTICADO" : "NAO_AUTENTICADO";
        this.errorMessage = null;
        this.initialized = true;

        return session;
      } catch (error) {
        this.handleAuthFailure(error);
        throw error;
      }
    },
    async login(credentials) {
      logoutSession();
      this.status = "AUTENTICANDO";
      this.token = null;
      this.user = null;
      this.errorMessage = null;

      try {
        const session = await loginRequest(credentials);

        this.token = session.token;
        this.user = session.usuario;
        this.status = "AUTENTICADO";
        this.errorMessage = null;
        this.initialized = true;

        return session;
      } catch (error) {
        this.handleAuthFailure(error);
        throw error;
      }
    },
    logout() {
      logoutSession();

      this.status = "NAO_AUTENTICADO";
      this.token = null;
      this.user = null;
      this.errorMessage = null;
      this.initialized = true;
    },
    markSessionExpired(message = "Sessão expirada.") {
      logoutSession();

      this.status = "SESSAO_EXPIRADA";
      this.token = null;
      this.user = null;
      this.errorMessage = message;
      this.initialized = true;
    },
    handleProtectedAccessFailure(error) {
      const nextState = mapProtectedAccessErrorToStatus(error);

      logoutSession();

      this.status = nextState.status;
      this.token = null;
      this.user = null;
      this.errorMessage = nextState.message;
      this.initialized = true;
    },
    handleAuthFailure(error) {
      const status = error instanceof ApiClientError ? mapAuthErrorCodeToStatus(error.code) : "ERRO_AUTENTICACAO";

      logoutSession();

      this.status = status;
      this.token = null;
      this.user = null;
      this.errorMessage =
        error instanceof Error ? error.message : "Não foi possível concluir a autenticação.";
      this.initialized = true;
    },
    clearFeedback() {
      if (this.status !== "AUTENTICADO" && this.status !== "AUTENTICANDO") {
        this.status = "NAO_AUTENTICADO";
      }

      this.errorMessage = null;
    },
  },
});
