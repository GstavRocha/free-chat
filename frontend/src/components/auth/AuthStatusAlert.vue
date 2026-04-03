<template>
  <v-alert
    v-if="visible && message"
    :type="type"
    variant="tonal"
    density="comfortable"
    class="auth-status-alert"
  >
    <div v-if="title" class="auth-status-alert__title">{{ title }}</div>
    {{ message }}
  </v-alert>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "info",
  },
  message: {
    type: String,
    default: "",
  },
  visible: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.auth-status-alert {
  margin-bottom: 1rem;
}

.auth-status-alert__title {
  font-weight: 700;
  margin-bottom: 0.25rem;
}
</style>
