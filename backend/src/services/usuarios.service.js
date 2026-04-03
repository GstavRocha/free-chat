const { AppError } = require("../errors/app-error");
const { sequelize } = require("../models");
const { STATUS_USUARIO } = require("../models/enums");
const { findUserById, listUsers, updateUserStatus } = require("../repositories/usuario.repository");
const { sanitizeSingleLineText } = require("../utils/text-sanitizer");
const { registerModerationLog } = require("./logs-moderacao.service");

function serializeAdministrativeUser(usuario) {
  return {
    id: usuario.id,
    nomeCompleto: usuario.nomeCompleto,
    cpf: usuario.cpf,
    papel: usuario.papel,
    status: usuario.status,
    criadoEm: usuario.criadoEm,
    atualizadoEm: usuario.atualizadoEm,
  };
}

async function listAdministrativeUsers() {
  const usuarios = await listUsers();

  return usuarios.map(serializeAdministrativeUser);
}

async function getAdministrativeUserById(userId) {
  const usuario = await findUserById(userId);

  if (!usuario) {
    throw new AppError("Usuário não encontrado.", {
      statusCode: 404,
      code: "USER_NOT_FOUND",
    });
  }

  return serializeAdministrativeUser(usuario);
}

function ensureValidStatusTransition(newStatus) {
  if (!STATUS_USUARIO.includes(newStatus)) {
    throw new AppError("Status de usuário inválido.", {
      statusCode: 400,
      code: "INVALID_USER_STATUS",
      details: {
        allowedStatus: STATUS_USUARIO,
      },
    });
  }
}

async function updateAdministrativeUserStatus({
  targetUserId,
  newStatus,
  actorUserId,
  motivo,
}) {
  ensureValidStatusTransition(newStatus);

  const transaction = await sequelize.transaction();

  try {
    const actor = await findUserById(actorUserId, { transaction });

    if (!actor) {
      throw new AppError("Administrador autenticado não encontrado.", {
        statusCode: 401,
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    const targetUser = await findUserById(targetUserId, { transaction });

    if (!targetUser) {
      throw new AppError("Usuário não encontrado.", {
        statusCode: 404,
        code: "USER_NOT_FOUND",
      });
    }

    if (targetUser.id === actor.id && newStatus === "BLOQUEADO") {
      throw new AppError("Administrador não pode bloquear a própria conta.", {
        statusCode: 400,
        code: "INVALID_SELF_BLOCK",
      });
    }

    if (newStatus === "BLOQUEADO") {
      const normalizedMotivo = sanitizeSingleLineText(motivo);

      if (!normalizedMotivo) {
        throw new AppError("Motivo é obrigatório para bloquear usuário.", {
          statusCode: 400,
          code: "USER_BLOCK_REASON_REQUIRED",
        });
      }
    }

    const updatedUser = await updateUserStatus(targetUserId, newStatus, { transaction });

    if (newStatus === "BLOQUEADO") {
      await registerModerationLog(
        {
          administradorId: actorUserId,
          usuarioAlvo: targetUserId,
          tipoAcao: "BLOQUEAR_USUARIO",
          motivo: sanitizeSingleLineText(motivo),
        },
        { transaction },
      );
    }

    await transaction.commit();

    return serializeAdministrativeUser(updatedUser);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  listAdministrativeUsers,
  getAdministrativeUserById,
  updateAdministrativeUserStatus,
};
