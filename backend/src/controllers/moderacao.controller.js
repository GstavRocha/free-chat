const { AppError } = require("../errors/app-error");
const {
  listModerationLogs,
} = require("../services/logs-moderacao.service");
const {
  createModerationNotice,
  deleteOwnMessage,
  getRoomHistoryForModeration,
} = require("../services/mensagens.service");
const {
  deletePublicSala,
  listSalasForModeration,
  silenceSalaAdministratively,
} = require("../services/salas.service");
const {
  updateAdministrativeUserStatus,
} = require("../services/usuarios.service");
const {
  broadcastMessageCreated,
  broadcastMessageDeleted,
  broadcastRoomUpdated,
} = require("../websocket/events");
const { ensureRequiredFields, findBlankStringFields } = require("../validators/common.validator");

async function blockUserModerationController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["motivo"]);
    const blankFields = findBlankStringFields(payload, ["motivo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para bloqueio administrativo.", {
        statusCode: 400,
        code: "INVALID_MODERATION_BLOCK_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const usuario = await updateAdministrativeUserStatus({
      targetUserId: request.params.id,
      newStatus: "BLOQUEADO",
      actorUserId: request.auth.userId,
      motivo: String(payload.motivo).trim(),
    });

    response.status(200).json({
      usuario,
    });
  } catch (error) {
    next(error);
  }
}

async function listSalasModerationController(_request, response, next) {
  try {
    const salas = await listSalasForModeration();

    response.status(200).json({
      salas,
    });
  } catch (error) {
    next(error);
  }
}

async function listMensagensBySalaModerationController(request, response, next) {
  try {
    const mensagens = await getRoomHistoryForModeration({
      salaId: request.params.id,
      actorUserId: request.auth.userId,
    });

    response.status(200).json({
      mensagens,
    });
  } catch (error) {
    next(error);
  }
}

async function silenceSalaModerationController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["motivo"]);
    const blankFields = findBlankStringFields(payload, ["motivo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para silenciamento administrativo de sala.", {
        statusCode: 400,
        code: "INVALID_MODERATION_ROOM_SILENCE_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const sala = await silenceSalaAdministratively({
      salaId: request.params.id,
      actorUserId: request.auth.userId,
      motivo: String(payload.motivo).trim(),
    });

    broadcastRoomUpdated(sala);

    response.status(200).json({
      sala,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteSalaModerationController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["motivo"]);
    const blankFields = findBlankStringFields(payload, ["motivo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para exclusão administrativa de sala.", {
        statusCode: 400,
        code: "INVALID_MODERATION_ROOM_DELETE_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const sala = await deletePublicSala({
      salaId: request.params.id,
      actorUserId: request.auth.userId,
      actorRole: request.auth.role,
      motivo: String(payload.motivo).trim(),
    });

    response.status(200).json({
      sala,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteMensagemModerationController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["motivo"]);
    const blankFields = findBlankStringFields(payload, ["motivo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para exclusão administrativa de mensagem.", {
        statusCode: 400,
        code: "INVALID_MODERATION_MESSAGE_DELETE_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const mensagem = await deleteOwnMessage({
      mensagemId: request.params.id,
      actorUserId: request.auth.userId,
      actorRole: request.auth.role,
      motivo: String(payload.motivo).trim(),
    });

    broadcastMessageDeleted(mensagem);

    response.status(200).json({
      mensagem,
    });
  } catch (error) {
    next(error);
  }
}

async function createModerationNoticeForSalaController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["conteudo"]);
    const blankFields = findBlankStringFields(payload, ["conteudo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para aviso administrativo de moderação.", {
        statusCode: 400,
        code: "INVALID_MODERATION_NOTICE_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const mensagem = await createModerationNotice({
      salaId: request.params.id,
      autorId: request.auth.userId,
      conteudo: String(payload.conteudo).trim(),
    });

    broadcastMessageCreated(mensagem);

    response.status(201).json({
      mensagem,
    });
  } catch (error) {
    next(error);
  }
}

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

module.exports = {
  blockUserModerationController,
  createModerationNoticeForSalaController,
  deleteMensagemModerationController,
  deleteSalaModerationController,
  listModerationLogsController,
  listMensagensBySalaModerationController,
  listSalasModerationController,
  silenceSalaModerationController,
};
