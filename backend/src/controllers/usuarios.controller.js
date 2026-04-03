const { AppError } = require("../errors/app-error");
const {
  getAdministrativeUserById,
  listAdministrativeUsers,
  updateAdministrativeUserStatus,
} = require("../services/usuarios.service");
const { ensureRequiredFields, findBlankStringFields } = require("../validators/common.validator");

async function listUsersController(_request, response, next) {
  try {
    const usuarios = await listAdministrativeUsers();

    response.status(200).json({
      usuarios,
    });
  } catch (error) {
    next(error);
  }
}

async function getUserByIdController(request, response, next) {
  try {
    const usuario = await getAdministrativeUserById(request.params.id);

    response.status(200).json({
      usuario,
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserStatusController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["status"]);
    const blankFields = findBlankStringFields(payload, ["status"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para atualização de status.", {
        statusCode: 400,
        code: "INVALID_USER_STATUS_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    if (String(payload.status).trim() === "BLOQUEADO") {
      const motivoValidation = ensureRequiredFields(payload, ["motivo"]);
      const motivoBlankFields = findBlankStringFields(payload, ["motivo"]);

      if (!motivoValidation.valid || motivoBlankFields.length > 0) {
        throw new AppError("Payload inválido para bloqueio de usuário.", {
          statusCode: 400,
          code: "INVALID_USER_STATUS_PAYLOAD",
          details: {
            missingFields: motivoValidation.missingFields,
            blankFields: motivoBlankFields,
          },
        });
      }
    }

    const usuario = await updateAdministrativeUserStatus({
      targetUserId: request.params.id,
      newStatus: String(payload.status).trim(),
      actorUserId: request.auth.userId,
      motivo: payload.motivo === undefined ? undefined : String(payload.motivo).trim(),
    });

    response.status(200).json({
      usuario,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsersController,
  getUserByIdController,
  updateUserStatusController,
};
