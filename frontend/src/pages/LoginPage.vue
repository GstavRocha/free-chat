<template>
  <PublicLayout page-class="login-page">
    <v-card class="login-shell" rounded="xl" elevation="8">
      <div class="login-shell__brand">
        <p class="login-shell__eyebrow">Free Chat Maker</p>
        <h1 class="login-shell__title">Acesse o chat institucional</h1>
        <p class="login-shell__text">
          Entre com seu CPF e senha para continuar. Usuários aprovados seguem para as salas;
          estados pendentes, rejeitados e bloqueados recebem feedback imediato.
        </p>

        <div class="login-shell__links">
          <RouterLink class="login-shell__link" to="/login">Voltar para entrada</RouterLink>
          <RouterLink class="login-shell__link" to="/cadastro">Solicitar cadastro</RouterLink>
        </div>
      </div>

      <v-card-text class="login-shell__panel">
        <AuthStatusAlert
          :visible="alert.visible"
          :type="alert.type"
          :title="alert.title"
          :message="alert.message"
        />

        <LoginForm
          :cpf="form.cpf"
          :senha="form.senha"
          :loading="isLoading"
          @update:cpf="form.cpf = $event"
          @update:senha="form.senha = $event"
          @submit="submitLogin"
        />
      </v-card-text>
    </v-card>
  </PublicLayout>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { getAuthStatusPresentation } from "../auth/authStatusPresentation";
import AuthStatusAlert from "../components/auth/AuthStatusAlert.vue";
import LoginForm from "../components/auth/LoginForm.vue";
import PublicLayout from "../layouts/PublicLayout.vue";
import { useAuthStore } from "../stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  cpf: "",
  senha: "",
});

const isLoading = computed(() => authStore.status === "AUTENTICANDO");

const alert = computed(() => getAuthStatusPresentation(authStore.status, authStore.errorMessage));

watch(
  () => authStore.status,
  (status) => {
    if (status === "AUTENTICADO") {
      router.push({ name: "rooms-list" });
    }
  },
  {
    immediate: true,
  },
);

watch(
  () => [form.cpf, form.senha],
  () => {
    if (authStore.errorMessage) {
      authStore.clearFeedback();
    }
  },
);

async function submitLogin() {
  try {
    await authStore.login({
      cpf: form.cpf.trim(),
      senha: form.senha,
    });
  } catch {
    // O feedback visual vem da authStore e do AuthStatusAlert.
  }
}
</script>

<style scoped>
.login-page {
  background: var(--app-auth-background);
}

.login-shell {
  display: grid;
  overflow: hidden;
}

.login-shell__brand {
  background: var(--app-brand-login-gradient);
  color: var(--app-panel-strong-text);
  padding: 2rem;
}

.login-shell__eyebrow {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.login-shell__title {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
  margin-bottom: 1rem;
}

.login-shell__text {
  color: var(--app-panel-muted-text);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 32rem;
}

.login-shell__links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

.login-shell__link {
  color: var(--app-panel-strong-text);
  font-weight: 600;
  text-decoration: none;
}

.login-shell__panel {
  background: var(--app-panel-background);
  backdrop-filter: blur(12px);
  padding: 2rem;
}

@media (min-width: 960px) {
  .login-shell {
    grid-template-columns: 1.1fr 0.9fr;
  }

  .login-shell__brand,
  .login-shell__panel {
    padding: 3rem;
  }
}
</style>
