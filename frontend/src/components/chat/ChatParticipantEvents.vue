<template>
  <v-card rounded="xl" elevation="2">
    <v-card-item>
      <v-card-title class="text-h6">Atividade da sala</v-card-title>
      <v-card-subtitle>Entradas e saídas refletidas em tempo real.</v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div v-if="items.length === 0" class="chat-participant-events__empty">
        Nenhum evento de participação apareceu por enquanto.
      </div>

      <v-timeline
        v-else
        side="end"
        density="compact"
        truncate-line="both"
        class="chat-participant-events__timeline"
      >
        <v-timeline-item
          v-for="event in items"
          :key="event.key"
          size="small"
          :dot-color="event.color"
          fill-dot
        >
          <div class="chat-participant-events__item">
            <div class="chat-participant-events__headline">{{ event.title }}</div>
            <div class="chat-participant-events__meta">{{ event.meta }}</div>
          </div>
        </v-timeline-item>
      </v-timeline>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  events: {
    type: Array,
    default: () => [],
  },
});

function formatDateTime(value) {
  if (!value) {
    return "Agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

const items = computed(() =>
  props.events.slice(-8).reverse().map((event, index) => {
    const participantName = event.participante?.nomeCompleto || "Participante";
    const createdAt = event.evento?.criadoEm || null;
    const isJoin = event.tipo === "PARTICIPANTE_ENTROU";

    return {
      key: `${event.tipo}-${event.evento?.id || index}`,
      color: isJoin ? "success" : "warning",
      title: isJoin
        ? `${participantName} entrou na sala`
        : `${participantName} saiu da sala`,
      meta: formatDateTime(createdAt),
    };
  }),
);
</script>

<style scoped>
.chat-participant-events__empty {
  color: rgba(15, 23, 42, 0.66);
}

.chat-participant-events__timeline {
  margin-left: -0.5rem;
}

.chat-participant-events__headline {
  font-weight: 600;
}

.chat-participant-events__meta {
  color: rgba(15, 23, 42, 0.6);
  font-size: 0.82rem;
  margin-top: 0.2rem;
}
</style>
