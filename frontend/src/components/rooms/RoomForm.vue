<template>
  <v-form class="room-form" @submit.prevent="$emit('submit')">
    <v-text-field
      :model-value="formData.nome"
      label="Nome da sala"
      variant="outlined"
      :error-messages="errors.nome ? [errors.nome] : []"
      :disabled="loading"
      @update:model-value="$emit('update:field', { field: 'nome', value: $event })"
    />

    <v-textarea
      :model-value="formData.descricao"
      label="Descrição"
      variant="outlined"
      rows="4"
      auto-grow
      :error-messages="errors.descricao ? [errors.descricao] : []"
      :disabled="loading"
      @update:model-value="$emit('update:field', { field: 'descricao', value: $event })"
    />
  </v-form>
</template>

<script setup>
defineProps({
  formData: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:field", "submit"]);
</script>

<style scoped>
.room-form {
  display: grid;
  gap: 1rem;
}
</style>
