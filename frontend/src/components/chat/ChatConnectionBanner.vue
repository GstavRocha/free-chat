<template>
  <v-alert
    v-if="banner.visible"
    :type="banner.type"
    variant="tonal"
    rounded="lg"
    density="comfortable"
    class="chat-connection-banner"
  >
    {{ banner.message }}
  </v-alert>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    default: "IDLE",
  },
  errorMessage: {
    type: String,
    default: "",
  },
});

const banner = computed(() => {
  if (props.status === "CONNECTING") {
    return {
      visible: true,
      type: "info",
      message: "Conectando o canal em tempo real da sala...",
    };
  }

  if (props.status === "RECONNECTING") {
    return {
      visible: true,
      type: "warning",
      message: props.errorMessage || "Tentando reconectar o canal em tempo real da sala...",
    };
  }

  if (props.status === "CONNECTION_ERROR") {
    return {
      visible: true,
      type: "warning",
      message: props.errorMessage || "O canal em tempo real ficou indisponível, mas o chat ainda pode seguir com fallback HTTP.",
    };
  }

  if (props.errorMessage) {
    return {
      visible: true,
      type: "warning",
      message: props.errorMessage,
    };
  }

  return {
    visible: false,
    type: "info",
    message: "",
  };
});
</script>

<style scoped>
.chat-connection-banner {
  margin-bottom: 1rem;
}
</style>
