<template>
  <AppLayout
    :title="title"
    :user-name="userName"
    :user-role="userRole"
    page-class="admin-layout"
    :content-class="contentClass"
    @logout="$emit('logout')"
  >
    <slot />
  </AppLayout>
</template>

<script setup>
import AppLayout from "./AppLayout.vue";

defineProps({
  title: {
    type: String,
    default: "Painel administrativo",
  },
  userName: {
    type: String,
    default: "",
  },
  userRole: {
    type: String,
    default: "",
  },
  contentClass: {
    type: [String, Array, Object],
    default: "",
  },
});

defineEmits(["logout"]);
</script>
