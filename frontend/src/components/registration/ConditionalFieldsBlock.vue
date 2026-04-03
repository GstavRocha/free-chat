<template>
  <div v-if="papel" class="conditional-fields-block">
    <template v-if="papel === 'ALUNO'">
      <v-text-field
        :model-value="formData.serie"
        label="Série"
        variant="outlined"
        :error-messages="errors.serie ? [errors.serie] : []"
        :disabled="disabled"
        @update:model-value="$emit('update:field', { field: 'serie', value: $event })"
      />

      <v-text-field
        :model-value="formData.turma"
        label="Turma"
        variant="outlined"
        :error-messages="errors.turma ? [errors.turma] : []"
        :disabled="disabled"
        @update:model-value="$emit('update:field', { field: 'turma', value: $event })"
      />
    </template>

    <v-text-field
      v-else-if="papel === 'PROFESSOR'"
      :model-value="formData.departamento"
      label="Departamento"
      variant="outlined"
      :error-messages="errors.departamento ? [errors.departamento] : []"
      :disabled="disabled"
      @update:model-value="$emit('update:field', { field: 'departamento', value: $event })"
    />

    <v-text-field
      v-else-if="papel === 'FUNCIONARIO'"
      :model-value="formData.setor"
      label="Setor"
      variant="outlined"
      :error-messages="errors.setor ? [errors.setor] : []"
      :disabled="disabled"
      @update:model-value="$emit('update:field', { field: 'setor', value: $event })"
    />
  </div>
</template>

<script setup>
defineProps({
  papel: {
    type: String,
    default: "",
  },
  formData: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:field"]);
</script>

<style scoped>
.conditional-fields-block {
  display: grid;
  gap: 1rem;
}
</style>
