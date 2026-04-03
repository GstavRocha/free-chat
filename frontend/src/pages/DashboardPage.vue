<template>
  <div class="dashboard-page">
    <AppTopBar
      title="Painel principal"
      :user-name="authStore.user?.nomeCompleto || ''"
      :user-role="authStore.user?.papel || ''"
      @logout="handleLogout"
    />

    <v-main>
      <v-container class="dashboard-page__content">
        <section class="dashboard-hero">
          <p class="dashboard-hero__eyebrow">Área autenticada</p>
          <h1 class="dashboard-hero__title">
            {{ greetingTitle }}
          </h1>
          <p class="dashboard-hero__text">
            Este painel agora organiza o acesso às salas reais, criação de novos espaços e atalhos
            da sessão. A experiência continua evoluindo nas próximas telas de criação, edição e chat.
          </p>

          <div class="dashboard-hero__actions">
            <v-btn color="primary" size="large" :to="{ name: 'room-create' }">
              Criar nova sala
            </v-btn>

            <v-btn
              v-if="authStore.isAdmin"
              variant="text"
              size="large"
              :to="{ name: 'admin-panel' }"
            >
              Painel administrativo
            </v-btn>
          </div>
        </section>

        <v-row class="dashboard-summary" dense>
          <v-col cols="12" md="4">
            <v-card class="dashboard-card" rounded="xl" elevation="4">
              <v-card-title>Sessão</v-card-title>
              <v-card-text>
                Usuário autenticado: <strong>{{ authStore.user?.nomeCompleto || "Não identificado" }}</strong>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="dashboard-card" rounded="xl" elevation="4">
              <v-card-title>Status da listagem</v-card-title>
              <v-card-text>
                {{ roomsStatusLabel }}
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="dashboard-card dashboard-card--accent" rounded="xl" elevation="4">
              <v-card-title>Próximo passo</v-card-title>
              <v-card-text>
                Depois da listagem, entram criação, edição de sala e experiência completa do chat.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <section class="dashboard-rooms">
          <div class="dashboard-rooms__header">
            <div>
              <p class="dashboard-rooms__eyebrow">Salas públicas</p>
              <h2 class="dashboard-rooms__title">Escolha uma sala para entrar</h2>
            </div>

            <v-btn
              icon="mdi-refresh"
              variant="text"
              :loading="isLoadingRooms"
              @click="refreshRooms"
            />
          </div>

          <RoomList
            :rooms="roomsStore.listState.rooms"
            :loading="isLoadingRooms"
            :error-message="roomsStore.listState.errorMessage || ''"
            :current-user-id="authStore.user?.id || ''"
            :is-admin="authStore.isAdmin"
            @room-selected="openRoom"
            @room-edit-requested="editRoom"
          />
        </section>
      </v-container>
    </v-main>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppTopBar from "../components/app/AppTopBar.vue";
import { useAuthStore } from "../stores/authStore";
import RoomList from "../components/rooms/RoomList.vue";
import { useRoomsStore } from "../stores/roomsStore";

const router = useRouter();
const authStore = useAuthStore();
const roomsStore = useRoomsStore();

const greetingTitle = computed(() => {
  if (authStore.user?.nomeCompleto) {
    const [firstName] = authStore.user.nomeCompleto.split(" ");
    return `Olá, ${firstName}`;
  }

  return "Olá";
});

const isLoadingRooms = computed(() => roomsStore.listState.status === "LOADING");

const roomsStatusLabel = computed(() => {
  if (roomsStore.listState.status === "LOADING") {
    return "Carregando salas disponíveis.";
  }

  if (roomsStore.listState.status === "EMPTY") {
    return "Nenhuma sala ativa encontrada.";
  }

  if (roomsStore.listState.status === "ERROR") {
    return roomsStore.listState.errorMessage || "Falha ao carregar salas.";
  }

  return `${roomsStore.listState.rooms.length} sala(s) pronta(s) para acesso.`;
});

onMounted(() => {
  refreshRooms();
});

function handleLogout() {
  authStore.logout();
  router.push({ name: "login" });
}

function refreshRooms() {
  roomsStore.fetchRooms().catch(() => {});
}

function openRoom(room) {
  router.push({
    name: "room-chat",
    params: {
      id: room.id,
    },
  });
}

function editRoom(room) {
  router.push({
    name: "room-edit",
    params: {
      id: room.id,
    },
  });
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: var(--app-dashboard-background);
  color: var(--app-text-color);
}

.dashboard-page__content {
  padding-block: 2rem 3rem;
}

.dashboard-hero {
  background: var(--app-hero-gradient);
  border-radius: 28px;
  color: var(--app-panel-strong-text);
  margin-bottom: 1.5rem;
  padding: 2rem;
}

.dashboard-hero__eyebrow {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.dashboard-hero__title {
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.02;
  margin-bottom: 1rem;
}

.dashboard-hero__text {
  color: var(--app-panel-muted-text);
  line-height: 1.6;
  max-width: 44rem;
}

.dashboard-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.dashboard-summary {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.dashboard-card {
  height: 100%;
}

.dashboard-card--accent {
  background: var(--app-accent-surface);
}

.dashboard-rooms {
  background: var(--app-section-surface);
  border-radius: 28px;
  padding: 1.25rem;
}

.dashboard-rooms__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dashboard-rooms__eyebrow {
  color: var(--app-muted-text);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
}

.dashboard-rooms__title {
  font-size: clamp(1.35rem, 2vw, 1.85rem);
}
</style>
