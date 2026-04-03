<template>
  <AppLayout
    title="Criar sala"
    :user-name="authStore.user?.nomeCompleto || ''"
    :user-role="authStore.user?.papel || ''"
    @logout="handleLogout"
  >
    <v-row justify="center">
      <v-col cols="12" lg="8">
        <v-card class="create-room-card" rounded="xl" elevation="6">
          <v-card-item>
            <v-card-title class="text-h4">Nova sala pública</v-card-title>
            <v-card-subtitle>
              Defina o nome e uma descrição opcional para abrir um novo espaço de conversa.
            </v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <FormStatusAlert
              :visible="statusAlert.visible"
              :type="statusAlert.type"
              :message="statusAlert.message"
            />

            <RoomForm
              :form-data="form"
              :errors="errors"
              :loading="isSaving"
              @update:field="updateField"
              @submit="submitRoom"
            />

            <RoomFormActions
              :loading="isSaving"
              submit-label="Criar sala"
              @cancel="goBack"
              @submit="submitRoom"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </AppLayout>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getPermissionDeniedMessage,
  isPermissionDeniedError,
} from "../auth/permissionErrorPresentation";
import FormStatusAlert from "../components/forms/FormStatusAlert.vue";
import RoomForm from "../components/rooms/RoomForm.vue";
import RoomFormActions from "../components/rooms/RoomFormActions.vue";
import AppLayout from "../layouts/AppLayout.vue";
import { getRequestErrorMessage } from "../services/api/requestErrorPresentation";
import { useAuthStore } from "../stores/authStore";
import { useRoomsStore } from "../stores/roomsStore";

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

const isSaving = computed(() => submitState.value === "SALVANDO");

const statusAlert = computed(() => {
  if (submitState.value === "SUCCESS") {
    return {
      visible: true,
      type: "success",
      message: submitMessage.value || "Sala criada com sucesso.",
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
      message: submitMessage.value || "Não foi possível criar a sala.",
    };
  }

  if (submitState.value === "FORBIDDEN") {
    return {
      visible: true,
      type: "error",
      message: submitMessage.value || "Você não tem permissão para criar salas.",
    };
  }

  return {
    visible: false,
    type: "info",
    message: "",
  };
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

async function submitRoom() {
  const valid = validateForm();

  if (!valid) {
    submitState.value = "ERROR_VALIDACAO";
    submitMessage.value = "O nome da sala é obrigatório.";
    return;
  }

  submitState.value = "SALVANDO";
  submitMessage.value = "";

  try {
    const result = await roomsStore.createRoom({
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
    });

    submitState.value = "SUCCESS";
    submitMessage.value = "Sala criada com sucesso. Redirecionando...";

    if (result.sala?.id) {
      router.push({
        name: "room-chat",
        params: {
          id: result.sala.id,
        },
      });
      return;
    }

    router.push({ name: "rooms-list" });
  } catch (error) {
    submitState.value = isPermissionDeniedError(error) ? "FORBIDDEN" : "ERROR_SUBMISSAO";
    submitMessage.value = isPermissionDeniedError(error)
      ? getPermissionDeniedMessage(error, "Você não tem permissão para criar salas.")
      : getRequestErrorMessage(error, "Não foi possível criar a sala.");
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
.create-room-card {
  overflow: hidden;
}
</style>
