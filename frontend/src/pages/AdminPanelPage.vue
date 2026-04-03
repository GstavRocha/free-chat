<template>
  <AdminLayout
    title="Painel administrativo"
    :user-name="authStore.user?.nomeCompleto || ''"
    :user-role="authStore.user?.papel || ''"
    @logout="handleLogout"
  >
    <section class="admin-panel-hero">
      <p class="admin-panel-hero__eyebrow">Área restrita</p>
      <h1 class="admin-panel-hero__title">Moderação operacional e cadastro em um só lugar</h1>
      <p class="admin-panel-hero__text">
        O painel agora concentra solicitações pendentes, bloqueio de usuários, gestão de salas,
        remoção administrativa de mensagens e trilha recente de auditoria.
      </p>

      <div class="admin-panel-hero__actions">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'rooms-list' }">
          Voltar para salas
        </v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-refresh" @click="reloadAdminModules">
          Atualizar módulos
        </v-btn>
      </div>
    </section>

    <AdminStatusAlert
      :visible="Boolean(statusMessage)"
      :type="statusType"
      :message="statusMessage"
    />

    <v-row class="mt-1">
      <v-col cols="12" xl="7">
        <PendingRequestsList
          :requests="pendingRequests"
          :loading="isLoadingRequests"
          :error-message="requestsError"
          :selected-request-id="selectedRequestId"
          @select-request="handleSelectRequest"
        />
      </v-col>

      <v-col cols="12" xl="5">
        <ApprovalActionPanel
          :selected-request="selectedRequest"
          :rejection-reason="rejectionReason"
          :loading="isSubmittingAction"
          :approve-loading="activeAction === 'approve'"
          :reject-loading="activeAction === 'reject'"
          @update:rejection-reason="rejectionReason = $event"
          @approve="handleApproveRequest"
          @reject="handleRejectRequest"
        />
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" xl="4">
        <v-card rounded="xl" elevation="3">
          <v-card-item>
            <v-card-title class="text-h6">Usuários administrativos</v-card-title>
            <v-card-subtitle>Bloqueio operacional de contas aprovadas.</v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <v-progress-linear
              v-if="isLoadingUsers"
              color="secondary"
              indeterminate
              class="mb-4"
            />

            <v-alert
              v-else-if="usersError"
              type="error"
              variant="tonal"
              rounded="lg"
              class="mb-4"
            >
              {{ usersError }}
            </v-alert>

            <v-list
              v-else
              class="admin-panel-page__list"
              lines="two"
              density="comfortable"
            >
              <v-list-item
                v-for="user in manageableUsers"
                :key="user.id"
                :active="selectedUserId === user.id"
                rounded="lg"
                @click="selectUser(user)"
              >
                <template #prepend>
                  <v-avatar color="secondary" variant="tonal">
                    {{ user.nomeCompleto.slice(0, 1).toUpperCase() }}
                  </v-avatar>
                </template>

                <v-list-item-title>{{ user.nomeCompleto }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ user.papel }} • {{ formatCpf(user.cpf) }} • {{ user.status }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <div class="admin-panel-page__selection" v-if="selectedUser">
              <strong>{{ selectedUser.nomeCompleto }}</strong>
              <span>{{ selectedUser.papel }} • {{ selectedUser.status }}</span>
            </div>

            <v-textarea
              v-model="userBlockReason"
              label="Motivo do bloqueio"
              variant="outlined"
              rows="3"
              auto-grow
              :disabled="!selectedUser || isSubmittingAction"
              hint="Obrigatório para bloquear o usuário."
              persistent-hint
            />

            <v-btn
              color="secondary"
              prepend-icon="mdi-account-cancel-outline"
              :disabled="!selectedUser || !userBlockReason.trim() || isSubmittingAction"
              :loading="activeAction === 'block-user'"
              @click="handleBlockUser"
            >
              Bloquear usuário
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" xl="4">
        <v-card rounded="xl" elevation="3">
          <v-card-item>
            <v-card-title class="text-h6">Salas moderáveis</v-card-title>
            <v-card-subtitle>Silencie, encerre ou publique avisos administrativos.</v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <v-progress-linear
              v-if="isLoadingRooms"
              color="warning"
              indeterminate
              class="mb-4"
            />

            <v-alert
              v-else-if="roomsError"
              type="error"
              variant="tonal"
              rounded="lg"
              class="mb-4"
            >
              {{ roomsError }}
            </v-alert>

            <v-list
              v-else
              class="admin-panel-page__list"
              lines="two"
              density="comfortable"
            >
              <v-list-item
                v-for="room in rooms"
                :key="room.id"
                :active="selectedRoomId === room.id"
                rounded="lg"
                @click="selectRoom(room)"
              >
                <template #append>
                  <v-chip size="small" variant="tonal" :color="roomStatusColor(room.status)">
                    {{ room.status }}
                  </v-chip>
                </template>

                <v-list-item-title>{{ room.nome }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ room.descricao || "Sala sem descrição adicional." }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <div class="admin-panel-page__selection" v-if="selectedRoom">
              <strong>{{ selectedRoom.nome }}</strong>
              <span>Status atual: {{ selectedRoom.status }}</span>
            </div>

            <v-textarea
              v-model="roomReason"
              label="Motivo da ação na sala"
              variant="outlined"
              rows="3"
              auto-grow
              :disabled="!selectedRoom || isSubmittingAction"
              hint="Obrigatório para silenciar ou excluir."
              persistent-hint
            />

            <v-textarea
              v-model="roomNotice"
              label="Aviso de moderação"
              variant="outlined"
              rows="3"
              auto-grow
              :disabled="!selectedRoom || isSubmittingAction"
              hint="Mensagem visível aos participantes da sala."
              persistent-hint
            />

            <div class="admin-panel-page__actions">
              <v-btn
                color="warning"
                variant="tonal"
                prepend-icon="mdi-bell-cancel-outline"
                :disabled="!selectedRoom || !roomReason.trim() || isSubmittingAction"
                :loading="activeAction === 'silence-room'"
                @click="handleSilenceRoom"
              >
                Silenciar
              </v-btn>

              <v-btn
                color="error"
                variant="tonal"
                prepend-icon="mdi-delete-outline"
                :disabled="!selectedRoom || !roomReason.trim() || isSubmittingAction"
                :loading="activeAction === 'delete-room'"
                @click="handleDeleteRoom"
              >
                Excluir logicamente
              </v-btn>

              <v-btn
                color="primary"
                prepend-icon="mdi-bullhorn-outline"
                :disabled="!selectedRoom || !roomNotice.trim() || isSubmittingAction"
                :loading="activeAction === 'send-notice'"
                @click="handleCreateNotice"
              >
                Enviar aviso
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" xl="4">
        <v-card rounded="xl" elevation="3">
          <v-card-item>
            <v-card-title class="text-h6">Mensagens da sala selecionada</v-card-title>
            <v-card-subtitle>Consulta administrativa com remoção por motivo.</v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <v-progress-linear
              v-if="isLoadingMessages"
              color="error"
              indeterminate
              class="mb-4"
            />

            <v-alert
              v-else-if="messagesError"
              type="error"
              variant="tonal"
              rounded="lg"
              class="mb-4"
            >
              {{ messagesError }}
            </v-alert>

            <v-alert
              v-else-if="!selectedRoom"
              type="info"
              variant="tonal"
              rounded="lg"
              class="mb-4"
            >
              Selecione uma sala para carregar as mensagens moderáveis.
            </v-alert>

            <v-list
              v-else
              class="admin-panel-page__list admin-panel-page__messages-list"
              lines="three"
              density="comfortable"
            >
              <v-list-item
                v-for="message in roomMessages"
                :key="message.id"
                :active="selectedMessageId === message.id"
                rounded="lg"
                @click="selectMessage(message)"
              >
                <template #append>
                  <v-chip
                    size="small"
                    variant="tonal"
                    :color="message.excluidoEm ? 'default' : 'error'"
                  >
                    {{ message.excluidoEm ? "REMOVIDA" : message.tipoMensagem }}
                  </v-chip>
                </template>

                <v-list-item-title>
                  {{ message.autor?.nomeCompleto || "Autor desconhecido" }}
                </v-list-item-title>
                <v-list-item-subtitle class="admin-panel-page__message-content">
                  {{ message.conteudo }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <div class="admin-panel-page__selection" v-if="selectedMessage">
              <strong>Mensagem selecionada</strong>
              <span>{{ selectedMessage.autor?.nomeCompleto || "Sem autoria visível" }}</span>
            </div>

            <v-textarea
              v-model="messageReason"
              label="Motivo da remoção"
              variant="outlined"
              rows="3"
              auto-grow
              :disabled="!selectedMessage || isSubmittingAction"
              hint="Obrigatório para remoção administrativa."
              persistent-hint
            />

            <v-btn
              color="error"
              prepend-icon="mdi-message-off-outline"
              :disabled="!canDeleteSelectedMessage"
              :loading="activeAction === 'delete-message'"
              @click="handleDeleteMessage"
            >
              Remover mensagem
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12">
        <v-card rounded="xl" elevation="3">
          <v-card-item>
            <v-card-title class="text-h6">Logs recentes de moderação</v-card-title>
            <v-card-subtitle>Rastreabilidade das ações administrativas recentes.</v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <v-progress-linear
              v-if="isLoadingLogs"
              color="primary"
              indeterminate
              class="mb-4"
            />

            <v-alert
              v-else-if="logsError"
              type="error"
              variant="tonal"
              rounded="lg"
            >
              {{ logsError }}
            </v-alert>

            <v-table v-else density="comfortable" class="admin-panel-page__table">
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Alvo</th>
                  <th>Motivo</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in moderationLogs.slice(0, 8)" :key="log.id">
                  <td>{{ log.tipoAcao }}</td>
                  <td>{{ describeLogTarget(log) }}</td>
                  <td>{{ log.motivo }}</td>
                  <td>{{ formatDateTime(log.criadoEm) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getPermissionDeniedMessage,
  isPermissionDeniedError,
} from "../auth/permissionErrorPresentation";
import AdminStatusAlert from "../components/admin/AdminStatusAlert.vue";
import ApprovalActionPanel from "../components/admin/ApprovalActionPanel.vue";
import PendingRequestsList from "../components/admin/PendingRequestsList.vue";
import AdminLayout from "../layouts/AdminLayout.vue";
import { ApiClientError } from "../services/api/apiClient";
import { getRequestErrorMessage } from "../services/api/requestErrorPresentation";
import {
  blockUser,
  createModerationNotice,
  deleteMessageByModeration,
  deleteRoomByModeration,
  listAdministrativeUsers,
  listModerationLogs,
  listModerationRoomMessages,
  listModerationRooms,
  silenceRoom,
} from "../services/api/moderacaoApi";
import {
  approveSignupRequest,
  listSignupRequests,
  rejectSignupRequest,
} from "../services/api/solicitacoesCadastroApi";
import { useAuthStore } from "../stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const requests = ref([]);
const users = ref([]);
const rooms = ref([]);
const roomMessages = ref([]);
const moderationLogs = ref([]);

const isLoadingRequests = ref(false);
const isLoadingUsers = ref(false);
const isLoadingRooms = ref(false);
const isLoadingMessages = ref(false);
const isLoadingLogs = ref(false);

const requestsError = ref("");
const usersError = ref("");
const roomsError = ref("");
const messagesError = ref("");
const logsError = ref("");

const selectedRequestId = ref("");
const selectedUserId = ref("");
const selectedRoomId = ref("");
const selectedMessageId = ref("");

const rejectionReason = ref("");
const userBlockReason = ref("");
const roomReason = ref("");
const roomNotice = ref("");
const messageReason = ref("");

const isSubmittingAction = ref(false);
const activeAction = ref("");
const actionFeedback = ref("");
const actionFeedbackType = ref("success");

const pendingRequests = computed(() =>
  requests.value.filter((request) => request.statusSolicitacao === "PENDENTE"),
);

const manageableUsers = computed(() =>
  users.value.filter((user) => user.status !== "BLOQUEADO"),
);

const selectedRequest = computed(
  () => pendingRequests.value.find((request) => request.id === selectedRequestId.value) || null,
);

const selectedUser = computed(
  () => users.value.find((user) => user.id === selectedUserId.value) || null,
);

const selectedRoom = computed(
  () => rooms.value.find((room) => room.id === selectedRoomId.value) || null,
);

const selectedMessage = computed(
  () => roomMessages.value.find((message) => message.id === selectedMessageId.value) || null,
);

const canDeleteSelectedMessage = computed(
  () =>
    Boolean(
      selectedMessage.value
      && !selectedMessage.value.excluidoEm
      && messageReason.value.trim()
      && !isSubmittingAction.value,
    ),
);

const statusType = computed(() => {
  if (requestsError.value || usersError.value || roomsError.value || messagesError.value || logsError.value) {
    return "error";
  }

  if (actionFeedback.value) {
    return actionFeedbackType.value;
  }

  if (isLoadingRequests.value || isLoadingUsers.value || isLoadingRooms.value || isLoadingLogs.value) {
    return "info";
  }

  return "success";
});

const statusMessage = computed(() => {
  if (requestsError.value || usersError.value || roomsError.value || messagesError.value || logsError.value) {
    return [
      requestsError.value,
      usersError.value,
      roomsError.value,
      messagesError.value,
      logsError.value,
    ].find(Boolean);
  }

  if (actionFeedback.value) {
    return actionFeedback.value;
  }

  if (isLoadingRequests.value || isLoadingUsers.value || isLoadingRooms.value || isLoadingLogs.value) {
    return "Carregando módulos administrativos do backend.";
  }

  return "Painel administrativo sincronizado com as ações de moderação disponíveis.";
});

onMounted(() => {
  reloadAdminModules();
});

function handleLogout() {
  authStore.logout();
  router.push({ name: "login" });
}

async function reloadAdminModules() {
  await Promise.all([
    loadPendingRequests(),
    loadUsers(),
    loadRooms(),
    loadLogs(),
  ]);
}

async function loadPendingRequests() {
  isLoadingRequests.value = true;
  requestsError.value = "";

  try {
    requests.value = await listSignupRequests();
  } catch (error) {
    requests.value = [];
    requestsError.value = getFriendlyAdminError(
      error,
      "Não foi possível carregar as solicitações pendentes.",
    );
  } finally {
    isLoadingRequests.value = false;
    ensureSelectedRequestStillValid();
  }
}

async function loadUsers() {
  isLoadingUsers.value = true;
  usersError.value = "";

  try {
    users.value = await listAdministrativeUsers();
  } catch (error) {
    users.value = [];
    usersError.value = getFriendlyAdminError(error, "Não foi possível carregar os usuários administrativos.");
  } finally {
    isLoadingUsers.value = false;
    ensureSelectedUserStillValid();
  }
}

async function loadRooms() {
  isLoadingRooms.value = true;
  roomsError.value = "";

  try {
    rooms.value = await listModerationRooms();
  } catch (error) {
    rooms.value = [];
    roomsError.value = getFriendlyAdminError(error, "Não foi possível carregar as salas moderáveis.");
  } finally {
    isLoadingRooms.value = false;
    ensureSelectedRoomStillValid();
  }
}

async function loadLogs() {
  isLoadingLogs.value = true;
  logsError.value = "";

  try {
    moderationLogs.value = await listModerationLogs();
  } catch (error) {
    moderationLogs.value = [];
    logsError.value = getFriendlyAdminError(error, "Não foi possível carregar os logs de moderação.");
  } finally {
    isLoadingLogs.value = false;
  }
}

async function loadRoomMessages(roomId) {
  if (!roomId) {
    roomMessages.value = [];
    selectedMessageId.value = "";
    return;
  }

  isLoadingMessages.value = true;
  messagesError.value = "";

  try {
    roomMessages.value = await listModerationRoomMessages(roomId);
  } catch (error) {
    roomMessages.value = [];
    messagesError.value = getFriendlyAdminError(error, "Não foi possível carregar as mensagens desta sala.");
  } finally {
    isLoadingMessages.value = false;
    ensureSelectedMessageStillValid();
  }
}

function handleSelectRequest(request) {
  selectedRequestId.value = request.id;
  rejectionReason.value = request.motivoRevisao || "";
  actionFeedback.value = "";
}

function selectUser(user) {
  selectedUserId.value = user.id;
  userBlockReason.value = "";
  actionFeedback.value = "";
}

function selectRoom(room) {
  selectedRoomId.value = room.id;
  selectedMessageId.value = "";
  roomReason.value = "";
  roomNotice.value = "";
  messageReason.value = "";
  actionFeedback.value = "";
  loadRoomMessages(room.id);
}

function selectMessage(message) {
  selectedMessageId.value = message.id;
  messageReason.value = "";
  actionFeedback.value = "";
}

function ensureSelectedRequestStillValid() {
  if (!selectedRequestId.value) {
    selectedRequestId.value = pendingRequests.value[0]?.id || "";
    return;
  }

  if (!pendingRequests.value.some((request) => request.id === selectedRequestId.value)) {
    selectedRequestId.value = pendingRequests.value[0]?.id || "";
    rejectionReason.value = "";
  }
}

function ensureSelectedUserStillValid() {
  if (!selectedUserId.value) {
    selectedUserId.value = manageableUsers.value[0]?.id || "";
    return;
  }

  if (!users.value.some((user) => user.id === selectedUserId.value)) {
    selectedUserId.value = manageableUsers.value[0]?.id || "";
    userBlockReason.value = "";
  }
}

function ensureSelectedRoomStillValid() {
  if (!selectedRoomId.value) {
    selectedRoomId.value = rooms.value[0]?.id || "";

    if (selectedRoomId.value) {
      loadRoomMessages(selectedRoomId.value);
    }

    return;
  }

  if (!rooms.value.some((room) => room.id === selectedRoomId.value)) {
    selectedRoomId.value = rooms.value[0]?.id || "";
    roomReason.value = "";
    roomNotice.value = "";

    if (selectedRoomId.value) {
      loadRoomMessages(selectedRoomId.value);
    } else {
      roomMessages.value = [];
    }
  }
}

function ensureSelectedMessageStillValid() {
  if (!selectedMessageId.value) {
    selectedMessageId.value = roomMessages.value[0]?.id || "";
    return;
  }

  if (!roomMessages.value.some((message) => message.id === selectedMessageId.value)) {
    selectedMessageId.value = roomMessages.value[0]?.id || "";
    messageReason.value = "";
  }
}

function replaceRequest(updatedRequest) {
  requests.value = requests.value.map((request) =>
    request.id === updatedRequest.id ? updatedRequest : request,
  );
  ensureSelectedRequestStillValid();
}

function replaceUser(updatedUser) {
  users.value = users.value.map((user) =>
    user.id === updatedUser.id ? updatedUser : user,
  );
  ensureSelectedUserStillValid();
}

function replaceRoom(updatedRoom) {
  rooms.value = rooms.value.map((room) =>
    room.id === updatedRoom.id ? updatedRoom : room,
  );
  ensureSelectedRoomStillValid();
}

function replaceMessage(updatedMessage) {
  roomMessages.value = roomMessages.value.map((message) =>
    message.id === updatedMessage.id ? updatedMessage : message,
  );
  ensureSelectedMessageStillValid();
}

async function runAdminAction(actionName, handler) {
  if (isSubmittingAction.value) {
    return;
  }

  isSubmittingAction.value = true;
  activeAction.value = actionName;
  actionFeedback.value = "";

  try {
    await handler();
    await loadLogs();
  } catch (error) {
    actionFeedbackType.value = "error";
    actionFeedback.value = getFriendlyAdminError(error, "Não foi possível concluir a ação administrativa.");
  } finally {
    isSubmittingAction.value = false;
    activeAction.value = "";
  }
}

async function handleApproveRequest() {
  if (!selectedRequest.value) {
    return;
  }

  await runAdminAction("approve", async () => {
    const result = await approveSignupRequest(selectedRequest.value.id);
    replaceRequest(result.solicitacao);
    actionFeedbackType.value = "success";
    actionFeedback.value = `Solicitação de ${result.solicitacao?.nomeSolicitado || "cadastro"} aprovada com sucesso.`;
  });
}

async function handleRejectRequest() {
  if (!selectedRequest.value || !rejectionReason.value.trim()) {
    return;
  }

  await runAdminAction("reject", async () => {
    const result = await rejectSignupRequest(selectedRequest.value.id, rejectionReason.value.trim());
    replaceRequest(result.solicitacao);
    rejectionReason.value = "";
    actionFeedbackType.value = "warning";
    actionFeedback.value = `Solicitação de ${result.solicitacao?.nomeSolicitado || "cadastro"} rejeitada com sucesso.`;
  });
}

async function handleBlockUser() {
  if (!selectedUser.value || !userBlockReason.value.trim()) {
    return;
  }

  await runAdminAction("block-user", async () => {
    const result = await blockUser(selectedUser.value.id, userBlockReason.value.trim());
    replaceUser(result.usuario);
    userBlockReason.value = "";
    actionFeedbackType.value = "warning";
    actionFeedback.value = `Usuário ${result.usuario?.nomeCompleto || "selecionado"} bloqueado com sucesso.`;
  });
}

async function handleSilenceRoom() {
  if (!selectedRoom.value || !roomReason.value.trim()) {
    return;
  }

  await runAdminAction("silence-room", async () => {
    const result = await silenceRoom(selectedRoom.value.id, roomReason.value.trim());
    replaceRoom(result.sala);
    actionFeedbackType.value = "warning";
    actionFeedback.value = `Sala ${result.sala?.nome || "selecionada"} silenciada com sucesso.`;
  });
}

async function handleDeleteRoom() {
  if (!selectedRoom.value || !roomReason.value.trim()) {
    return;
  }

  await runAdminAction("delete-room", async () => {
    const result = await deleteRoomByModeration(selectedRoom.value.id, roomReason.value.trim());
    replaceRoom(result.sala);
    roomMessages.value = [];
    selectedMessageId.value = "";
    actionFeedbackType.value = "error";
    actionFeedback.value = `Sala ${result.sala?.nome || "selecionada"} excluída logicamente com sucesso.`;
  });
}

async function handleCreateNotice() {
  if (!selectedRoom.value || !roomNotice.value.trim()) {
    return;
  }

  await runAdminAction("send-notice", async () => {
    const result = await createModerationNotice(selectedRoom.value.id, roomNotice.value.trim());
    roomMessages.value = [...roomMessages.value, result.mensagem];
    roomNotice.value = "";
    actionFeedbackType.value = "success";
    actionFeedback.value = "Aviso de moderação enviado para a sala selecionada.";
  });
}

async function handleDeleteMessage() {
  if (!selectedMessage.value || !messageReason.value.trim() || selectedMessage.value.excluidoEm) {
    return;
  }

  await runAdminAction("delete-message", async () => {
    const result = await deleteMessageByModeration(selectedMessage.value.id, messageReason.value.trim());
    replaceMessage(result.mensagem);
    messageReason.value = "";
    actionFeedbackType.value = "error";
    actionFeedback.value = "Mensagem removida administrativamente com sucesso.";
  });
}

function getFriendlyAdminError(error, fallbackMessage) {
  if (!(error instanceof ApiClientError)) {
    return fallbackMessage;
  }

  if (isPermissionDeniedError(error)) {
    return getPermissionDeniedMessage(
      error,
      "Seu usuário não tem permissão para executar esta ação administrativa.",
    );
  }

  if (error.code === "AUTH_USER_NOT_APPROVED") {
    return "Seu acesso administrativo não está apto para operar o painel.";
  }

  return getRequestErrorMessage(error, fallbackMessage);
}

function formatCpf(value) {
  const digits = String(value || "").replace(/\D/gu, "");

  if (digits.length !== 11) {
    return value || "CPF não informado";
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/u, "$1.$2.$3-$4");
}

function formatDateTime(value) {
  if (!value) {
    return "Agora há pouco";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function roomStatusColor(status) {
  if (status === "ATIVA") {
    return "success";
  }

  if (status === "SILENCIADA") {
    return "warning";
  }

  if (status === "EXCLUIDA") {
    return "error";
  }

  return "default";
}

function describeLogTarget(log) {
  if (log.usuarioAlvo) {
    return `Usuário ${log.usuarioAlvo.slice(0, 8)}`;
  }

  if (log.salaAlvo) {
    return `Sala ${log.salaAlvo.slice(0, 8)}`;
  }

  if (log.solicitacaoAlvo) {
    return `Solicitação ${log.solicitacaoAlvo.slice(0, 8)}`;
  }

  if (log.mensagemAlvo) {
    return `Mensagem ${log.mensagemAlvo.slice(0, 8)}`;
  }

  return "Alvo não identificado";
}
</script>

<style scoped>
.admin-panel-hero {
  background: var(--app-hero-gradient);
  border-radius: 28px;
  color: var(--app-panel-strong-text);
  margin-bottom: 1.25rem;
  padding: 2rem;
}

.admin-panel-hero__eyebrow {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.admin-panel-hero__title {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.04;
  margin-bottom: 1rem;
}

.admin-panel-hero__text {
  color: var(--app-panel-muted-text);
  line-height: 1.6;
  max-width: 48rem;
}

.admin-panel-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.admin-panel-page__list {
  background: transparent;
  max-height: 18rem;
  overflow: auto;
  padding: 0;
}

.admin-panel-page__messages-list {
  max-height: 22rem;
}

.admin-panel-page__selection {
  display: grid;
  gap: 0.2rem;
  margin: 1rem 0;
}

.admin-panel-page__selection span {
  color: var(--app-muted-text);
  font-size: 0.95rem;
}

.admin-panel-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.admin-panel-page__message-content {
  -webkit-line-clamp: 3;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  white-space: normal;
}

.admin-panel-page__table :deep(th) {
  font-weight: 700;
}
</style>
