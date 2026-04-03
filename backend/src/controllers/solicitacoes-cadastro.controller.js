const { AppError } = require("../errors/app-error");
const {
  approveSolicitacaoCadastro,
  createSolicitacaoCadastro,
  listSolicitacoesCadastro,
  rejectSolicitacaoCadastro,
} = require("../services/solicitacoes-cadastro.service");
const {
  ensureRequiredFields,
  findBlankStringFields,
  hasValidCpfFormat,
  normalizeCpf,
} = require("../validators/common.validator");

async function createSolicitacaoCadastroController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["nome", "cpf", "senha", "papel"]);
    const blankFields = findBlankStringFields(payload, ["nome", "cpf", "senha", "papel"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para solicitação de cadastro.", {
        statusCode: 400,
        code: "INVALID_SIGNUP_REQUEST_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const normalizedPayload = {
      nome: String(payload.nome).trim(),
      cpf: normalizeCpf(payload.cpf),
      senha: String(payload.senha),
      papel: String(payload.papel).trim(),
      serie: payload.serie === undefined ? undefined : String(payload.serie).trim(),
      turma: payload.turma === undefined ? undefined : String(payload.turma).trim(),
      departamento: payload.departamento === undefined ? undefined : String(payload.departamento).trim(),
      setor: payload.setor === undefined ? undefined : String(payload.setor).trim(),
    };

    if (!hasValidCpfFormat(normalizedPayload.cpf)) {
      throw new AppError("CPF inválido para solicitação de cadastro.", {
        statusCode: 400,
        code: "INVALID_SIGNUP_REQUEST_PAYLOAD",
        details: {
          invalidFields: ["cpf"],
        },
      });
    }

    if (normalizedPayload.papel === "ALUNO") {
      const alunoMissingFields = ["serie", "turma"].filter(
        (field) => payload[field] === null || payload[field] === undefined,
      );
      const alunoBlankFields = findBlankStringFields(payload, ["serie", "turma"]);

      if (alunoMissingFields.length > 0 || alunoBlankFields.length > 0) {
        throw new AppError("Aluno deve informar série e turma.", {
          statusCode: 400,
          code: "INVALID_SIGNUP_REQUEST_PAYLOAD",
          details: {
            missingFields: alunoMissingFields,
            blankFields: alunoBlankFields,
          },
        });
      }
    }

    const solicitacao = await createSolicitacaoCadastro(normalizedPayload);

    response.status(201).json({
      solicitacao,
    });
  } catch (error) {
    next(error);
  }
}

async function listSolicitacoesCadastroController(_request, response, next) {
  try {
    const solicitacoes = await listSolicitacoesCadastro();

    response.status(200).json({
      solicitacoes,
    });
  } catch (error) {
    next(error);
  }
}

async function approveSolicitacaoCadastroController(request, response, next) {
  try {
    const resultado = await approveSolicitacaoCadastro({
      solicitacaoId: request.params.id,
      administradorId: request.auth.userId,
    });

    response.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function rejectSolicitacaoCadastroController(request, response, next) {
  try {
    const payload = request.body || {};
    const validation = ensureRequiredFields(payload, ["motivo"]);
    const blankFields = findBlankStringFields(payload, ["motivo"]);

    if (!validation.valid || blankFields.length > 0) {
      throw new AppError("Payload inválido para rejeição de solicitação.", {
        statusCode: 400,
        code: "INVALID_SIGNUP_REJECTION_PAYLOAD",
        details: {
          missingFields: validation.missingFields,
          blankFields,
        },
      });
    }

    const resultado = await rejectSolicitacaoCadastro({
      solicitacaoId: request.params.id,
      administradorId: request.auth.userId,
      motivo: String(payload.motivo).trim(),
    });

    response.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSolicitacaoCadastroController,
  listSolicitacoesCadastroController,
  approveSolicitacaoCadastroController,
  rejectSolicitacaoCadastroController,
};
