const { AppError } = require("../errors/app-error");
const { sequelize } = require("../models");
const { findUserById } = require("../repositories/usuario.repository");
const {
  createSala,
  findSalaById,
  listSalasAtivas,
  listSalasParaModeracao,
  updateSala,
} = require("../repositories/salas.repository");
const {
  sanitizeOptionalMultilineText,
  sanitizeSingleLineText,
} = require("../utils/text-sanitizer");
const { registerModerationLog } = require("./logs-moderacao.service");

function normalizeOptionalText(value) {
  const normalized = sanitizeOptionalMultilineText(value);
  return normalized || null;
}

function serializeSala(sala) {
  return {
    id: sala.id,
    nome: sala.nome,
    descricao: sala.descricao,
    proprietarioId: sala.proprietarioId,
    proprietario: sala.proprietario
      ? {
          id: sala.proprietario.id,
          nomeCompleto: sala.proprietario.nomeCompleto,
          papel: sala.proprietario.papel,
          status: sala.proprietario.status,
        }
      : null,
    status: sala.status,
    criadoEm: sala.criadoEm,
    atualizadoEm: sala.atualizadoEm,
    excluidoEm: sala.excluidoEm,
  };
}

async function listAvailableSalas() {
  const salas = await listSalasAtivas();

  return salas.map(serializeSala);
}

async function listSalasForModeration() {
  const salas = await listSalasParaModeracao();

  return salas.map(serializeSala);
}

async function getSalaByIdForAccess(salaId) {
  const sala = await findSalaById(salaId);

  if (!sala) {
    throw new AppError("Sala não encontrada.", {
      statusCode: 404,
      code: "ROOM_NOT_FOUND",
    });
  }

  if (sala.status !== "ATIVA" || sala.excluidoEm) {
    throw new AppError("Sala indisponível para uso normal.", {
      statusCode: 409,
      code: "ROOM_UNAVAILABLE",
      details: {
        status: sala.status,
      },
    });
  }

  return serializeSala(sala);
}

async function createPublicSala({ nome, descricao, proprietarioId }) {
  const normalizedNome = sanitizeSingleLineText(nome);

  if (!normalizedNome) {
    throw new AppError("Nome da sala é obrigatório.", {
      statusCode: 400,
      code: "ROOM_NAME_REQUIRED",
    });
  }

  const proprietario = await findUserById(proprietarioId);

  if (!proprietario) {
    throw new AppError("Usuário autenticado não encontrado.", {
      statusCode: 401,
      code: "AUTH_USER_NOT_FOUND",
    });
  }

  const sala = await createSala({
    nome: normalizedNome,
    descricao: normalizeOptionalText(descricao),
    proprietarioId,
    status: "ATIVA",
  });

  sala.proprietario = proprietario;

  return serializeSala(sala);
}

async function updatePublicSala({
  salaId,
  nome,
  descricao,
  actorUserId,
  actorRole,
  hasNome,
  hasDescricao,
}) {
  const actor = await findUserById(actorUserId);

  if (!actor) {
    throw new AppError("Usuário autenticado não encontrado.", {
      statusCode: 401,
      code: "AUTH_USER_NOT_FOUND",
    });
  }

  const sala = await findSalaById(salaId);

  if (!sala) {
    throw new AppError("Sala não encontrada.", {
      statusCode: 404,
      code: "ROOM_NOT_FOUND",
    });
  }

  const isOwner = sala.proprietarioId === actorUserId;
  const isAdmin = actorRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError("Usuário sem permissão para editar esta sala.", {
      statusCode: 403,
      code: "ROOM_EDIT_FORBIDDEN",
    });
  }

  if (sala.status === "EXCLUIDA") {
    throw new AppError("Sala excluída não pode ser editada.", {
      statusCode: 400,
      code: "ROOM_DELETED",
    });
  }

  if (!hasNome && !hasDescricao) {
    throw new AppError("Nenhum campo editável foi informado.", {
      statusCode: 400,
      code: "ROOM_UPDATE_EMPTY",
      details: {
        allowedFields: ["nome", "descricao"],
      },
    });
  }

  const updates = {};

  if (hasNome) {
    const normalizedNome = sanitizeSingleLineText(nome);

    if (!normalizedNome) {
      throw new AppError("Nome da sala é obrigatório.", {
        statusCode: 400,
        code: "ROOM_NAME_REQUIRED",
      });
    }

    updates.nome = normalizedNome;
  }

  if (hasDescricao) {
    updates.descricao = normalizeOptionalText(descricao);
  }

  const updatedSala = await updateSala(salaId, updates);

  return serializeSala(updatedSala);
}

async function deletePublicSala({
  salaId,
  actorUserId,
  actorRole,
  motivo,
}) {
  const transaction = await sequelize.transaction();

  try {
    const actor = await findUserById(actorUserId, { transaction });

    if (!actor) {
      throw new AppError("Usuário autenticado não encontrado.", {
        statusCode: 401,
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    const sala = await findSalaById(salaId, { transaction });

    if (!sala) {
      throw new AppError("Sala não encontrada.", {
        statusCode: 404,
        code: "ROOM_NOT_FOUND",
      });
    }

    const isOwner = sala.proprietarioId === actorUserId;
    const isAdmin = actorRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new AppError("Usuário sem permissão para excluir esta sala.", {
        statusCode: 403,
        code: "ROOM_DELETE_FORBIDDEN",
      });
    }

    if (sala.status === "EXCLUIDA") {
      throw new AppError("Sala já foi excluída logicamente.", {
        statusCode: 400,
        code: "ROOM_ALREADY_DELETED",
      });
    }

    const normalizedMotivo = sanitizeSingleLineText(motivo);

    if (isAdmin && !normalizedMotivo) {
      throw new AppError("Motivo é obrigatório para exclusão administrativa de sala.", {
        statusCode: 400,
        code: "ROOM_DELETE_REASON_REQUIRED",
      });
    }

    const updatedSala = await updateSala(
      salaId,
      {
        status: "EXCLUIDA",
        excluidoEm: new Date(),
      },
      { transaction },
    );

    if (isAdmin) {
      await registerModerationLog(
        {
          administradorId: actorUserId,
          salaAlvo: salaId,
          tipoAcao: "EXCLUIR_SALA",
          motivo: normalizedMotivo,
        },
        { transaction },
      );
    }

    await transaction.commit();

    return serializeSala(updatedSala);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function silenceSalaAdministratively({
  salaId,
  actorUserId,
  motivo,
}) {
  const transaction = await sequelize.transaction();

  try {
    const actor = await findUserById(actorUserId, { transaction });

    if (!actor) {
      throw new AppError("Usuário autenticado não encontrado.", {
        statusCode: 401,
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    const sala = await findSalaById(salaId, { transaction });

    if (!sala) {
      throw new AppError("Sala não encontrada.", {
        statusCode: 404,
        code: "ROOM_NOT_FOUND",
      });
    }

    if (sala.status === "EXCLUIDA") {
      throw new AppError("Sala excluída não pode ser silenciada.", {
        statusCode: 400,
        code: "ROOM_DELETED",
      });
    }

    if (sala.status === "SILENCIADA") {
      throw new AppError("Sala já está silenciada.", {
        statusCode: 400,
        code: "ROOM_ALREADY_SILENCED",
      });
    }

    const normalizedMotivo = sanitizeSingleLineText(motivo);

    if (!normalizedMotivo) {
      throw new AppError("Motivo é obrigatório para silenciar sala.", {
        statusCode: 400,
        code: "ROOM_SILENCE_REASON_REQUIRED",
      });
    }

    const updatedSala = await updateSala(
      salaId,
      {
        status: "SILENCIADA",
      },
      { transaction },
    );

    await registerModerationLog(
      {
        administradorId: actorUserId,
        salaAlvo: salaId,
        tipoAcao: "SILENCIAR_SALA",
        motivo: normalizedMotivo,
      },
      { transaction },
    );

    await transaction.commit();

    return serializeSala(updatedSala);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  createPublicSala,
  getSalaByIdForAccess,
  listAvailableSalas,
  listSalasForModeration,
  silenceSalaAdministratively,
  updatePublicSala,
  deletePublicSala,
};
