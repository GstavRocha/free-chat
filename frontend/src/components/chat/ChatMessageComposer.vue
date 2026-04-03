<template>
  <v-card rounded="xl" elevation="2">
    <v-card-item>
      <v-card-title class="text-h6">Enviar mensagem</v-card-title>
      <v-card-subtitle>Texto livre ou trecho de código para a sala atual.</v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <v-alert
        v-if="errorMessage"
        type="warning"
        variant="tonal"
        rounded="lg"
        class="mb-4"
      >
        {{ errorMessage }}
      </v-alert>

      <v-textarea
        :model-value="draft"
        label="Digite sua mensagem"
        variant="outlined"
        rows="4"
        auto-grow
        hide-details="auto"
        :disabled="disabled || loading"
        @update:model-value="$emit('update:draft', $event)"
        @keydown.enter.exact.prevent="$emit('send')"
      />

      <div class="chat-message-composer__actions">
        <v-checkbox
          :model-value="isCodeSnippet"
          label="Mensagem de código"
          hide-details
          density="comfortable"
          :disabled="disabled || loading"
          @update:model-value="$emit('update:is-code-snippet', $event)"
        />

        <v-btn
          color="primary"
          size="large"
          :loading="loading"
          :disabled="disabled"
          @click="$emit('send')"
        >
          Enviar
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  draft: {
    type: String,
    default: "",
  },
  isCodeSnippet: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
});

defineEmits(["update:draft", "update:is-code-snippet", "send"]);
</script>

<style scoped>
.chat-message-composer__actions {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

@media (max-width: 700px) {
  .chat-message-composer__actions {
    align-items: stretch;
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
