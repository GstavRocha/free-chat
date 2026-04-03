import { defineStore } from "pinia";
import {
  getPermissionDeniedMessage,
  isPermissionDeniedError,
} from "../auth/permissionErrorPresentation";
import { ApiClientError } from "../services/api/apiClient";
import {
  createRoomMessage,
  deleteMessage,
  listRoomMessages,
  updateMessage,
} from "../services/api/mensagensApi";
import { getRequestErrorMessage } from "../services/api/requestErrorPresentation";
import { websocketClient } from "../services/api/websocketClient";
import { useAuthStore } from "./authStore";
import { useRoomInsightsStore } from "./roomInsightsStore";
import { useRoomsStore } from "./roomsStore";

let socketUnsubscribe = null;
const AUTH_ERROR_CODES = new Set([
  "AUTH_REQUIRED",
  "AUTH_TOKEN_MISSING",
  "AUTH_TOKEN_INVALID_FORMAT",
  "AUTH_TOKEN_INVALID",
  "AUTH_USER_NOT_FOUND",
  "AUTH_USER_NOT_APPROVED",
]);

function getInitialMessagesState() {
  return {
    status: "IDLE",
    items: [],
    errorMessage: null,
  };
}

function getInitialComposerState() {
  return {
    status: "IDLE",
    draft: "",
    isCodeSnippet: false,
    errorMessage: null,
  };
}

function getInitialActionState() {
  return {
    status: "IDLE",
    targetMessageId: null,
    errorMessage: null,
  };
}

function getInitialRealtimeState() {
  return {
    status: "IDLE",
    roomId: null,
    errorMessage: null,
    lastClose: null,
    participantEvents: [],
  };
}

function upsertMessage(items, mensagem) {
  if (!mensagem?.id) {
    return items;
  }

  const existingIndex = items.findIndex((item) => item.id === mensagem.id);

  if (existingIndex >= 0) {
    const nextItems = [...items];
    nextItems.splice(existingIndex, 1, mensagem);
    return nextItems;
  }

  return [...items, mensagem];
}

function sortMessages(items) {
  return [...items].sort((left, right) => {
    const leftDate = left?.criadoEm || left?.createdAt || "";
    const rightDate = right?.criadoEm || right?.createdAt || "";

    return String(leftDate).localeCompare(String(rightDate));
  });
}

function mapActionErrorStatus(error) {
  if (isPermissionDeniedError(error)) {
    return "FORBIDDEN";
  }

  return "ERROR";
}

export const useMessagesStore = defineStore("messages", {
  state: () => ({
    messagesState: getInitialMessagesState(),
    composerState: getInitialComposerState(),
    actionState: getInitialActionState(),
    realtimeState: getInitialRealtimeState(),
  }),
  getters: {
    hasMessages: (state) => state.messagesState.items.length > 0,
    isRealtimeConnected: (state) => state.realtimeState.status === "CONNECTED",
  },
  actions: {
    resetMessagesState() {
      this.messagesState = getInitialMessagesState();
    },
    resetComposerState() {
      this.composerState = getInitialComposerState();
    },
    resetActionState() {
      this.actionState = getInitialActionState();
    },
    resetRealtimeState() {
      this.realtimeState = getInitialRealtimeState();
    },
    setDraft(draft) {
      this.composerState.draft = draft;
      this.composerState.status = draft ? "TYPING" : "IDLE";
      this.composerState.errorMessage = null;
    },
    setCodeSnippetMode(enabled) {
      this.composerState.isCodeSnippet = Boolean(enabled);
    },
    clearDraft() {
      this.composerState.draft = "";
      this.composerState.status = "IDLE";
      this.composerState.errorMessage = null;
    },
    async fetchRoomMessages(roomId) {
      this.messagesState.status = "LOADING_HISTORY";
      this.messagesState.errorMessage = null;

      try {
        const messages = await listRoomMessages(roomId);

        this.messagesState.items = sortMessages(messages);
        this.messagesState.status = messages.length > 0 ? "READY" : "EMPTY";
        this.messagesState.errorMessage = null;

        return messages;
      } catch (error) {
        this.messagesState.status = "ERROR";
        this.messagesState.errorMessage = getRequestErrorMessage(
          error,
          "Não foi possível carregar as mensagens.",
        );
        throw error;
      }
    },
    ensureRealtimeSubscription() {
      if (socketUnsubscribe) {
        return;
      }

      socketUnsubscribe = websocketClient.subscribe((event) => {
        this.handleRealtimeEvent(event);
      });
    },
    connectToRoomRealtime(roomId) {
      this.ensureRealtimeSubscription();
      this.realtimeState.roomId = roomId;
      this.realtimeState.status = "CONNECTING";
      this.realtimeState.errorMessage = null;

      const socket = websocketClient.connect();

      if (websocketClient.isConnected()) {
        websocketClient.enterRoom(roomId);
      }

      return socket;
    },
    disconnectRealtime() {
      const roomsStore = useRoomsStore();
      const roomId = this.realtimeState.roomId;
      const hasActiveParticipantSession = Boolean(roomsStore.activeRoomState.participantSession);

      if (roomId && hasActiveParticipantSession && websocketClient.isConnected()) {
        websocketClient.leaveRoom(roomId);
      }

      websocketClient.disconnect();

      if (socketUnsubscribe) {
        socketUnsubscribe();
        socketUnsubscribe = null;
      }

      this.resetRealtimeState();
    },
    handleRealtimeEvent(event) {
      const authStore = useAuthStore();
      const roomInsightsStore = useRoomInsightsStore();
      const roomsStore = useRoomsStore();

      if (event.tipo === "SOCKET_ABERTO") {
        this.realtimeState.status = "CONNECTING";
        this.realtimeState.lastClose = null;
        return;
      }

      if (event.tipo === "CONEXAO_AUTENTICADA") {
        this.realtimeState.status = "CONNECTED";
        this.realtimeState.errorMessage = null;
        this.realtimeState.lastClose = null;

        if (this.realtimeState.roomId) {
          websocketClient.enterRoom(this.realtimeState.roomId);
        }

        return;
      }

      if (event.tipo === "SOCKET_ERRO_TECNICO") {
        this.realtimeState.status = "CONNECTION_ERROR";
        this.realtimeState.errorMessage =
          event.dados?.message
          || "O canal em tempo real encontrou uma falha técnica. O chat continuará tentando se recuperar.";
        return;
      }

      if (event.tipo === "SOCKET_RECONECTANDO") {
        this.realtimeState.status = "RECONNECTING";
        this.realtimeState.errorMessage =
          `Tentando reconectar o chat em tempo real (tentativa ${event.dados?.attempt || 1}). `
          + "Enquanto isso, o envio próprio continua disponível pelo fallback HTTP.";
        return;
      }

      if (event.tipo === "SOCKET_RECONEXAO_ENCERRADA") {
        this.realtimeState.status = "CONNECTION_ERROR";
        this.realtimeState.errorMessage =
          "Não foi possível restabelecer a conexão em tempo real. "
          + "Você ainda pode enviar mensagens pelo fallback HTTP, mas atualizações ao vivo podem atrasar.";
        return;
      }

      if (event.tipo === "SOCKET_FECHADO") {
        this.realtimeState.lastClose = event.dados || null;

        if (!event.dados?.manual && this.realtimeState.status === "CONNECTED") {
          this.realtimeState.status = "CONNECTION_ERROR";
          this.realtimeState.errorMessage =
            "A conexão em tempo real foi interrompida. O chat tentará restabelecer o canal automaticamente.";
          return;
        }

        this.realtimeState.status = "IDLE";
        return;
      }

      if (event.tipo === "ERRO") {
        if (AUTH_ERROR_CODES.has(event.dados?.code)) {
          authStore.handleProtectedAccessFailure(
            new ApiClientError({
              status: 401,
              code: event.dados.code,
              message: event.dados.message,
              details: event.dados.details || null,
            }),
          );

          this.realtimeState.status = "IDLE";
          this.realtimeState.errorMessage = null;
          return;
        }

        this.realtimeState.errorMessage = event.dados?.message || "Erro no canal em tempo real.";

        if (
          event.dados?.code === "ROOM_MESSAGE_UNAVAILABLE" ||
          event.dados?.code === "ROOM_ENTRY_REQUIRED"
        ) {
          this.composerState.status = "SEND_ERROR";
          this.composerState.errorMessage = event.dados.message;

          if (event.dados?.details?.status === "SILENCIADA" && roomsStore.activeRoomState.room) {
            roomsStore.syncRoomFromRealtime({
              ...roomsStore.activeRoomState.room,
              status: "SILENCIADA",
            });
          }
        }

        return;
      }

      if (event.tipo === "SALA_ATUALIZADA") {
        const sala = event.dados?.sala;

        if (sala?.id) {
          roomsStore.syncRoomFromRealtime(sala);

          if (sala.id === this.realtimeState.roomId && sala.status === "SILENCIADA") {
            this.composerState.status = "BLOCKED";
            this.composerState.errorMessage = "Esta sala foi silenciada. Novas mensagens estão temporariamente bloqueadas.";
          }
        }

        return;
      }

      if (event.tipo === "PARTICIPANTE_ENTROU" || event.tipo === "PARTICIPANTE_SAIU") {
        const participantId = String(event.dados?.usuarioId || event.dados?.participante?.id || "");

        if (event.tipo === "PARTICIPANTE_ENTROU") {
          roomInsightsStore.noteParticipantEntered(this.realtimeState.roomId, participantId);
        } else {
          roomInsightsStore.noteParticipantLeft(this.realtimeState.roomId, participantId);
        }

        this.realtimeState.participantEvents = [
          ...this.realtimeState.participantEvents,
          {
            tipo: event.tipo,
            ...event.dados,
          },
        ];
        return;
      }

      if (event.tipo === "MENSAGEM_CRIADA") {
        const mensagem = event.dados?.mensagem;

        this.messagesState.items = sortMessages(upsertMessage(this.messagesState.items, mensagem));
        this.messagesState.status = this.messagesState.items.length > 0 ? "READY" : "EMPTY";

        if (this.realtimeState.roomId) {
          const observedAt = mensagem?.criadoEm || mensagem?.createdAt || new Date().toISOString();
          roomInsightsStore.noteObservedActivity(this.realtimeState.roomId, observedAt);
          roomInsightsStore.markRoomViewed(this.realtimeState.roomId, observedAt);
        }

        return;
      }

      if (event.tipo === "MENSAGEM_ATUALIZADA" || event.tipo === "MENSAGEM_REMOVIDA") {
        this.messagesState.items = sortMessages(upsertMessage(this.messagesState.items, event.dados?.mensagem));
        return;
      }
    },
    async sendMessage(roomId) {
      const content = this.composerState.draft.trim();

      this.composerState.status = "VALIDATING";
      this.composerState.errorMessage = null;

      if (!content) {
        this.composerState.status = "EMPTY_MESSAGE_ERROR";
        this.composerState.errorMessage = "Digite uma mensagem antes de enviar.";
        return null;
      }

      this.composerState.status = "SENDING";

      try {
        if (this.isRealtimeConnected) {
          websocketClient.sendMessage({
            salaId: roomId,
            conteudo: content,
            tipoMensagem: this.composerState.isCodeSnippet ? "CODIGO" : "TEXTO",
          });

          this.composerState.status = "SUCCESS";
          this.clearDraft();
          return null;
        }

        const result = await createRoomMessage(roomId, {
          conteudo: content,
          tipoMensagem: this.composerState.isCodeSnippet ? "CODIGO" : "TEXTO",
        });

        if (result.mensagem) {
          this.messagesState.items = sortMessages(upsertMessage(this.messagesState.items, result.mensagem));
          this.messagesState.status = this.messagesState.items.length > 0 ? "READY" : "EMPTY";
        }

        this.composerState.status = "SUCCESS";
        this.clearDraft();

        return result;
      } catch (error) {
        this.composerState.status = "SEND_ERROR";
        this.composerState.errorMessage = getRequestErrorMessage(
          error,
          "Não foi possível enviar a mensagem.",
        );
        throw error;
      }
    },
    async editMessage(messageId, conteudo) {
      this.actionState.status = "UPDATING";
      this.actionState.targetMessageId = messageId;
      this.actionState.errorMessage = null;

      try {
        const result = await updateMessage(messageId, { conteudo });

        if (result.mensagem) {
          this.messagesState.items = sortMessages(upsertMessage(this.messagesState.items, result.mensagem));
        }

        this.actionState.status = "SUCCESS";
        return result;
      } catch (error) {
        this.actionState.status = mapActionErrorStatus(error);
        this.actionState.errorMessage = isPermissionDeniedError(error)
          ? getPermissionDeniedMessage(error, "Você não tem permissão para editar esta mensagem.")
          : getRequestErrorMessage(error, "Não foi possível editar a mensagem.");
        throw error;
      }
    },
    async removeMessage(messageId) {
      this.actionState.status = "REMOVING";
      this.actionState.targetMessageId = messageId;
      this.actionState.errorMessage = null;

      try {
        const result = await deleteMessage(messageId);

        if (result.mensagem) {
          this.messagesState.items = sortMessages(upsertMessage(this.messagesState.items, result.mensagem));
        }

        this.actionState.status = "SUCCESS";
        return result;
      } catch (error) {
        this.actionState.status = mapActionErrorStatus(error);
        this.actionState.errorMessage = isPermissionDeniedError(error)
          ? getPermissionDeniedMessage(error, "Você não tem permissão para remover esta mensagem.")
          : getRequestErrorMessage(error, "Não foi possível remover a mensagem.");
        throw error;
      }
    },
  },
});
