import { apiClient } from "./apiClient";
import {
  normalizeParticipationSession,
  normalizeRoom,
  normalizeRoomPayload,
} from "./resourceAdapters";

function ensureRoomResponse(data) {
  return {
    sala: normalizeRoom(data?.sala),
  };
}

function ensureParticipationResponse(data) {
  return normalizeParticipationSession(data);
}

export async function listRooms() {
  const response = await apiClient.get("/api/salas");

  return (response.data?.salas || []).map(normalizeRoom);
}

export async function getRoomById(roomId) {
  const response = await apiClient.get(`/api/salas/${roomId}`);

  return ensureRoomResponse(response.data);
}

export async function createRoom(payload) {
  const response = await apiClient.post("/api/salas", normalizeRoomPayload(payload));

  return ensureRoomResponse(response.data);
}

export async function updateRoom(roomId, payload) {
  const response = await apiClient.patch(`/api/salas/${roomId}`, normalizeRoomPayload(payload));

  return ensureRoomResponse(response.data);
}

export async function deleteRoom(roomId, motivo) {
  const response = await apiClient.patch(`/api/salas/${roomId}/excluir`, motivo ? { motivo } : {});

  return ensureRoomResponse(response.data);
}

export async function enterRoom(roomId) {
  const response = await apiClient.post(`/api/salas/${roomId}/entrar`);

  return ensureParticipationResponse(response.data);
}

export async function leaveRoom(roomId) {
  const response = await apiClient.post(`/api/salas/${roomId}/sair`);

  return ensureParticipationResponse(response.data);
}
