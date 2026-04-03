<template>
  <v-card rounded="xl" elevation="3">
    <v-card-item>
      <v-card-title class="text-h6">Ações administrativas</v-card-title>
      <v-card-subtitle>Selecione uma solicitação pendente para aprovar ou rejeitar.</v-card-subtitle>
    </v-card-item>

    <v-card-text class="approval-action-panel__content">
      <div v-if="selectedRequest" class="approval-action-panel__summary">
        <strong>{{ selectedRequest.nomeSolicitado }}</strong>
        <span>{{ selectedRequest.papelSolicitado }} • {{ selectedRequest.cpfSolicitado }}</span>
      </div>

      <v-alert
        v-else
        type="info"
        variant="tonal"
        rounded="lg"
      >
        Escolha uma solicitação na lista para liberar as ações administrativas.
      </v-alert>

      <v-textarea
        :model-value="rejectionReason"
        label="Motivo da rejeição"
        variant="outlined"
        rows="4"
        auto-grow
        :disabled="loading || !selectedRequest"
        hint="Obrigatório apenas para rejeitar."
        persistent-hint
        @update:model-value="$emit('update:rejection-reason', $event)"
      />

      <v-btn
        color="success"
        prepend-icon="mdi-check-decagram"
        :disabled="loading || !selectedRequest"
        :loading="approveLoading"
        @click="$emit('approve')"
      >
        Aprovar solicitação
      </v-btn>

      <v-btn
        color="warning"
        variant="outlined"
        prepend-icon="mdi-close-octagon-outline"
        :disabled="loading || !selectedRequest || !rejectionReason.trim()"
        :loading="rejectLoading"
        @click="$emit('reject')"
      >
        Rejeitar solicitação
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineEmits(["approve", "reject", "update:rejection-reason"]);

defineProps({
  selectedRequest: {
    type: Object,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  approveLoading: {
    type: Boolean,
    default: false,
  },
  rejectLoading: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.approval-action-panel__content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.approval-action-panel__summary {
  display: grid;
  gap: 0.2rem;
}

.approval-action-panel__summary span {
  color: var(--app-muted-text);
  font-size: 0.95rem;
}
</style>
