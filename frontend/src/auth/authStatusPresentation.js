export const TERMINAL_AUTH_STATUSES = [
  "PENDENTE_APROVACAO",
  "REJEITADO",
  "BLOQUEADO",
  "SESSAO_EXPIRADA",
  "ERRO_AUTENTICACAO",
];

export function getAuthStatusPresentation(status, message) {
  if (!message) {
    return {
      visible: false,
      type: "info",
      title: "",
      message: "",
    };
  }

  if (status === "PENDENTE_APROVACAO") {
    return {
      visible: true,
      type: "warning",
      title: "Cadastro pendente",
      message,
    };
  }

  if (status === "REJEITADO") {
    return {
      visible: true,
      type: "error",
      title: "Acesso rejeitado",
      message,
    };
  }

  if (status === "BLOQUEADO") {
    return {
      visible: true,
      type: "error",
      title: "Acesso bloqueado",
      message,
    };
  }

  if (status === "SESSAO_EXPIRADA") {
    return {
      visible: true,
      type: "info",
      title: "Sessão expirada",
      message,
    };
  }

  if (status === "ERRO_AUTENTICACAO") {
    return {
      visible: true,
      type: "error",
      title: "Falha na autenticação",
      message,
    };
  }

  return {
    visible: true,
    type: "info",
    title: "Estado de autenticação",
    message,
  };
}
