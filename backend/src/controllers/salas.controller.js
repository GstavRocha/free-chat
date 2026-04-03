const { AppError } = require("../errors/app-error");
const {
  createPublicSala,
  deletePublicSala,
  getSalaByIdForAccess,
  listAvailableSalas,
  silenceSalaAdministratively,
  updatePublicSala,
} = require("../services/salas.service");
const { ensureRequiredFields, findBlankStringFields } = require("../validators/common.validator");
const { broadcastRoomUpdated } = require("../websocket/events");

async function listSalasController(_request, response, next) {
  try {
    const salas = await listAvailableSalas();

    response.status(200).json({
      salas,
    });
  } catch (error) {
    next(error);
  }
}

async function getSalaByIdController(request, response, next) {
  try {
    const sala = await getSalaByIdForAccess(request.params.id);

    response.status(200).json({
      sala,
    });
  } catch (error) {
    next(error);
  }
}

async function createSalaController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["nome"]);
    const blankFields = findBlankStringFields(payload, ["nome"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para criação de sala.", {
        statusCode: 400,
        code: "INVALID_ROOM_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const sala = await createPublicSala({
      nome: String(payload.nome).trim(),
      descricao: payload.descricao === undefined ? undefined : String(payload.descricao).trim(),
      proprietarioId: request.auth.userId,
    });

    response.status(201).json({
      sala,
    });
  } catch (error) {
    next(error);
  }
}

async function updateSalaController(request, response, next) {
  try {
    const payload = request.body || {};
    const hasNome = Object.prototype.hasOwnProperty.call(payload, "nome");
    const hasDescricao = Object.prototype.hasOwnProperty.call(payload, "descricao");

    if (!hasNome && !hasDescricao) {
      throw new AppError("Payload inválido para edição de sala.", {
        statusCode: 400,
        code: "INVALID_ROOM_UPDATE_PAYLOAD",
        details: {
          allowedFields: ["nome", "descricao"],
        },
      });
    }

    const sala = await updatePublicSala({
      salaId: request.params.id,
      nome: hasNome ? String(payload.nome).trim() : undefined,
      descricao: hasDescricao ? String(payload.descricao || "").trim() : undefined,
      actorUserId: request.auth.userId,
      actorRole: request.auth.role,
      hasNome,
      hasDescricao,
    });

    response.status(200).json({
      sala,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteSalaController(request, response, next) {
  try {
    const payload = request.body || {};

    if (request.auth.role === "ADMIN") {
      const validation = ensureRequiredFields(payload, ["motivo"]);
      const blankFields = findBlankStringFields(payload, ["motivo"]);

      if (!validation.valid || blankFields.length > 0) {
        throw new AppError("Payload inválido para exclusão administrativa de sala.", {
          statusCode: 400,
          code: "INVALID_ROOM_DELETE_PAYLOAD",
          details: {
            missingFields: validation.missingFields,
            blankFields,
          },
        });
      }
    }

    const sala = await deletePublicSala({
      salaId: request.params.id,
      actorUserId: request.auth.userId,
      actorRole: request.auth.role,
      motivo: payload.motivo === undefined ? undefined : String(payload.motivo).trim(),
    });

    response.status(200).json({
      sala,
    });
  } catch (error) {
    next(error);
  }
}

async function silenceSalaController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["motivo"]);
    const blankFields = findBlankStringFields(payload, ["motivo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para silenciamento de sala.", {
        statusCode: 400,
        code: "INVALID_ROOM_SILENCE_PAYLOAD",
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

module.exports = {
  createSalaController,
  deleteSalaController,
  getSalaByIdController,
  listSalasController,
  silenceSalaController,
  updateSalaController,
};
