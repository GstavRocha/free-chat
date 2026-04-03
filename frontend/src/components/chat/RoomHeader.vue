<template>
  <v-card rounded="xl" elevation="4" class="room-header">
    <v-card-text class="room-header__content">
      <div class="room-header__copy">
        <div class="room-header__eyebrow">Sala ativa</div>
        <h1 class="room-header__title">{{ room?.nome || "Sala" }}</h1>
        <p class="room-header__description">
          {{ room?.descricao || "Espaço preparado para mensagens em tempo real e histórico da conversa." }}
        </p>

        <div class="room-header__meta">
          <v-chip size="small" color="primary" variant="tonal">
            {{ room?.status || "ATIVA" }}
          </v-chip>
          <span>Criada em {{ createdAtLabel }}</span>
        </div>
      </div>

      <div class="room-header__actions">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="$emit('back')">
          Voltar
        </v-btn>
        <v-btn
          v-if="canEdit"
          color="primary"
          variant="flat"
          prepend-icon="mdi-pencil-outline"
          @click="$emit('edit')"
        >
          Editar sala
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  room: {
    type: Object,
    default: null,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["back", "edit"]);

const createdAtLabel = computed(() => {
  if (!props.room?.criadoEm) {
    return "agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(props.room.criadoEm));
});
</script>

<style scoped>
.room-header {
  background: var(--app-room-header-gradient);
}

.room-header__content {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.room-header__eyebrow {
  color: rgb(var(--v-theme-secondary));
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.room-header__title {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  line-height: 1;
  margin: 0;
}

.room-header__description {
  color: var(--app-muted-text);
  margin: 0.9rem 0 0;
  max-width: 52rem;
}

.room-header__meta {
  align-items: center;
  color: var(--app-muted-text);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.room-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .room-header__content {
    flex-direction: column;
  }

  .room-header__actions {
    justify-content: flex-start;
  }
}
</style>
