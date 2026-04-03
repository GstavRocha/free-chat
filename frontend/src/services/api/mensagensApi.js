import { apiClient } from "./apiClient";
import {
  normalizeMessage,
  normalizeMessagePayload,
} from "./resourceAdapters";

function ensureMessageResponse(data) {
  return {
    mensagem: normalizeMessage(data?.mensagem),
  };
}

export async function listRoomMessages(roomId) {
  const response = await apiClient.get(`/api/salas/${roomId}/mensagens`);

  return (response.data?.mensagens || []).map(normalizeMessage);
}

export async function createRoomMessage(roomId, payload) {
  const response = await apiClient.post(
    `/api/salas/${roomId}/mensagens`,
    normalizeMessagePayload(payload),
  );

  return ensureMessageResponse(response.data);
}

export async function updateMessage(messageId, payload) {
  const response = await apiClient.patch(
    `/api/mensagens/${messageId}`,
    normalizeMessagePayload(payload),
  );

  return ensureMessageResponse(response.data);
}

export async function deleteMessage(messageId) {
  const response = await apiClient.patch(`/api/mensagens/${messageId}/excluir`);

  return ensureMessageResponse(response.data);
}
