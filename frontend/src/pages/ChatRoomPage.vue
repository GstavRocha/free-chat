<template>
  <AppLayout
    title="Sala de chat"
    :user-name="authStore.user?.nomeCompleto || ''"
    :user-role="authStore.user?.papel || ''"
    @logout="handleLogout"
  >
    <v-row>
      <v-col cols="12">
        <RoomHeader
          v-if="room"
          :room="room"
          :can-edit="canEditRoom"
          @back="leaveToRooms"
          @edit="goToEditRoom"
        />

        <v-alert
          v-else-if="roomAlert.visible"
          :type="roomAlert.type"
          variant="tonal"
          rounded="xl"
          class="mb-6"
        >
          {{ roomAlert.message }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="room">
      <v-col cols="12" lg="8">
        <ChatConnectionBanner
          :status="messagesStore.realtimeState.status"
          :error-message="messagesStore.realtimeState.errorMessage || ''"
        />

        <v-alert
          v-if="room?.status === 'SILENCIADA'"
          type="warning"
          variant="tonal"
          rounded="xl"
          class="mb-4"
        >
          A sala foi silenciada. Você ainda pode acompanhar o histórico, mas novas mensagens estão bloqueadas.
        </v-alert>

        <ChatMessageList
          :items="messagesStore.messagesState.items"
          :status="messagesStore.messagesState.status"
          :error-message="messagesStore.messagesState.errorMessage || ''"
          :current-user-id="authStore.user?.id || null"
          :current-user-role="authStore.user?.papel || ''"
          :busy-message-id="messagesStore.actionState.targetMessageId"
          @edit-requested="handleEditMessage"
          @remove-requested="handleRemoveMessage"
        />

        <div class="chat-room-page__composer">
          <ChatMessageComposer
            :draft="messagesStore.composerState.draft"
            :is-code-snippet="messagesStore.composerState.isCodeSnippet"
            :loading="isSendingMessage"
            :disabled="!canUseComposer"
            :error-message="messagesStore.composerState.errorMessage || ''"
            @update:draft="messagesStore.setDraft($event)"
            @update:is-code-snippet="messagesStore.setCodeSnippetMode($event)"
            @send="handleSendMessage"
          />
        </div>
      </v-col>

      <v-col cols="12" lg="4">
        <ChatParticipantEvents :events="messagesStore.realtimeState.participantEvents" />
      </v-col>
    </v-row>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ChatConnectionBanner from "../components/chat/ChatConnectionBanner.vue";
import ChatMessageComposer from "../components/chat/ChatMessageComposer.vue";
import ChatMessageList from "../components/chat/ChatMessageList.vue";
import ChatParticipantEvents from "../components/chat/ChatParticipantEvents.vue";
import RoomHeader from "../components/chat/RoomHeader.vue";
import AppLayout from "../layouts/AppLayout.vue";
import { useAuthStore } from "../stores/authStore";
import { useMessagesStore } from "../stores/messagesStore";
import { useRoomInsightsStore } from "../stores/roomInsightsStore";
import { useRoomsStore } from "../stores/roomsStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roomInsightsStore = useRoomInsightsStore();
const roomsStore = useRoomsStore();
const messagesStore = useMessagesStore();

const cleanedUp = ref(false);

const roomId = computed(() => String(route.params.id || ""));
const room = computed(() => roomsStore.activeRoomState.room);

const roomAlert = computed(() => {
  if (roomsStore.activeRoomState.status === "LOADING_ROOM") {
    return {
      visible: true,
      type: "info",
      message: "Carregando os dados da sala...",
    };
  }

  if (roomsStore.activeRoomState.status === "ROOM_NOT_FOUND") {
    return {
      visible: true,
      type: "error",
      message: roomsStore.activeRoomState.errorMessage || "Sala não encontrada.",
    };
  }

  if (roomsStore.activeRoomState.status === "ROOM_UNAVAILABLE") {
    return {
      visible: true,
      type: "warning",
      message: roomsStore.activeRoomState.errorMessage || "Sala indisponível para uso normal.",
    };
  }

  if (roomsStore.activeRoomState.status === "ACCESS_DENIED") {
    return {
      visible: true,
      type: "error",
      message: roomsStore.activeRoomState.errorMessage || "Você não pode acessar esta sala.",
    };
  }

  return {
    visible: false,
    type: "info",
    message: "",
  };
});

const canEditRoom = computed(() => {
  if (!room.value || !authStore.user) {
    return false;
  }

  const isOwner = String(room.value.proprietarioId || "") === String(authStore.user.id || "");
  const isAdmin = authStore.user.papel === "ADMIN";

  return isOwner || isAdmin;
});

const isSendingMessage = computed(() => messagesStore.composerState.status === "SENDING");
const canUseComposer = computed(() => {
  return (
    room.value?.status === "ATIVA" &&
    roomsStore.activeRoomState.status === "ROOM_READY" &&
    Boolean(roomsStore.activeRoomState.participantSession)
  );
});

onMounted(async () => {
  cleanedUp.value = false;

  try {
    await roomsStore.openRoom(roomId.value);
    await roomsStore.enterActiveRoom(roomId.value);
    const messages = await messagesStore.fetchRoomMessages(roomId.value);
    const latestMessage = messages.at(-1);

    roomInsightsStore.noteParticipantEntered(roomId.value, authStore.user?.id || "");
    roomInsightsStore.markRoomViewed(
      roomId.value,
      latestMessage?.criadoEm || latestMessage?.createdAt || new Date().toISOString(),
    );

    messagesStore.connectToRoomRealtime(roomId.value);
  } catch {
    // O feedback visual já está distribuído entre as stores.
  }
});

onUnmounted(() => {
  cleanupRoomContext();
});

async function handleSendMessage() {
  try {
    await messagesStore.sendMessage(roomId.value);
  } catch {
    // O feedback visual permanece no estado do compositor.
  }
}

async function handleEditMessage(payload) {
  try {
    await messagesStore.editMessage(payload.messageId, payload.conteudo);
    payload.done?.();
  } catch {
    // O feedback visual permanece no estado de ação.
  }
}

async function handleRemoveMessage(messageId) {
  try {
    await messagesStore.removeMessage(messageId);
  } catch {
    // O feedback visual permanece no estado de ação.
  }
}

function goToEditRoom() {
  router.push({
    name: "room-edit",
    params: {
      id: roomId.value,
    },
  });
}

async function cleanupRoomContext() {
  if (cleanedUp.value) {
    return;
  }

  cleanedUp.value = true;

  if (roomsStore.activeRoomState.participantSession) {
    try {
      await roomsStore.leaveActiveRoom(roomId.value);
    } catch {
      // A limpeza visual deve continuar mesmo se a saída HTTP falhar.
    }
  }

  roomInsightsStore.markRoomViewed(
    roomId.value,
    messagesStore.messagesState.items.at(-1)?.criadoEm
      || messagesStore.messagesState.items.at(-1)?.createdAt
      || new Date().toISOString(),
  );
  roomInsightsStore.noteParticipantLeft(roomId.value, authStore.user?.id || "");

  messagesStore.disconnectRealtime();
  messagesStore.resetMessagesState();
  messagesStore.resetComposerState();
  messagesStore.resetActionState();
  roomsStore.resetActiveRoom();
}

async function leaveToRooms() {
  await cleanupRoomContext();
  router.push({ name: "rooms-list" });
}

async function handleLogout() {
  await cleanupRoomContext();
  authStore.logout();
  router.push({ name: "login" });
}
</script>

<style scoped>
.chat-room-page__composer {
  margin-top: 1rem;
}
</style>
