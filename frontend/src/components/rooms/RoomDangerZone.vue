<template>
  <v-card class="room-danger-zone" rounded="xl" color="error" variant="tonal">
    <v-card-item>
      <v-card-title>Zona de risco</v-card-title>
      <v-card-subtitle>
        A exclusão lógica remove a sala da experiência normal de uso.
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="room-danger-zone__content">
      <p class="room-danger-zone__text">
        Esta ação depende das permissões do backend. Para administradores, um motivo pode ser exigido.
      </p>

      <v-text-field
        :model-value="motivo"
        label="Motivo da exclusão"
        variant="outlined"
        density="comfortable"
        :disabled="loading"
        @update:model-value="$emit('update:motivo', $event)"
      />
    </v-card-text>

    <v-card-actions>
      <v-btn
        color="error"
        variant="flat"
        :loading="loading"
        @click="$emit('delete-requested')"
      >
        Excluir logicamente
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({
  motivo: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:motivo", "delete-requested"]);
</script>

<style scoped>
.room-danger-zone__content {
  display: grid;
  gap: 1rem;
}

.room-danger-zone__text {
  line-height: 1.5;
}
</style>
