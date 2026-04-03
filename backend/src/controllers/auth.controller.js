const { AppError } = require("../errors/app-error");
const { login, getAuthenticatedUserProfile } = require("../services/auth.service");
const {
  ensureRequiredFields,
  findBlankStringFields,
  hasValidCpfFormat,
  normalizeCpf,
} = require("../validators/common.validator");

async function loginController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["cpf", "senha"]);
    const blankFields = findBlankStringFields(payload, ["cpf", "senha"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Campos obrigatórios ausentes no login.", {
        statusCode: 400,
        code: "INVALID_LOGIN_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const normalizedPayload = {
      cpf: normalizeCpf(payload.cpf),
      senha: String(payload.senha),
    };

    if (!hasValidCpfFormat(normalizedPayload.cpf)) {
      throw new AppError("CPF inválido para login.", {
        statusCode: 400,
        code: "INVALID_LOGIN_PAYLOAD",
        details: {
          invalidFields: ["cpf"],
        },
      });
    }

    const result = await login(normalizedPayload);

    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getCurrentSessionController(request, response, next) {
  try {
    const profile = await getAuthenticatedUserProfile(request.auth.userId);

    response.status(200).json({
      usuario: profile,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loginController,
  getCurrentSessionController,
};
