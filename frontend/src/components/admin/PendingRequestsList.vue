<template>
  <v-card rounded="xl" elevation="3">
    <v-card-item>
      <v-card-title class="text-h6">Solicitações pendentes</v-card-title>
      <v-card-subtitle>Solicitações reais carregadas do backend para análise administrativa.</v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <v-progress-linear
        v-if="loading"
        color="primary"
        indeterminate
        class="mb-4"
      />

      <v-alert
        v-else-if="errorMessage"
        type="error"
        variant="tonal"
        rounded="lg"
      >
        {{ errorMessage }}
      </v-alert>

      <div v-else-if="requests.length === 0" class="pending-requests-list__empty">
        Nenhuma solicitação pendente encontrada no momento.
      </div>

      <div v-else class="pending-requests-list__stack">
        <RegistrationRequestCard
          v-for="request in requests"
          :key="request.id"
          :request="request"
          :selected="selectedRequestId === request.id"
          @select="$emit('select-request', $event)"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import RegistrationRequestCard from "./RegistrationRequestCard.vue";

defineEmits(["select-request"]);

defineProps({
  requests: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  selectedRequestId: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
.pending-requests-list__empty {
  color: var(--app-muted-text);
}

.pending-requests-list__stack {
  display: grid;
  gap: 0.85rem;
}
</style>
