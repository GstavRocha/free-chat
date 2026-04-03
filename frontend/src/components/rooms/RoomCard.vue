<template>
  <v-card class="room-card" rounded="xl" elevation="4">
    <v-card-item>
      <template #prepend>
        <v-avatar color="primary" variant="tonal">
          <v-icon icon="mdi-forum-outline" />
        </v-avatar>
      </template>

      <v-card-title>{{ room.nome }}</v-card-title>
      <v-card-subtitle>
        {{ statusLabel }}
      </v-card-subtitle>

      <template #append>
        <div class="room-card__append">
          <div
            class="room-card__presence"
            :aria-label="presenceLabel"
            :title="presenceLabel"
          >
            <v-icon :color="presenceColor" :icon="presenceIcon" size="18" />
          </div>

          <v-chip
            class="room-card__counter"
            :color="unreadCount > 0 ? 'primary' : 'default'"
            size="small"
            variant="tonal"
          >
            {{ unreadCount }}
          </v-chip>

          <v-chip :color="statusColor" size="small" variant="tonal">
            {{ room.status }}
          </v-chip>
        </div>
      </template>
    </v-card-item>

    <v-card-text class="room-card__content">
      <p class="room-card__description">
        {{ room.descricao || "Sala sem descrição informada." }}
      </p>

      <div class="room-card__meta">
        <span>Criador: {{ ownerLabel }}</span>
        <span v-if="updatedLabel">Atualizada: {{ updatedLabel }}</span>
      </div>
    </v-card-text>

    <v-card-actions class="room-card__actions">
      <v-btn
        color="primary"
        variant="flat"
        @click="$emit('room-selected', room)"
      >
        Entrar
      </v-btn>

      <v-btn
        v-if="canEdit"
        variant="text"
        @click="$emit('room-edit-requested', room)"
      >
        Editar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { useRoomInsightsStore } from "../../stores/roomInsightsStore";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  currentUserId: {
    type: String,
    default: "",
  },
});

defineEmits(["room-selected", "room-edit-requested"]);

const roomInsightsStore = useRoomInsightsStore();

const ownerLabel = computed(() => {
  if (props.currentUserId && props.room.proprietarioId === props.currentUserId) {
    return "Você";
  }

  return props.room.proprietario?.nomeCompleto || props.room.proprietarioId || "indisponível";
});

const updatedLabel = computed(() => {
  if (!props.room.atualizadoEm) {
    return "";
  }

  return new Date(props.room.atualizadoEm).toLocaleDateString("pt-BR");
});

const statusColor = computed(() => {
  if (props.room.status === "SILENCIADA") {
    return "warning";
  }

  if (props.room.status === "EXCLUIDA") {
    return "error";
  }

  return "success";
});

const statusLabel = computed(() => {
  if (props.room.status === "ATIVA") {
    return "Pronta para conversa";
  }

  if (props.room.status === "SILENCIADA") {
    return "Restrição de envio";
  }

  return "Indisponível";
});

const unreadCount = computed(() => roomInsightsStore.getUnreadCount(props.room.id));

const presenceState = computed(() => roomInsightsStore.getPresenceState(props.room.id));

const presenceColor = computed(() => (presenceState.value === "ONLINE" ? "success" : "grey"));

const presenceIcon = computed(() => (
  presenceState.value === "ONLINE" ? "mdi-account-group" : "mdi-account-off-outline"
));

const presenceLabel = computed(() => (
  presenceState.value === "ONLINE"
    ? "Atividade observada nesta sessão"
    : "Nenhuma presença observada nesta sessão"
));
</script>

<style scoped>
.room-card {
  height: 100%;
}

.room-card__append {
  align-items: center;
  display: flex;
  gap: 0.45rem;
}

.room-card__presence {
  align-items: center;
  background: color-mix(in srgb, var(--app-panel-color) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-border-color) 82%, transparent);
  border-radius: 999px;
  display: inline-flex;
  height: 1.9rem;
  justify-content: center;
  width: 1.9rem;
}

.room-card__content {
  display: grid;
  gap: 0.85rem;
}

.room-card__description {
  color: color-mix(in srgb, var(--app-text-color) 82%, transparent);
  line-height: 1.55;
  min-height: 3.25rem;
}

.room-card__meta {
  color: var(--app-muted-text);
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  gap: 0.35rem;
}

.room-card__actions {
  justify-content: space-between;
}

@media (max-width: 640px) {
  .room-card__append {
    gap: 0.35rem;
  }
}
</style>
