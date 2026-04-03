const { AppError } = require("../errors/app-error");
const {
  createModerationLog,
  listModerationLogs,
} = require("../services/logs-moderacao.service");
const { ensureRequiredFields, findBlankStringFields } = require("../validators/common.validator");

async function listModerationLogsController(_request, response, next) {
  try {
    const logs = await listModerationLogs();

    response.status(200).json({
      logs,
    });
  } catch (error) {
    next(error);
  }
}

async function createModerationLogController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["tipoAcao", "motivo"]);
    const blankFields = findBlankStringFields(payload, ["tipoAcao", "motivo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para criação de log de moderação.", {
        statusCode: 400,
        code: "INVALID_MODERATION_LOG_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const log = await createModerationLog({
      administradorId: request.auth.userId,
      tipoAcao: String(payload.tipoAcao).trim(),
      motivo: String(payload.motivo).trim(),
      usuarioAlvo: payload.usuarioAlvo,
      salaAlvo: payload.salaAlvo,
      solicitacaoAlvo: payload.solicitacaoAlvo,
      mensagemAlvo: payload.mensagemAlvo,
    });

    response.status(201).json({
      log,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listModerationLogsController,
  createModerationLogController,
};
