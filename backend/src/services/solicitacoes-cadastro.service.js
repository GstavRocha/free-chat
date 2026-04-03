const { AppError } = require("../errors/app-error");
const { sequelize, Usuario, initModels } = require("../models");
const { PAPEL_USUARIO } = require("../models/enums");
const {
  createSolicitacao,
  findSolicitacaoById,
  listSolicitacoes,
  updateSolicitacao,
} = require("../repositories/solicitacoes-cadastro.repository");
const { findUserByCpf, findUserById } = require("../repositories/usuario.repository");
const { registerModerationLog } = require("./logs-moderacao.service");
const { hashPassword } = require("./password.service");
const {
  sanitizeOptionalSingleLineText,
  sanitizeSingleLineText,
} = require("../utils/text-sanitizer");

function serializeSolicitacao(solicitacao) {
  return {
    id: solicitacao.id,
    nomeSolicitado: solicitacao.nomeSolicitado,
    cpfSolicitado: solicitacao.cpfSolicitado,
    papelSolicitado: solicitacao.papelSolicitado,
    serieSolicitada: solicitacao.serieSolicitada,
    turmaSolicitada: solicitacao.turmaSolicitada,
    departamentoSolicitado: solicitacao.departamentoSolicitado,
    setorSolicitado: solicitacao.setorSolicitado,
    statusSolicitacao: solicitacao.statusSolicitacao,
    revisadoPor: solicitacao.revisadoPor,
    motivoRevisao: solicitacao.motivoRevisao,
    criadoEm: solicitacao.criadoEm,
    revisadoEm: solicitacao.revisadoEm,
  };
}

function ensureValidPapel(papel) {
  if (!PAPEL_USUARIO.includes(papel)) {
    throw new AppError("Papel solicitado inválido.", {
      statusCode: 400,
      code: "INVALID_USER_ROLE",
      details: {
        allowedRoles: PAPEL_USUARIO,
      },
    });
  }
}

async function createSolicitacaoCadastro(payload) {
  ensureValidPapel(payload.papel);

  const existingUser = await findUserByCpf(payload.cpf);

  if (existingUser && existingUser.status === "APROVADO") {
    throw new AppError("CPF já vinculado a usuário aprovado.", {
      statusCode: 409,
      code: "CPF_ALREADY_REGISTERED",
    });
  }

  const senhaHashSolicitada = await hashPassword(payload.senha);

  const solicitacao = await createSolicitacao({
    nomeSolicitado: sanitizeSingleLineText(payload.nome),
    cpfSolicitado: payload.cpf,
    senhaHashSolicitada,
    papelSolicitado: payload.papel,
    serieSolicitada: sanitizeOptionalSingleLineText(payload.serie),
    turmaSolicitada: sanitizeOptionalSingleLineText(payload.turma),
    departamentoSolicitado: sanitizeOptionalSingleLineText(payload.departamento),
    setorSolicitado: sanitizeOptionalSingleLineText(payload.setor),
  });

  return serializeSolicitacao(solicitacao);
}

async function listSolicitacoesCadastro() {
  const solicitacoes = await listSolicitacoes();

  return solicitacoes.map(serializeSolicitacao);
}

async function createOrUpdateUserFromSolicitacao(solicitacao, options = {}) {
  const existingUser = await findUserByCpf(solicitacao.cpfSolicitado, {
    transaction: options.transaction,
  });

  if (existingUser) {
    existingUser.nomeCompleto = solicitacao.nomeSolicitado;
    existingUser.senhaHash = solicitacao.senhaHashSolicitada;
    existingUser.papel = solicitacao.papelSolicitado;
    existingUser.status = "APROVADO";
    existingUser.serie = solicitacao.serieSolicitada;
    existingUser.turma = solicitacao.turmaSolicitada;
    existingUser.departamento = solicitacao.departamentoSolicitado;
    existingUser.setor = solicitacao.setorSolicitado;
    await existingUser.save({
      transaction: options.transaction,
    });
    return existingUser;
  }

  initModels();

  return Usuario.create({
    nomeCompleto: solicitacao.nomeSolicitado,
    cpf: solicitacao.cpfSolicitado,
    senhaHash: solicitacao.senhaHashSolicitada,
    papel: solicitacao.papelSolicitado,
    status: "APROVADO",
    serie: solicitacao.serieSolicitada,
    turma: solicitacao.turmaSolicitada,
    departamento: solicitacao.departamentoSolicitado,
    setor: solicitacao.setorSolicitado,
  }, {
    transaction: options.transaction,
  });
}

async function approveSolicitacaoCadastro({ solicitacaoId, administradorId }) {
  const transaction = await sequelize.transaction();

  try {
    const administrador = await findUserById(administradorId, { transaction });
    const solicitacao = await findSolicitacaoById(solicitacaoId, { transaction });

    if (!administrador) {
      throw new AppError("Administrador autenticado não encontrado.", {
        statusCode: 401,
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    if (!solicitacao) {
      throw new AppError("Solicitação de cadastro não encontrada.", {
        statusCode: 404,
        code: "SIGNUP_REQUEST_NOT_FOUND",
      });
    }

    if (solicitacao.statusSolicitacao !== "PENDENTE") {
      throw new AppError("Solicitação já foi revisada.", {
        statusCode: 400,
        code: "SIGNUP_REQUEST_ALREADY_REVIEWED",
        details: {
          statusSolicitacao: solicitacao.statusSolicitacao,
        },
      });
    }

    const usuarioExistente = await findUserByCpf(solicitacao.cpfSolicitado, { transaction });

    if (usuarioExistente && usuarioExistente.status === "APROVADO") {
      throw new AppError("Já existe usuário aprovado para esta solicitação.", {
        statusCode: 409,
        code: "SIGNUP_REQUEST_ALREADY_MATERIALIZED",
      });
    }

    const solicitacaoAtualizada = await updateSolicitacao(
      solicitacaoId,
      {
        statusSolicitacao: "APROVADO",
        revisadoPor: administradorId,
        revisadoEm: new Date(),
        motivoRevisao: null,
      },
      { transaction },
    );

    const usuario = await createOrUpdateUserFromSolicitacao(solicitacao, {
      transaction,
    });

    await registerModerationLog(
      {
        administradorId,
        usuarioAlvo: usuario.id,
        tipoAcao: "APROVAR_USUARIO",
        motivo: "Solicitação de cadastro aprovada.",
      },
      { transaction },
    );

    await transaction.commit();

    return {
      solicitacao: serializeSolicitacao(solicitacaoAtualizada),
      usuario: {
        id: usuario.id,
        nomeCompleto: usuario.nomeCompleto,
        cpf: usuario.cpf,
        papel: usuario.papel,
        status: usuario.status,
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function rejectSolicitacaoCadastro({ solicitacaoId, administradorId, motivo }) {
  const transaction = await sequelize.transaction();

  try {
    const normalizedMotivo = sanitizeSingleLineText(motivo);
    const administrador = await findUserById(administradorId, { transaction });
    const solicitacao = await findSolicitacaoById(solicitacaoId, { transaction });

    if (!administrador) {
      throw new AppError("Administrador autenticado não encontrado.", {
        statusCode: 401,
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    if (!solicitacao) {
      throw new AppError("Solicitação de cadastro não encontrada.", {
        statusCode: 404,
        code: "SIGNUP_REQUEST_NOT_FOUND",
      });
    }

    if (!normalizedMotivo) {
      throw new AppError("Motivo é obrigatório para rejeição de solicitação.", {
        statusCode: 400,
        code: "SIGNUP_REJECTION_REASON_REQUIRED",
      });
    }

    if (solicitacao.statusSolicitacao !== "PENDENTE") {
      throw new AppError("Solicitação já foi revisada.", {
        statusCode: 400,
        code: "SIGNUP_REQUEST_ALREADY_REVIEWED",
        details: {
          statusSolicitacao: solicitacao.statusSolicitacao,
        },
      });
    }

    const solicitacaoAtualizada = await updateSolicitacao(
      solicitacaoId,
      {
        statusSolicitacao: "REJEITADO",
        revisadoPor: administradorId,
        revisadoEm: new Date(),
        motivoRevisao: normalizedMotivo,
      },
      { transaction },
    );

    await registerModerationLog(
      {
        administradorId,
        solicitacaoAlvo: solicitacaoId,
        tipoAcao: "REJEITAR_USUARIO",
        motivo: normalizedMotivo,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      solicitacao: serializeSolicitacao(solicitacaoAtualizada),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  createSolicitacaoCadastro,
  listSolicitacoesCadastro,
  approveSolicitacaoCadastro,
  rejectSolicitacaoCadastro,
};
