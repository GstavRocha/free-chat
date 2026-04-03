<template>
  <v-card rounded="xl" elevation="2" class="chat-message-list">
    <v-card-item>
      <v-card-title class="text-h6">Histórico da sala</v-card-title>
      <v-card-subtitle>Mensagens ordenadas cronologicamente.</v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <v-progress-linear
        v-if="isLoading"
        color="primary"
        indeterminate
        class="mb-4"
      />

      <v-alert
        v-else-if="status === 'ERROR'"
        type="error"
        variant="tonal"
        rounded="lg"
      >
        {{ errorMessage || "Não foi possível carregar as mensagens da sala." }}
      </v-alert>

      <div v-else-if="items.length === 0" class="chat-message-list__empty">
        Ainda não há mensagens nesta sala. Você pode iniciar a conversa abaixo.
      </div>

      <div v-else class="chat-message-list__stack">
        <ChatMessageItem
          v-for="message in items"
          :key="message.id"
          :message="message"
          :current-user-id="currentUserId"
          :can-manage="canManageMessage(message)"
          :busy="busyMessageId === message.id"
          @edit-requested="$emit('edit-requested', $event)"
          @remove-requested="$emit('remove-requested', $event)"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import ChatMessageItem from "./ChatMessageItem.vue";

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  status: {
    type: String,
    default: "IDLE",
  },
  errorMessage: {
    type: String,
    default: "",
  },
  currentUserId: {
    type: [String, Number],
    default: null,
  },
  currentUserRole: {
    type: String,
    default: "",
  },
  busyMessageId: {
    type: [String, Number],
    default: null,
  },
});

defineEmits(["edit-requested", "remove-requested"]);

const isLoading = computed(() => ["LOADING_HISTORY", "IDLE"].includes(props.status));

function canManageMessage(message) {
  if (message?.excluidoEm) {
    return false;
  }

  const authorId = message?.autor?.id || message?.autorId;
  const isOwner = String(authorId || "") === String(props.currentUserId || "");
  const isAdmin = props.currentUserRole === "ADMIN";

  return isOwner || isAdmin;
}
</script>

<style scoped>
.chat-message-list {
  min-height: 22rem;
}

.chat-message-list__empty {
  color: rgba(15, 23, 42, 0.64);
}

.chat-message-list__stack {
  display: grid;
  gap: 0.9rem;
}
</style>
