import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { vuetify } from "./plugins/vuetify";
import { router } from "./router";
import { useAuthStore } from "./stores/authStore";
import "./styles/main.css";

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();
  const authStore = useAuthStore(pinia);

  await authStore.initialize();

  app
    .use(pinia)
    .use(router)
    .use(vuetify)
    .mount("#app");
}

bootstrap();
