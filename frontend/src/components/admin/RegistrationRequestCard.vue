<template>
  <v-card
    rounded="xl"
    :elevation="selected ? 6 : 2"
    class="registration-request-card"
    :class="{ 'registration-request-card--selected': selected }"
    @click="$emit('select', request)"
  >
    <v-card-item>
      <v-card-title>{{ request.nomeSolicitado }}</v-card-title>
      <v-card-subtitle>{{ request.papelSolicitado }}</v-card-subtitle>
    </v-card-item>

    <v-card-text class="registration-request-card__content">
      <div><strong>CPF:</strong> {{ request.cpfSolicitado }}</div>
      <div><strong>Status:</strong> {{ request.statusSolicitacao }}</div>
      <div v-if="request.departamentoSolicitado">
        <strong>Departamento:</strong> {{ request.departamentoSolicitado }}
      </div>
      <div v-if="request.setorSolicitado"><strong>Setor:</strong> {{ request.setorSolicitado }}</div>
      <div v-if="request.serieSolicitada || request.turmaSolicitada">
        <strong>Turma:</strong>
        {{ [request.serieSolicitada, request.turmaSolicitada].filter(Boolean).join(" / ") }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineEmits(["select"]);

defineProps({
  request: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.registration-request-card {
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.registration-request-card:hover {
  transform: translateY(-1px);
}

.registration-request-card--selected {
  border-color: rgb(var(--v-theme-primary));
}

.registration-request-card__content {
  color: var(--app-muted-text);
  display: grid;
  gap: 0.45rem;
}
</style>
