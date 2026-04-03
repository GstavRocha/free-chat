<template>
  <v-alert
    v-if="visible"
    :type="type"
    variant="tonal"
    rounded="lg"
    density="comfortable"
  >
    {{ message }}
  </v-alert>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "info",
  },
  message: {
    type: String,
    default: "",
  },
});
</script>
