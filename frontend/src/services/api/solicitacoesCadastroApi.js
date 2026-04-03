import { apiClient } from "./apiClient";
import {
  normalizeAuthUser,
  normalizeSignupRequest,
  normalizeSignupRequestPayload,
} from "./resourceAdapters";

function ensureRequestReviewResult(data) {
  return {
    solicitacao: normalizeSignupRequest(data?.solicitacao),
    usuario: normalizeAuthUser(data?.usuario),
  };
}

export async function createSignupRequest(payload) {
  const response = await apiClient.post(
    "/api/solicitacoes-cadastro",
    normalizeSignupRequestPayload(payload),
  );

  return {
    solicitacao: normalizeSignupRequest(response.data?.solicitacao),
  };
}

export async function listSignupRequests() {
  const response = await apiClient.get("/api/solicitacoes-cadastro");

  return (response.data?.solicitacoes || []).map(normalizeSignupRequest);
}

export async function approveSignupRequest(solicitacaoId) {
  const response = await apiClient.patch(`/api/solicitacoes-cadastro/${solicitacaoId}/aprovar`);

  return ensureRequestReviewResult(response.data);
}

export async function rejectSignupRequest(solicitacaoId, motivo) {
  const response = await apiClient.patch(`/api/solicitacoes-cadastro/${solicitacaoId}/rejeitar`, {
    motivo,
  });

  return ensureRequestReviewResult(response.data);
}
