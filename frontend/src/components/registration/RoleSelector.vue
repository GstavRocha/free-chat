<template>
  <v-select
    :model-value="modelValue"
    :items="roleOptions"
    label="Papel"
    variant="outlined"
    item-title="title"
    item-value="value"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup>
const roleOptions = [
  { title: "Aluno", value: "ALUNO" },
  { title: "Professor", value: "PROFESSOR" },
  { title: "Funcionário", value: "FUNCIONARIO" },
];

defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:modelValue"]);
</script>
