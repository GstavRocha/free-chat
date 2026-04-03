<template>
  <div class="app-layout" :class="pageClass">
    <AppTopBar
      :title="title"
      :user-name="userName"
      :user-role="userRole"
      @logout="$emit('logout')"
    />

    <v-main>
      <v-container class="app-layout__content" :class="contentClass">
        <slot />
      </v-container>
    </v-main>
  </div>
</template>

<script setup>
import AppTopBar from "../components/app/AppTopBar.vue";

defineProps({
  title: {
    type: String,
    default: "Free Chat Maker",
  },
  userName: {
    type: String,
    default: "",
  },
  userRole: {
    type: String,
    default: "",
  },
  pageClass: {
    type: [String, Array, Object],
    default: "",
  },
  contentClass: {
    type: [String, Array, Object],
    default: "",
  },
});

defineEmits(["logout"]);
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--app-page-background);
  color: var(--app-text-color);
}

.app-layout__content {
  padding-block: 2rem 3rem;
}
</style>
