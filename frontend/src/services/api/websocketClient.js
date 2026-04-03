import { getStoredToken } from "../../router/session";

const DEFAULT_WS_PATH = "/ws";
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1200;
const AUTH_FAILURE_CODES = new Set([
  "AUTH_REQUIRED",
  "AUTH_TOKEN_MISSING",
  "AUTH_TOKEN_INVALID_FORMAT",
  "AUTH_TOKEN_INVALID",
  "AUTH_USER_NOT_FOUND",
  "AUTH_USER_NOT_APPROVED",
]);

function getSocketAuthFailureMessage(code) {
  if (code === "AUTH_USER_NOT_APPROVED") {
    return "Sua sessão não está mais autorizada para acessar áreas protegidas.";
  }

  return "Sua sessão expirou. Faça login novamente.";
}

function normalizeSocketAuthFailure(event) {
  const reason = event.reason || null;

  if (event.code !== 1008 || !AUTH_FAILURE_CODES.has(reason)) {
    return null;
  }

  return {
    code: reason,
    message: getSocketAuthFailureMessage(reason),
    details: null,
  };
}

function resolveWebSocketUrl(token) {
  const configuredUrl = import.meta.env.VITE_WS_BASE_URL;

  if (configuredUrl) {
    const url = new URL(configuredUrl);

    if (token) {
      url.searchParams.set("token", token);
    }

    return url.toString();
  }

  if (typeof window === "undefined") {
    throw new Error("Ambiente sem window não pode abrir WebSocket.");
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(`${protocol}//${window.location.host}${DEFAULT_WS_PATH}`);

  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
}

function parseSocketMessage(rawMessage) {
  const payload = JSON.parse(String(rawMessage));

  return {
    tipo: payload.tipo,
    dados: payload.dados || {},
  };
}

export class FrontendWebSocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.manualDisconnect = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.lastConnectOptions = null;
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  connect(options = {}) {
    const token = options.token || getStoredToken();

    if (!token) {
      throw new Error("Token de autenticação ausente para conexão WebSocket.");
    }

    if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
      return this.socket;
    }

    this.clearReconnectTimer();
    this.manualDisconnect = false;
    this.lastConnectOptions = {
      ...options,
      token,
    };

    const socket = new WebSocket(resolveWebSocketUrl(token));

    socket.addEventListener("open", () => {
      this.reconnectAttempts = 0;
      this.emit({
        tipo: "SOCKET_ABERTO",
        dados: null,
      });
    });

    socket.addEventListener("message", (event) => {
      try {
        this.emit(parseSocketMessage(event.data));
      } catch (error) {
        this.emit({
          tipo: "ERRO",
          dados: {
            code: "WS_CLIENT_PARSE_ERROR",
            message: "Não foi possível interpretar a mensagem do servidor.",
            details: {
              originalMessage: String(event.data),
              cause: error.message,
            },
          },
        });
      }
    });

    socket.addEventListener("error", () => {
      this.emit({
        tipo: "SOCKET_ERRO_TECNICO",
        dados: {
          message: "Falha técnica ao estabelecer ou manter o canal em tempo real.",
        },
      });
    });

    socket.addEventListener("close", (event) => {
      const authFailure = normalizeSocketAuthFailure(event);

      if (authFailure) {
        this.emit({
          tipo: "ERRO",
          dados: authFailure,
        });
      }

      this.emit({
        tipo: "SOCKET_FECHADO",
        dados: {
          code: event.code,
          reason: event.reason || null,
          wasClean: event.wasClean,
          manual: this.manualDisconnect,
        },
      });

      if (this.socket === socket) {
        this.socket = null;
      }

      if (!this.manualDisconnect && !authFailure) {
        this.scheduleReconnect();
      }
    });

    this.socket = socket;
    return socket;
  }

  disconnect(code, reason) {
    this.manualDisconnect = true;
    this.clearReconnectTimer();
    this.reconnectAttempts = 0;
    this.lastConnectOptions = null;

    if (!this.socket) {
      return;
    }

    this.socket.close(code, reason);
    this.socket = null;
  }

  clearReconnectTimer() {
    if (!this.reconnectTimer) {
      return;
    }

    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  scheduleReconnect() {
    if (!this.lastConnectOptions || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.emit({
        tipo: "SOCKET_RECONEXAO_ENCERRADA",
        dados: {
          attempts: this.reconnectAttempts,
        },
      });
      return;
    }

    this.reconnectAttempts += 1;
    const delayMs = RECONNECT_BASE_DELAY_MS * this.reconnectAttempts;

    this.emit({
      tipo: "SOCKET_RECONECTANDO",
      dados: {
        attempt: this.reconnectAttempts,
        delayMs,
      },
    });

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;

      try {
        this.connect(this.lastConnectOptions);
      } catch (error) {
        this.emit({
          tipo: "SOCKET_ERRO_TECNICO",
          dados: {
            message: error instanceof Error ? error.message : "Falha ao reconectar o WebSocket.",
          },
        });
      }
    }, delayMs);
  }

  subscribe(listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event) {
    this.listeners.forEach((listener) => {
      listener(event);
    });
  }

  send(tipo, dados = {}) {
    if (!this.isConnected()) {
      throw new Error("WebSocket não está conectado.");
    }

    this.socket.send(
      JSON.stringify({
        tipo,
        dados,
      }),
    );
  }

  enterRoom(salaId) {
    this.send("ENTRAR_SALA", { salaId });
  }

  leaveRoom(salaId) {
    this.send("SAIR_SALA", salaId ? { salaId } : {});
  }

  sendMessage({ salaId, conteudo, tipoMensagem = "TEXTO" }) {
    this.send("ENVIAR_MENSAGEM", {
      salaId,
      conteudo,
      tipoMensagem,
    });
  }
}

export const websocketClient = new FrontendWebSocketClient();
