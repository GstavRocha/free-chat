<template>
  <AppLayout
    title="Salas públicas"
    :user-name="authStore.user?.nomeCompleto || ''"
    :user-role="authStore.user?.papel || ''"
    @logout="handleLogout"
  >
    <section class="rooms-list-hero">
      <div>
        <p class="rooms-list-hero__eyebrow">Listagem principal</p>
        <h1 class="rooms-list-hero__title">Escolha uma sala para entrar na conversa</h1>
        <p class="rooms-list-hero__text">
          A listagem mostra as salas públicas disponíveis, respeitando o estado retornado pelo
          backend e destacando ações compatíveis com o papel do usuário autenticado.
        </p>
      </div>

      <div class="rooms-list-hero__actions">
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

    <section class="rooms-list-section">
      <div class="rooms-list-section__header">
        <div>
          <p class="rooms-list-section__eyebrow">Salas disponíveis</p>
          <h2 class="rooms-list-section__title">{{ roomsStatusLabel }}</h2>
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
  </AppLayout>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import RoomList from "../components/rooms/RoomList.vue";
import { useAuthStore } from "../stores/authStore";
import { useRoomInsightsStore } from "../stores/roomInsightsStore";
import { useRoomsStore } from "../stores/roomsStore";

const router = useRouter();
const authStore = useAuthStore();
const roomInsightsStore = useRoomInsightsStore();
const roomsStore = useRoomsStore();

const isLoadingRooms = computed(() => roomsStore.listState.status === "LOADING");

const roomsStatusLabel = computed(() => {
  if (roomsStore.listState.status === "LOADING") {
    return "Carregando salas disponíveis";
  }

  if (roomsStore.listState.status === "EMPTY") {
    return "Nenhuma sala ativa encontrada";
  }

  if (roomsStore.listState.status === "ERROR") {
    return roomsStore.listState.errorMessage || "Falha ao carregar salas";
  }

  return `${roomsStore.listState.rooms.length} sala(s) pronta(s) para acesso`;
});

onMounted(() => {
  roomInsightsStore.hydrate();
  refreshRooms();
});

function handleLogout() {
  authStore.logout();
  router.push({ name: "login" });
}

async function refreshRooms() {
  try {
    const rooms = await roomsStore.fetchRooms();

    await roomInsightsStore.refreshUnreadCounts(
      rooms.map((room) => room.id),
      authStore.user?.id || "",
    );
  } catch {
    // O feedback visual já é tratado pela store de salas.
  }
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
.rooms-list-hero {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.5rem;
  background: var(--app-hero-gradient);
  border-radius: 28px;
  color: var(--app-panel-strong-text);
  margin-bottom: 1.5rem;
  padding: 2rem;
}

.rooms-list-hero__eyebrow,
.rooms-list-section__eyebrow {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 0.65rem;
  text-transform: uppercase;
}

.rooms-list-hero__title {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
  margin-bottom: 1rem;
  max-width: 36rem;
}

.rooms-list-hero__text {
  color: var(--app-panel-muted-text);
  line-height: 1.6;
  max-width: 44rem;
}

.rooms-list-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
}

.rooms-list-section {
  background: var(--app-section-surface);
  border-radius: 28px;
  padding: 1.25rem;
}

.rooms-list-section__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.rooms-list-section__eyebrow {
  color: var(--app-muted-text);
}

.rooms-list-section__title {
  font-size: clamp(1.35rem, 2vw, 1.85rem);
}
</style>
