<template>
  <v-app-bar color="surface" elevation="1">
    <v-app-bar-title class="app-top-bar__title">
      {{ title }}
    </v-app-bar-title>

    <template #append>
      <div v-if="userName" class="app-top-bar__user">
        <span class="app-top-bar__name">{{ userName }}</span>
        <span v-if="userRole" class="app-top-bar__role">{{ userRole }}</span>
      </div>

      <v-btn
        variant="text"
        :icon="themeIcon"
        :aria-label="themeLabel"
        @click="toggleTheme"
      />

      <v-btn
        variant="text"
        icon="mdi-logout"
        @click="$emit('logout')"
      />
    </template>
  </v-app-bar>
</template>

<script setup>
import { computed } from "vue";
import { useThemeStore } from "../../stores/themeStore";

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
});

defineEmits(["logout"]);

const themeStore = useThemeStore();

const themeIcon = computed(() => (themeStore.isDark ? "mdi-weather-sunny" : "mdi-weather-night"));
const themeLabel = computed(() =>
  themeStore.isDark ? "Ativar tema claro" : "Ativar tema escuro",
);

function toggleTheme() {
  themeStore.toggleMode();
}
</script>

<style scoped>
.app-top-bar__title {
  font-weight: 700;
}

.app-top-bar__user {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  margin-right: 0.5rem;
}

.app-top-bar__name {
  font-size: 0.95rem;
  font-weight: 600;
}

.app-top-bar__role {
  color: var(--app-muted-text);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
