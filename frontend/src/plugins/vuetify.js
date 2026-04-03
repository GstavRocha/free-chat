import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";

const freeChatTheme = {
  dark: false,
  colors: {
    background: "#f7f3ea",
    surface: "#fffaf0",
    primary: "#9c3d1f",
    secondary: "#205a52",
    accent: "#d7a14d",
    error: "#b3261e",
    info: "#335c81",
    success: "#3c7a42",
    warning: "#b7791f",
  },
};

const freeChatDarkTheme = {
  dark: true,
  colors: {
    background: "#0f1720",
    surface: "#16212b",
    primary: "#f49a63",
    secondary: "#6dd6c7",
    accent: "#f2c46f",
    error: "#ff8a80",
    info: "#8ecae6",
    success: "#8fd694",
    warning: "#f4b860",
  },
};

export const vuetify = createVuetify({
  theme: {
    defaultTheme: "freeChatTheme",
    themes: {
      freeChatTheme,
      freeChatDarkTheme,
    },
  },
  defaults: {
    VCard: {
      rounded: "xl",
    },
    VBtn: {
      rounded: "lg",
      variant: "flat",
    },
  },
});
