<template>
  <v-alert
    v-if="visible && message"
    :type="type"
    variant="tonal"
    density="comfortable"
    class="form-status-alert"
  >
    {{ message }}
  </v-alert>
</template>

<script setup>
defineProps({
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
.form-status-alert {
  margin-bottom: 1rem;
}
</style>
