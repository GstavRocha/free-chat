<template>
  <v-form class="registration-form" @submit.prevent="$emit('submit')">
    <v-text-field
      :model-value="formData.nomeCompleto"
      label="Nome completo"
      variant="outlined"
      :error-messages="errors.nomeCompleto ? [errors.nomeCompleto] : []"
      :disabled="loading"
      @update:model-value="$emit('update:field', { field: 'nomeCompleto', value: $event })"
    />

    <v-text-field
      :model-value="formData.cpf"
      label="CPF"
      variant="outlined"
      :error-messages="errors.cpf ? [errors.cpf] : []"
      :disabled="loading"
      @update:model-value="$emit('update:field', { field: 'cpf', value: $event })"
    />

    <v-text-field
      :model-value="formData.senha"
      label="Senha"
      type="password"
      variant="outlined"
      :error-messages="errors.senha ? [errors.senha] : []"
      :disabled="loading"
      @update:model-value="$emit('update:field', { field: 'senha', value: $event })"
    />

    <RoleSelector
      :model-value="formData.papel"
      :disabled="loading"
      @update:model-value="$emit('papel-changed', $event)"
    />

    <ConditionalFieldsBlock
      :papel="formData.papel"
      :form-data="formData"
      :errors="errors"
      :disabled="loading"
      @update:field="$emit('update:field', $event)"
    />

    <v-btn
      type="submit"
      color="primary"
      size="large"
      block
      :loading="loading"
    >
      Enviar solicitação
    </v-btn>
  </v-form>
</template>

<script setup>
import ConditionalFieldsBlock from "./ConditionalFieldsBlock.vue";
import RoleSelector from "./RoleSelector.vue";

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

defineEmits(["update:field", "papel-changed", "submit"]);
</script>

<style scoped>
.registration-form {
  display: grid;
  gap: 1rem;
}
</style>
