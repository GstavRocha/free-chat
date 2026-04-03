<template>
  <article
    class="chat-message-item"
    :class="{
      'chat-message-item--own': isOwnMessage,
      'chat-message-item--deleted': isDeleted,
    }"
  >
    <header class="chat-message-item__header">
      <div>
        <div class="chat-message-item__author">{{ authorLabel }}</div>
        <div class="chat-message-item__meta">
          <span>{{ messageTypeLabel }}</span>
          <span>•</span>
          <span>{{ createdAtLabel }}</span>
          <span v-if="wasEdited">• editada</span>
        </div>
      </div>

      <MessageActionsMenu
        v-if="canManage && !isDeleted"
        :disabled="busy"
        @edit-requested="startEdit"
        @remove-requested="$emit('remove-requested', message.id)"
      />
    </header>

    <div v-if="editing" class="chat-message-item__editor">
      <v-textarea
        v-model="editDraft"
        label="Editar mensagem"
        variant="outlined"
        rows="3"
        auto-grow
        hide-details="auto"
        :disabled="busy"
      />

      <div class="chat-message-item__editor-actions">
        <v-btn variant="text" :disabled="busy" @click="cancelEdit">Cancelar</v-btn>
        <v-btn color="primary" :loading="busy" @click="submitEdit">Salvar</v-btn>
      </div>
    </div>

    <div v-else class="chat-message-item__content">
      <pre v-if="isCodeMessage && !isDeleted" class="chat-message-item__code">{{ contentLabel }}</pre>
      <p v-else class="chat-message-item__text">{{ contentLabel }}</p>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import MessageActionsMenu from "./MessageActionsMenu.vue";

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  currentUserId: {
    type: [String, Number],
    default: null,
  },
  busy: {
    type: Boolean,
    default: false,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit-requested", "remove-requested"]);

const editing = ref(false);
const editDraft = ref("");

const isOwnMessage = computed(
  () => String(props.message?.autor?.id || props.message?.autorId || "") === String(props.currentUserId || ""),
);

const isDeleted = computed(() => Boolean(props.message?.excluidoEm));
const isCodeMessage = computed(() => props.message?.tipoMensagem === "CODIGO");

const authorLabel = computed(() => {
  if (isOwnMessage.value) {
    return "Você";
  }

  return props.message?.autor?.nomeCompleto || `Participante #${props.message?.autorId || props.message?.autor?.id || "?"}`;
});

const messageTypeLabel = computed(() => (isCodeMessage.value ? "Código" : "Texto"));

const contentLabel = computed(() => {
  if (isDeleted.value) {
    return "Mensagem removida.";
  }

  return props.message?.conteudo || "";
});

const wasEdited = computed(() => {
  const createdAt = props.message?.criadoEm;
  const updatedAt = props.message?.atualizadoEm;

  return Boolean(createdAt && updatedAt && createdAt !== updatedAt);
});

const createdAtLabel = computed(() => {
  if (!props.message?.criadoEm) {
    return "Agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(props.message.criadoEm));
});

watch(
  () => props.message?.conteudo,
  (value) => {
    if (!editing.value) {
      editDraft.value = value || "";
    }
  },
  { immediate: true },
);

function startEdit() {
  editing.value = true;
  editDraft.value = props.message?.conteudo || "";
}

function cancelEdit() {
  editing.value = false;
  editDraft.value = props.message?.conteudo || "";
}

function submitEdit() {
  emit("edit-requested", {
    messageId: props.message.id,
    conteudo: editDraft.value,
    done: () => {
      editing.value = false;
    },
  });
}
</script>

<style scoped>
.chat-message-item {
  background: var(--app-message-surface);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1rem;
  justify-self: start;
  max-width: min(46rem, 88%);
  min-width: min(18rem, 100%);
  padding: 1rem;
  width: fit-content;
}

.chat-message-item--own {
  border-color: rgba(26, 95, 61, 0.25);
  box-shadow: 0 10px 24px rgba(26, 95, 61, 0.08);
  justify-self: end;
  margin-left: auto;
}

.chat-message-item--deleted {
  opacity: 0.72;
}

.chat-message-item__header {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.chat-message-item--own .chat-message-item__header {
  text-align: right;
}

.chat-message-item--own .chat-message-item__meta {
  justify-content: flex-end;
}

.chat-message-item--own .chat-message-item__content {
  text-align: right;
}

.chat-message-item__author {
  font-weight: 700;
}

.chat-message-item__meta {
  color: var(--app-muted-text);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.8rem;
  gap: 0.35rem;
  margin-top: 0.15rem;
}

.chat-message-item__content {
  margin-top: 0.9rem;
}

.chat-message-item__text,
.chat-message-item__code {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-message-item__code {
  background: #0f172a;
  border-radius: 0.9rem;
  color: #e2e8f0;
  font-family: "Fira Code", "JetBrains Mono", monospace;
  font-size: 0.88rem;
  overflow-x: auto;
  padding: 0.9rem;
}

.chat-message-item__editor {
  margin-top: 0.9rem;
}

.chat-message-item__editor-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

@media (max-width: 700px) {
  .chat-message-item {
    max-width: 100%;
  }
}
</style>
