import { defineStore } from "pinia";

const THEME_STORAGE_KEY = "free-chat-theme";

function resolveInitialMode() {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = defineStore("theme", {
  state: () => ({
    mode: "light",
    initialized: false,
  }),
  getters: {
    isDark: (state) => state.mode === "dark",
    vuetifyThemeName: (state) => (state.mode === "dark" ? "freeChatDarkTheme" : "freeChatTheme"),
  },
  actions: {
    initialize() {
      if (this.initialized) {
        return;
      }

      this.mode = resolveInitialMode();
      this.initialized = true;
      this.persist();
    },
    setMode(mode) {
      this.mode = mode === "dark" ? "dark" : "light";
      this.initialized = true;
      this.persist();
    },
    toggleMode() {
      this.setMode(this.mode === "dark" ? "light" : "dark");
    },
    persist() {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(THEME_STORAGE_KEY, this.mode);
    },
  },
});
