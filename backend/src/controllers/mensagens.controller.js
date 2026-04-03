const { AppError } = require("../errors/app-error");
const {
  createModerationNotice,
  createRoomMessage,
  deleteOwnMessage,
  getRoomHistory,
  updateOwnMessage,
} = require("../services/mensagens.service");
const { ensureRequiredFields, findBlankStringFields } = require("../validators/common.validator");
const {
  broadcastMessageCreated,
  broadcastMessageDeleted,
  broadcastMessageUpdated,
} = require("../websocket/events");

async function listHistoricoSalaController(request, response, next) {
  try {
    const mensagens = await getRoomHistory({
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

async function createMensagemController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["conteudo"]);
    const blankFields = findBlankStringFields(payload, ["conteudo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para criação de mensagem.", {
        statusCode: 400,
        code: "INVALID_MESSAGE_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const mensagem = await createRoomMessage({
      salaId: request.params.id,
      autorId: request.auth.userId,
      conteudo: String(payload.conteudo).trim(),
      tipoMensagem: payload.tipoMensagem || "TEXTO",
    });

    broadcastMessageCreated(mensagem);

    response.status(201).json({
      mensagem,
    });
  } catch (error) {
    next(error);
  }
}

async function createModerationNoticeController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["conteudo"]);
    const blankFields = findBlankStringFields(payload, ["conteudo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para aviso de moderação.", {
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

async function updateMensagemController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["conteudo"]);
    const blankFields = findBlankStringFields(payload, ["conteudo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para edição de mensagem.", {
        statusCode: 400,
        code: "INVALID_MESSAGE_UPDATE_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const mensagem = await updateOwnMessage({
      mensagemId: request.params.id,
      actorUserId: request.auth.userId,
      actorRole: request.auth.role,
      conteudo: String(payload.conteudo).trim(),
    });

    broadcastMessageUpdated(mensagem);

    response.status(200).json({
      mensagem,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteMensagemController(request, response, next) {
  try {
    const payload = request.body || {};

    if (request.auth.role === "ADMIN") {
      const validation = ensureRequiredFields(payload, ["motivo"]);
      const blankFields = findBlankStringFields(payload, ["motivo"]);

      if (!validation.valid || blankFields.length > 0) {
        throw new AppError("Payload inválido para exclusão administrativa de mensagem.", {
          statusCode: 400,
          code: "INVALID_MESSAGE_DELETE_PAYLOAD",
          details: {
            missingFields: validation.missingFields,
            blankFields,
          },
        });
      }
    }

    const mensagem = await deleteOwnMessage({
      mensagemId: request.params.id,
      actorUserId: request.auth.userId,
      actorRole: request.auth.role,
      motivo: payload.motivo === undefined ? undefined : String(payload.motivo).trim(),
    });

    broadcastMessageDeleted(mensagem);

    response.status(200).json({
      mensagem,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createModerationNoticeController,
  createMensagemController,
  deleteMensagemController,
  listHistoricoSalaController,
  updateMensagemController,
};
