<template>
  <PublicLayout page-class="registration-page">
    <v-card class="registration-shell" rounded="xl" elevation="8">
      <div class="registration-shell__brand">
        <p class="registration-shell__eyebrow">Solicitação de cadastro</p>
        <h1 class="registration-shell__title">Peça acesso ao ambiente institucional</h1>
        <p class="registration-shell__text">
          Preencha seus dados e envie a solicitação para análise administrativa. Os campos extras
          aparecem de acordo com o papel escolhido.
        </p>

        <ul class="registration-shell__list">
          <li>Aluno: série e turma</li>
          <li>Professor: departamento</li>
          <li>Funcionário: setor</li>
        </ul>

        <div class="registration-shell__links">
          <RouterLink class="registration-shell__link" to="/login">Voltar para entrada</RouterLink>
          <RouterLink class="registration-shell__link" to="/login">Já tenho acesso</RouterLink>
        </div>
      </div>

      <v-card-text class="registration-shell__panel">
        <FormStatusAlert
          :visible="statusAlert.visible"
          :type="statusAlert.type"
          :message="statusAlert.message"
        />

        <RegistrationForm
          :form-data="form"
          :errors="errors"
          :loading="isSubmitting"
          @update:field="updateField"
          @papel-changed="updateRole"
          @submit="submitRegistrationRequest"
        />
      </v-card-text>
    </v-card>
  </PublicLayout>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { ApiClientError } from "../services/api/apiClient";
import { getRequestErrorMessage } from "../services/api/requestErrorPresentation";
import { createSignupRequest } from "../services/api/solicitacoesCadastroApi";
import FormStatusAlert from "../components/forms/FormStatusAlert.vue";
import RegistrationForm from "../components/registration/RegistrationForm.vue";
import PublicLayout from "../layouts/PublicLayout.vue";

const form = reactive({
  nomeCompleto: "",
  cpf: "",
  senha: "",
  papel: "",
  serie: "",
  turma: "",
  departamento: "",
  setor: "",
});

const validationErrors = ref({});
const formStatus = ref("IDLE");
const formMessage = ref("");
const isSubmitting = computed(() => formStatus.value === "ENVIANDO");

const statusAlert = computed(() => {
  if (formStatus.value === "SUCESSO_ENVIO") {
    return {
      visible: true,
      type: "success",
      message: formMessage.value || "Solicitação enviada com sucesso. Aguarde a análise administrativa.",
    };
  }

  if (formStatus.value === "ERRO_VALIDACAO") {
    return {
      visible: true,
      type: "warning",
      message: formMessage.value || "Preencha os campos obrigatórios para continuar.",
    };
  }

  if (formStatus.value === "ERRO_SUBMISSAO") {
    return {
      visible: true,
      type: "error",
      message: formMessage.value || "Não foi possível enviar a solicitação de cadastro.",
    };
  }

  return {
    visible: false,
    type: "info",
    message: "",
  };
});

const errors = computed(() => validationErrors.value);

function updateField({ field, value }) {
  form[field] = value;
  formStatus.value = "EDITANDO";
  formMessage.value = "";
  validationErrors.value = {
    ...validationErrors.value,
    [field]: "",
  };
}

function updateRole(role) {
  form.papel = role;
  form.serie = "";
  form.turma = "";
  form.departamento = "";
  form.setor = "";
  formStatus.value = "EDITANDO";
  formMessage.value = "";
  validationErrors.value = {
    ...validationErrors.value,
    papel: "",
    serie: "",
    turma: "",
    departamento: "",
    setor: "",
  };
}

function validateForm() {
  const nextErrors = {};

  if (!form.nomeCompleto.trim()) {
    nextErrors.nomeCompleto = "Informe o nome completo.";
  }

  if (!form.cpf.trim()) {
    nextErrors.cpf = "Informe o CPF.";
  }

  if (!form.senha.trim()) {
    nextErrors.senha = "Informe a senha.";
  }

  if (!form.papel) {
    nextErrors.papel = "Selecione um papel.";
  }

  if (form.papel === "ALUNO") {
    if (!form.serie.trim()) {
      nextErrors.serie = "Informe a série.";
    }

    if (!form.turma.trim()) {
      nextErrors.turma = "Informe a turma.";
    }
  }

  if (form.papel === "PROFESSOR" && !form.departamento.trim()) {
    nextErrors.departamento = "Informe o departamento.";
  }

  if (form.papel === "FUNCIONARIO" && !form.setor.trim()) {
    nextErrors.setor = "Informe o setor.";
  }

  validationErrors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
}

function buildSignupPayload() {
  return {
    nome: form.nomeCompleto.trim(),
    cpf: form.cpf.trim(),
    senha: form.senha,
    papel: form.papel,
    serie: form.papel === "ALUNO" ? form.serie.trim() : undefined,
    turma: form.papel === "ALUNO" ? form.turma.trim() : undefined,
    departamento: form.papel === "PROFESSOR" ? form.departamento.trim() : undefined,
    setor: form.papel === "FUNCIONARIO" ? form.setor.trim() : undefined,
  };
}

function mapSignupError(error) {
  if (!(error instanceof ApiClientError)) {
    return "Não foi possível enviar a solicitação de cadastro.";
  }

  if (error.code === "CPF_ALREADY_REGISTERED") {
    validationErrors.value = {
      ...validationErrors.value,
      cpf: "Este CPF já está vinculado a um usuário aprovado.",
    };
    return "Este CPF já está vinculado a um usuário aprovado.";
  }

  if (error.code === "INVALID_SIGNUP_REQUEST_PAYLOAD") {
    return "Os dados enviados não passaram na validação. Revise os campos e tente novamente.";
  }

  if (error.code === "INVALID_USER_ROLE") {
    validationErrors.value = {
      ...validationErrors.value,
      papel: "Selecione um papel válido.",
    };
    return "Selecione um papel válido para continuar.";
  }

  return getRequestErrorMessage(error, "Não foi possível enviar a solicitação de cadastro.");
}

function resetForm() {
  form.nomeCompleto = "";
  form.cpf = "";
  form.senha = "";
  form.papel = "";
  form.serie = "";
  form.turma = "";
  form.departamento = "";
  form.setor = "";
}

async function submitRegistrationRequest() {
  const valid = validateForm();

  if (!valid) {
    formStatus.value = "ERRO_VALIDACAO";
    formMessage.value = "Preencha os campos obrigatórios para continuar.";
    return;
  }

  formStatus.value = "ENVIANDO";
  formMessage.value = "";

  try {
    await createSignupRequest(buildSignupPayload());
    formStatus.value = "SUCESSO_ENVIO";
    formMessage.value = "Solicitação enviada com sucesso. Aguarde a aprovação de um administrador.";
    validationErrors.value = {};
    resetForm();
  } catch (error) {
    formStatus.value = "ERRO_SUBMISSAO";
    formMessage.value = mapSignupError(error);
  }
}
</script>

<style scoped>
.registration-page {
  background: var(--app-registration-background);
}

.registration-shell {
  display: grid;
  overflow: hidden;
}

.registration-shell__brand {
  background: var(--app-brand-registration-gradient);
  color: var(--app-panel-strong-text);
  padding: 2rem;
}

.registration-shell__eyebrow {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.registration-shell__title {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
  margin-bottom: 1rem;
}

.registration-shell__text {
  color: var(--app-panel-muted-text);
  font-size: 1rem;
  line-height: 1.6;
}

.registration-shell__list {
  margin-top: 1.5rem;
  padding-left: 1.1rem;
}

.registration-shell__list li + li {
  margin-top: 0.5rem;
}

.registration-shell__links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

.registration-shell__link {
  color: var(--app-panel-strong-text);
  font-weight: 600;
  text-decoration: none;
}

.registration-shell__panel {
  background: var(--app-panel-background);
  backdrop-filter: blur(12px);
  padding: 2rem;
}

@media (min-width: 960px) {
  .registration-shell {
    grid-template-columns: 0.95fr 1.05fr;
  }

  .registration-shell__brand,
  .registration-shell__panel {
    padding: 3rem;
  }
}
</style>
