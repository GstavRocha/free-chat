import { apiClient } from "./apiClient";
import {
  normalizeAdministrativeUser,
  normalizeMessage,
  normalizeModerationLog,
  normalizeRoom,
} from "./resourceAdapters";

function ensureUserResponse(data) {
  return {
    usuario: normalizeAdministrativeUser(data?.usuario),
  };
}

function ensureRoomResponse(data) {
  return {
    sala: normalizeRoom(data?.sala),
  };
}

function ensureMessageResponse(data) {
  return {
    mensagem: normalizeMessage(data?.mensagem),
  };
}

export async function listAdministrativeUsers() {
  const response = await apiClient.get("/api/usuarios");

  return (response.data?.usuarios || []).map(normalizeAdministrativeUser);
}

export async function listModerationRooms() {
  const response = await apiClient.get("/api/moderacao/salas");

  return (response.data?.salas || []).map(normalizeRoom);
}

export async function listModerationRoomMessages(roomId) {
  const response = await apiClient.get(`/api/moderacao/salas/${roomId}/mensagens`);

  return (response.data?.mensagens || []).map(normalizeMessage);
}

export async function listModerationLogs() {
  const response = await apiClient.get("/api/moderacao/logs");

  return (response.data?.logs || []).map(normalizeModerationLog);
}

export async function blockUser(userId, motivo) {
  const response = await apiClient.patch(`/api/moderacao/usuarios/${userId}/bloquear`, {
    motivo,
  });

  return ensureUserResponse(response.data);
}

export async function silenceRoom(roomId, motivo) {
  const response = await apiClient.patch(`/api/moderacao/salas/${roomId}/silenciar`, {
    motivo,
  });

  return ensureRoomResponse(response.data);
}

export async function deleteRoomByModeration(roomId, motivo) {
  const response = await apiClient.patch(`/api/moderacao/salas/${roomId}/excluir`, {
    motivo,
  });

  return ensureRoomResponse(response.data);
}

export async function createModerationNotice(roomId, conteudo) {
  const response = await apiClient.post(`/api/moderacao/salas/${roomId}/avisos`, {
    conteudo,
  });

  return ensureMessageResponse(response.data);
}

export async function deleteMessageByModeration(messageId, motivo) {
  const response = await apiClient.patch(`/api/moderacao/mensagens/${messageId}/excluir`, {
    motivo,
  });

  return ensureMessageResponse(response.data);
}
