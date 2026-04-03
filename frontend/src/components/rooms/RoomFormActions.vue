<template>
  <div class="room-form-actions">
    <v-btn
      variant="text"
      :disabled="loading"
      @click="$emit('cancel')"
    >
      Cancelar
    </v-btn>

    <v-btn
      color="primary"
      :loading="loading"
      @click="$emit('submit')"
    >
      {{ submitLabel }}
    </v-btn>
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  submitLabel: {
    type: String,
    default: "Salvar",
  },
});

defineEmits(["cancel", "submit"]);
</script>

<style scoped>
.room-form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
