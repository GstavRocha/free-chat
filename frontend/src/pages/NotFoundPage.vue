<template>
  <MinimalLayout page-class="not-found-page">
    <v-card class="not-found-shell" rounded="xl" elevation="8">
      <div class="not-found-shell__brand">
        <p class="not-found-shell__eyebrow">Rota não encontrada</p>
        <h1 class="not-found-shell__title">Essa página não existe no Free Chat Maker</h1>
        <p class="not-found-shell__text">
          O endereço acessado não corresponde a uma rota válida da aplicação. Você pode voltar
          para a navegação principal e continuar o fluxo pelo caminho esperado.
        </p>
      </div>

      <v-card-text class="not-found-shell__panel">
        <v-alert type="warning" variant="tonal" rounded="xl" class="mb-6">
          Verifique a URL informada ou escolha uma das rotas disponíveis abaixo.
        </v-alert>

        <div class="not-found-shell__actions">
          <v-btn
            color="primary"
            size="large"
            :to="primaryAction.to"
          >
            {{ primaryAction.label }}
          </v-btn>

          <v-btn
            variant="text"
            size="large"
            to="/"
          >
            Ir para a entrada
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </MinimalLayout>
</template>

<script setup>
import { computed } from "vue";
import MinimalLayout from "../layouts/MinimalLayout.vue";
import { useAuthStore } from "../stores/authStore";

const authStore = useAuthStore();

const primaryAction = computed(() => {
  if (authStore.isAuthenticated) {
    return {
      label: "Voltar para salas",
      to: { name: "rooms-list" },
    };
  }

  return {
    label: "Ir para login",
    to: { name: "login" },
  };
});
</script>

<style scoped>
.not-found-page {
}

.not-found-shell {
  display: grid;
  overflow: hidden;
}

.not-found-shell__brand {
  background: var(--app-hero-gradient);
  color: var(--app-panel-strong-text);
  padding: 2rem;
}

.not-found-shell__eyebrow {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.not-found-shell__title {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
  margin-bottom: 1rem;
}

.not-found-shell__text {
  color: var(--app-panel-muted-text);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 32rem;
}

.not-found-shell__panel {
  background: var(--app-panel-background);
  backdrop-filter: blur(12px);
  padding: 2rem;
}

.not-found-shell__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (min-width: 960px) {
  .not-found-shell {
    grid-template-columns: 1fr 0.9fr;
  }

  .not-found-shell__brand,
  .not-found-shell__panel {
    padding: 3rem;
  }
}
</style>
