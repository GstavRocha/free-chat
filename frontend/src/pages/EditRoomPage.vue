<template>
  <AppLayout
    title="Editar sala"
    :user-name="authStore.user?.nomeCompleto || ''"
    :user-role="authStore.user?.papel || ''"
    @logout="handleLogout"
  >
    <v-row justify="center">
      <v-col cols="12" lg="8">
        <v-card class="edit-room-card" rounded="xl" elevation="6">
          <v-card-item>
            <v-card-title class="text-h4">Editar sala</v-card-title>
            <v-card-subtitle>
              Atualize o nome e a descrição da sala, ou execute a exclusão lógica quando permitido.
            </v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <FormStatusAlert
              :visible="statusAlert.visible"
              :type="statusAlert.type"
              :message="statusAlert.message"
            />

            <v-progress-linear
              v-if="isLoadingRoom"
              color="primary"
              indeterminate
              class="mb-4"
            />

            <template v-else-if="canRenderForm">
              <RoomForm
                :form-data="form"
                :errors="errors"
                :loading="isSaving"
                @update:field="updateField"
                @submit="submitEdition"
              />

              <RoomFormActions
                :loading="isSaving"
                submit-label="Salvar alterações"
                @cancel="goBack"
                @submit="submitEdition"
              />

              <RoomDangerZone
                class="mt-6"
                :motivo="deleteReason"
                :loading="isDeleting"
                @update:motivo="deleteReason = $event"
                @delete-requested="removeRoom"
              />
            </template>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getPermissionDeniedMessage,
  isPermissionDeniedError,
} from "../auth/permissionErrorPresentation";
import FormStatusAlert from "../components/forms/FormStatusAlert.vue";
import RoomDangerZone from "../components/rooms/RoomDangerZone.vue";
import RoomForm from "../components/rooms/RoomForm.vue";
import RoomFormActions from "../components/rooms/RoomFormActions.vue";
import AppLayout from "../layouts/AppLayout.vue";
import { getRequestErrorMessage } from "../services/api/requestErrorPresentation";
import { useAuthStore } from "../stores/authStore";
import { useRoomsStore } from "../stores/roomsStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roomsStore = useRoomsStore();

const form = reactive({
  nome: "",
  descricao: "",
});

const errors = ref({});
const submitState = ref("IDLE");
const submitMessage = ref("");
const deleteReason = ref("");

const roomId = computed(() => String(route.params.id || ""));
const isLoadingRoom = computed(() => roomsStore.activeRoomState.status === "LOADING_ROOM");
const isSaving = computed(() => submitState.value === "SALVANDO");
const isDeleting = computed(() => submitState.value === "REMOVENDO");

const canRenderForm = computed(() => {
  return roomsStore.activeRoomState.status === "ROOM_READY" && Boolean(roomsStore.activeRoomState.room);
});

const statusAlert = computed(() => {
  if (roomsStore.activeRoomState.status === "ROOM_NOT_FOUND") {
    return {
      visible: true,
      type: "error",
      message: roomsStore.activeRoomState.errorMessage || "Sala não encontrada.",
    };
  }

  if (roomsStore.activeRoomState.status === "ROOM_UNAVAILABLE") {
    return {
      visible: true,
      type: "warning",
      message: roomsStore.activeRoomState.errorMessage || "Sala indisponível para edição.",
    };
  }

  if (roomsStore.activeRoomState.status === "ACCESS_DENIED") {
    return {
      visible: true,
      type: "error",
      message: roomsStore.activeRoomState.errorMessage || "Você não pode editar esta sala.",
    };
  }

  if (submitState.value === "SUCCESS") {
    return {
      visible: true,
      type: "success",
      message: submitMessage.value || "Sala atualizada com sucesso.",
    };
  }

  if (submitState.value === "REMOVED") {
    return {
      visible: true,
      type: "success",
      message: submitMessage.value || "Sala excluída com sucesso.",
    };
  }

  if (submitState.value === "ERROR_VALIDACAO") {
    return {
      visible: true,
      type: "warning",
      message: submitMessage.value || "Preencha os campos obrigatórios para continuar.",
    };
  }

  if (submitState.value === "ERROR_SUBMISSAO") {
    return {
      visible: true,
      type: "error",
      message: submitMessage.value || "Não foi possível salvar a sala.",
    };
  }

  if (submitState.value === "FORBIDDEN") {
    return {
      visible: true,
      type: "error",
      message: submitMessage.value || "Você não tem permissão para alterar esta sala.",
    };
  }

  return {
    visible: false,
    type: "info",
    message: "",
  };
});

onMounted(async () => {
  try {
    const room = await roomsStore.openRoom(roomId.value);
    form.nome = room?.nome || "";
    form.descricao = room?.descricao || "";
  } catch {
    // O feedback visual vem do estado da store.
  }
});

function updateField({ field, value }) {
  form[field] = value;
  submitState.value = "EDITANDO";
  errors.value = {
    ...errors.value,
    [field]: "",
  };
}

function validateForm() {
  const nextErrors = {};

  if (!form.nome.trim()) {
    nextErrors.nome = "Informe o nome da sala.";
  }

  errors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
}

async function submitEdition() {
  const valid = validateForm();

  if (!valid) {
    submitState.value = "ERROR_VALIDACAO";
    submitMessage.value = "O nome da sala é obrigatório.";
    return;
  }

  submitState.value = "SALVANDO";
  submitMessage.value = "";

  try {
    await roomsStore.updateRoom(roomId.value, {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
    });

    submitState.value = "SUCCESS";
    submitMessage.value = "Sala atualizada com sucesso.";
  } catch (error) {
    submitState.value = isPermissionDeniedError(error) ? "FORBIDDEN" : "ERROR_SUBMISSAO";
    submitMessage.value = isPermissionDeniedError(error)
      ? getPermissionDeniedMessage(error, "Você não tem permissão para alterar esta sala.")
      : getRequestErrorMessage(error, "Não foi possível atualizar a sala.");
  }
}

async function removeRoom() {
  submitState.value = "REMOVENDO";
  submitMessage.value = "";

  try {
    await roomsStore.deleteRoom(roomId.value, deleteReason.value.trim());
    submitState.value = "REMOVED";
    submitMessage.value = "Sala excluída com sucesso. Redirecionando...";
    router.push({ name: "rooms-list" });
  } catch (error) {
    submitState.value = isPermissionDeniedError(error) ? "FORBIDDEN" : "ERROR_SUBMISSAO";
    submitMessage.value = isPermissionDeniedError(error)
      ? getPermissionDeniedMessage(error, "Você não tem permissão para excluir esta sala.")
      : getRequestErrorMessage(error, "Não foi possível excluir a sala.");
  }
}

function goBack() {
  router.push({ name: "rooms-list" });
}

function handleLogout() {
  authStore.logout();
  router.push({ name: "login" });
}
</script>

<style scoped>
.edit-room-card {
  overflow: hidden;
}
</style>
