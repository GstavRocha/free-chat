<template>
  <v-app :class="appThemeClass">
    <RouterView />
  </v-app>
</template>

<script setup>
import { computed, watch, watchEffect } from "vue";
import { RouterView } from "vue-router";
import { useTheme } from "vuetify";
import { TERMINAL_AUTH_STATUSES } from "./auth/authStatusPresentation";
import { router } from "./router";
import { useAuthStore } from "./stores/authStore";
import { useThemeStore } from "./stores/themeStore";

const authStore = useAuthStore();
const theme = useTheme();
const themeStore = useThemeStore();

themeStore.initialize();

const appThemeClass = computed(() => ({
  "app-theme--dark": themeStore.isDark,
}));

watchEffect(() => {
  theme.global.name.value = themeStore.vuetifyThemeName;

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = themeStore.mode;
  }
});

watch(
  () => authStore.status,
  (status) => {
    if (!TERMINAL_AUTH_STATUSES.includes(status)) {
      return;
    }

    if (router.currentRoute.value.name !== "login") {
      router.push({ name: "login" });
    }
  },
);
</script>
