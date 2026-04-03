const { AppError } = require("../errors/app-error");
const { TIPO_ACAO_MODERACAO } = require("../models/enums");
const { createLogModeracao, listLogsModeracao } = require("../repositories/logs-moderacao.repository");
const { findUserById } = require("../repositories/usuario.repository");
const { sanitizeMultilineText, sanitizeSingleLineText } = require("../utils/text-sanitizer");

function serializeLog(log) {
  return {
    id: log.id,
    administradorId: log.administradorId,
    usuarioAlvo: log.usuarioAlvo,
    salaAlvo: log.salaAlvo,
    solicitacaoAlvo: log.solicitacaoAlvo,
    mensagemAlvo: log.mensagemAlvo,
    tipoAcao: log.tipoAcao,
    motivo: log.motivo,
    criadoEm: log.criadoEm,
  };
}

function ensureValidModerationAction(tipoAcao) {
  if (!TIPO_ACAO_MODERACAO.includes(tipoAcao)) {
    throw new AppError("Tipo de ação de moderação inválido.", {
      statusCode: 400,
      code: "INVALID_MODERATION_ACTION",
      details: {
        allowedActions: TIPO_ACAO_MODERACAO,
      },
    });
  }
}

function ensureAtLeastOneTarget(payload) {
  if (!payload.usuarioAlvo && !payload.salaAlvo && !payload.solicitacaoAlvo && !payload.mensagemAlvo) {
    throw new AppError("Ao menos um alvo deve ser informado para o log de moderação.", {
      statusCode: 400,
      code: "MODERATION_TARGET_REQUIRED",
    });
  }
}

async function listModerationLogs() {
  const logs = await listLogsModeracao();

  return logs.map(serializeLog);
}

async function registerModerationLog(payload, options = {}) {
  const normalizedPayload = {
    ...payload,
    tipoAcao: sanitizeSingleLineText(payload.tipoAcao),
    motivo: payload.tipoAcao === "ENVIAR_AVISO_MODERACAO"
      ? sanitizeMultilineText(payload.motivo)
      : sanitizeSingleLineText(payload.motivo),
  };

  ensureValidModerationAction(normalizedPayload.tipoAcao);
  ensureAtLeastOneTarget(normalizedPayload);

  const administrador = await findUserById(normalizedPayload.administradorId, {
    transaction: options.transaction,
  });

  if (!administrador) {
    throw new AppError("Administrador autenticado não encontrado.", {
      statusCode: 401,
      code: "AUTH_USER_NOT_FOUND",
    });
  }

  return createLogModeracao(normalizedPayload, {
    transaction: options.transaction,
  });
}

async function createModerationLog(payload, options = {}) {
  const log = await registerModerationLog(payload, options);

  return serializeLog(log);
}

module.exports = {
  listModerationLogs,
  createModerationLog,
  registerModerationLog,
};
