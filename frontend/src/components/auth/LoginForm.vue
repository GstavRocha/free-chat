<template>
  <v-form class="login-form" @submit.prevent="$emit('submit')">
    <v-text-field
      :model-value="cpf"
      label="CPF"
      variant="outlined"
      autocomplete="username"
      prepend-inner-icon="mdi-card-account-details-outline"
      :disabled="loading"
      @update:model-value="$emit('update:cpf', $event)"
    />

    <v-text-field
      :model-value="senha"
      label="Senha"
      type="password"
      variant="outlined"
      autocomplete="current-password"
      prepend-inner-icon="mdi-lock-outline"
      :disabled="loading"
      @update:model-value="$emit('update:senha', $event)"
    />

    <v-btn
      type="submit"
      color="primary"
      size="large"
      block
      :loading="loading"
    >
      Entrar
    </v-btn>
  </v-form>
</template>

<script setup>
defineProps({
  cpf: {
    type: String,
    default: "",
  },
  senha: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:cpf", "update:senha", "submit"]);
</script>

<style scoped>
.login-form {
  display: grid;
  gap: 1rem;
}
</style>
