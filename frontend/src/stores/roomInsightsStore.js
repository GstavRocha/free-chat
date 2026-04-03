import { defineStore } from "pinia";
import { listRoomMessages } from "../services/api/mensagensApi";

const ROOM_LAST_SEEN_STORAGE_KEY = "free-chat-room-last-seen";
function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function parseStoredMap(rawValue) {
  if (!rawValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
}

function readLastSeenMap() {
  const storage = getStorage();

  if (!storage) {
    return {};
  }

  return parseStoredMap(storage.getItem(ROOM_LAST_SEEN_STORAGE_KEY));
}

function persistLastSeenMap(lastSeenByRoom) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(ROOM_LAST_SEEN_STORAGE_KEY, JSON.stringify(lastSeenByRoom));
}

function toTimestamp(value) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function countUnreadMessages(messages, currentUserId, lastSeenTimestamp) {
  return messages.reduce((count, message) => {
    if (!message || message.isDeleted || message.excluidoEm || message.deletedAt) {
      return count;
    }

    const authorId = String(message.autorId || message.authorId || message.autor?.id || "");

    if (authorId && authorId === String(currentUserId || "")) {
      return count;
    }

    return toTimestamp(message.criadoEm || message.createdAt) > lastSeenTimestamp ? count + 1 : count;
  }, 0);
}

export const useRoomInsightsStore = defineStore("room-insights", {
  state: () => ({
    hydrated: false,
    lastSeenByRoom: {},
    unreadCountByRoom: {},
    lastObservedActivityByRoom: {},
    observedParticipantIdsByRoom: {},
  }),
  getters: {
    getUnreadCount: (state) => (roomId) => state.unreadCountByRoom[roomId] || 0,
    getPresenceState: (state) => (roomId) => {
      const participantIds = state.observedParticipantIdsByRoom[roomId] || [];

      return participantIds.length > 0 ? "ONLINE" : "EMPTY";
    },
  },
  actions: {
    hydrate() {
      if (this.hydrated) {
        return;
      }

      this.lastSeenByRoom = readLastSeenMap();
      this.hydrated = true;
    },
    markRoomViewed(roomId, seenAt = new Date().toISOString()) {
      if (!roomId) {
        return;
      }

      this.hydrate();
      this.lastSeenByRoom[roomId] = seenAt;
      this.unreadCountByRoom[roomId] = 0;
      persistLastSeenMap(this.lastSeenByRoom);
    },
    async refreshUnreadCounts(roomIds, currentUserId) {
      this.hydrate();

      const uniqueRoomIds = Array.from(new Set((roomIds || []).filter(Boolean)));

      await Promise.allSettled(
        uniqueRoomIds.map(async (roomId) => {
          const messages = await listRoomMessages(roomId);
          const lastSeenAt = this.lastSeenByRoom[roomId] || null;
          const unreadCount = countUnreadMessages(messages, currentUserId, toTimestamp(lastSeenAt));

          this.unreadCountByRoom[roomId] = unreadCount;
        }),
      );
    },
    noteObservedActivity(roomId, occurredAt = new Date().toISOString()) {
      if (!roomId) {
        return;
      }

      this.lastObservedActivityByRoom[roomId] = occurredAt;
    },
    noteParticipantEntered(roomId, userId) {
      if (!roomId || !userId) {
        return;
      }

      const nextParticipantIds = new Set(this.observedParticipantIdsByRoom[roomId] || []);
      nextParticipantIds.add(String(userId));
      this.observedParticipantIdsByRoom[roomId] = Array.from(nextParticipantIds);
      this.noteObservedActivity(roomId);
    },
    noteParticipantLeft(roomId, userId) {
      if (!roomId || !userId) {
        return;
      }

      const nextParticipantIds = new Set(this.observedParticipantIdsByRoom[roomId] || []);
      nextParticipantIds.delete(String(userId));
      this.observedParticipantIdsByRoom[roomId] = Array.from(nextParticipantIds);
    },
  },
});
