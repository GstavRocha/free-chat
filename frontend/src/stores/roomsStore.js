import { defineStore } from "pinia";
import { isPermissionDeniedError } from "../auth/permissionErrorPresentation";
import { ApiClientError } from "../services/api/apiClient";
import { getRequestErrorMessage } from "../services/api/requestErrorPresentation";
import {
  createRoom,
  deleteRoom,
  enterRoom,
  getRoomById,
  leaveRoom,
  listRooms,
  updateRoom,
} from "../services/api/salasApi";

function getInitialListState() {
  return {
    status: "IDLE",
    rooms: [],
    errorMessage: null,
  };
}

function getInitialActiveRoomState() {
  return {
    status: "IDLE",
    room: null,
    errorMessage: null,
    participantSession: null,
  };
}

function getRoomLoadFailureStatus(error) {
  if (!(error instanceof ApiClientError)) {
    return "ERROR";
  }

  if (error.code === "ROOM_NOT_FOUND") {
    return "ROOM_NOT_FOUND";
  }

  if (error.code === "ROOM_UNAVAILABLE") {
    return "ROOM_UNAVAILABLE";
  }

  if (isPermissionDeniedError(error)) {
    return "ACCESS_DENIED";
  }

  return "ERROR";
}

export const useRoomsStore = defineStore("rooms", {
  state: () => ({
    listState: getInitialListState(),
    activeRoomState: getInitialActiveRoomState(),
  }),
  getters: {
    hasRooms: (state) => state.listState.rooms.length > 0,
    isActiveRoomReady: (state) => state.activeRoomState.status === "ROOM_READY",
  },
  actions: {
    resetRoomsList() {
      this.listState = getInitialListState();
    },
    resetActiveRoom() {
      this.activeRoomState = getInitialActiveRoomState();
    },
    syncRoomFromRealtime(room) {
      if (!room?.id) {
        return;
      }

      this.listState.rooms = this.listState.rooms.map((listedRoom) =>
        listedRoom.id === room.id ? room : listedRoom,
      );

      if (this.activeRoomState.room?.id === room.id) {
        this.activeRoomState.room = room;
      }
    },
    async fetchRooms() {
      this.listState.status = "LOADING";
      this.listState.errorMessage = null;

      try {
        const rooms = await listRooms();

        this.listState.rooms = rooms;
        this.listState.status = rooms.length > 0 ? "SUCCESS" : "EMPTY";
        this.listState.errorMessage = null;

        return rooms;
      } catch (error) {
        this.listState.status = "ERROR";
        this.listState.errorMessage = getRequestErrorMessage(
          error,
          "Não foi possível carregar as salas.",
        );
        throw error;
      }
    },
    async openRoom(roomId) {
      this.activeRoomState.status = "LOADING_ROOM";
      this.activeRoomState.errorMessage = null;

      try {
        const { sala } = await getRoomById(roomId);

        this.activeRoomState.room = sala;
        this.activeRoomState.status = "ROOM_READY";
        this.activeRoomState.errorMessage = null;

        return sala;
      } catch (error) {
        this.activeRoomState.status = getRoomLoadFailureStatus(error);
        this.activeRoomState.room = null;
        this.activeRoomState.errorMessage = getRequestErrorMessage(
          error,
          "Não foi possível carregar a sala.",
        );
        throw error;
      }
    },
    async createRoom(payload) {
      const result = await createRoom(payload);

      if (result.sala) {
        const existingRoomIndex = this.listState.rooms.findIndex((room) => room.id === result.sala.id);

        if (existingRoomIndex >= 0) {
          this.listState.rooms.splice(existingRoomIndex, 1, result.sala);
        } else {
          this.listState.rooms.unshift(result.sala);
        }

        this.listState.status = this.listState.rooms.length > 0 ? "SUCCESS" : "EMPTY";
      }

      return result;
    },
    async updateRoom(roomId, payload) {
      const result = await updateRoom(roomId, payload);

      if (result.sala) {
        this.listState.rooms = this.listState.rooms.map((room) =>
          room.id === roomId ? result.sala : room,
        );

        if (this.activeRoomState.room?.id === roomId) {
          this.activeRoomState.room = result.sala;
        }
      }

      return result;
    },
    async deleteRoom(roomId, motivo) {
      const result = await deleteRoom(roomId, motivo);

      if (result.sala) {
        this.listState.rooms = this.listState.rooms.filter((room) => room.id !== roomId);
        this.listState.status = this.listState.rooms.length > 0 ? "SUCCESS" : "EMPTY";

        if (this.activeRoomState.room?.id === roomId) {
          this.activeRoomState.room = result.sala;
          this.activeRoomState.status = "ROOM_UNAVAILABLE";
          this.activeRoomState.errorMessage = "A sala não está mais disponível.";
        }
      }

      return result;
    },
    async enterActiveRoom(roomId) {
      const result = await enterRoom(roomId);

      this.activeRoomState.participantSession = result;

      return result;
    },
    async leaveActiveRoom(roomId) {
      const result = await leaveRoom(roomId);

      this.activeRoomState.participantSession = null;

      return result;
    },
  },
});
