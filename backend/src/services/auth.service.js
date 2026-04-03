const { AppError } = require("../errors/app-error");
const { findUserByCpf, findUserById } = require("../repositories/usuario.repository");
const { logger } = require("../utils/logger");
const { comparePassword } = require("./password.service");
const { generateToken } = require("./token.service");

function serializeUser(usuario) {
  return {
    id: usuario.id,
    nomeCompleto: usuario.nomeCompleto,
    cpf: usuario.cpf,
    papel: usuario.papel,
    status: usuario.status,
  };
}

function ensureUserCanAuthenticate(usuario) {
  if (!usuario) {
    throw new AppError("CPF ou senha inválidos.", {
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  }

  if (usuario.status === "PENDENTE") {
    throw new AppError("Usuário ainda não foi aprovado.", {
      statusCode: 403,
      code: "USER_PENDING_APPROVAL",
    });
  }

  if (usuario.status === "REJEITADO") {
    throw new AppError("Usuário rejeitado não pode autenticar.", {
      statusCode: 403,
      code: "USER_REJECTED",
    });
  }

  if (usuario.status === "BLOQUEADO") {
    throw new AppError("Usuário bloqueado não pode autenticar.", {
      statusCode: 403,
      code: "USER_BLOCKED",
    });
  }

  if (usuario.status !== "APROVADO") {
    throw new AppError("Status de usuário inválido para autenticação.", {
      statusCode: 403,
      code: "USER_STATUS_INVALID",
      details: {
        status: usuario.status,
      },
    });
  }
}

async function login(payload) {
  const usuario = await findUserByCpf(payload.cpf);

  try {
    ensureUserCanAuthenticate(usuario);
  } catch (error) {
    logger.warn("Falha de autenticação no login.", {
      category: "authentication",
      cpf: payload.cpf,
      code: error.code || "AUTH_LOGIN_ERROR",
      statusCode: error.statusCode || 401,
      message: error.message,
    });
    throw error;
  }

  const passwordMatches = await comparePassword(payload.senha, usuario.senhaHash);

  if (!passwordMatches) {
    logger.warn("Falha de autenticação por credenciais inválidas.", {
      category: "authentication",
      cpf: payload.cpf,
      userId: usuario.id,
      code: "INVALID_CREDENTIALS",
      statusCode: 401,
    });

    throw new AppError("CPF ou senha inválidos.", {
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  }

  const token = generateToken({
    id: usuario.id,
    papel: usuario.papel,
  });

  logger.info("Login concluído com sucesso.", {
    category: "authentication",
    userId: usuario.id,
    role: usuario.papel,
    status: usuario.status,
  });

  return {
    token,
    usuario: serializeUser(usuario),
  };
}

async function getAuthenticatedUserProfile(userId) {
  const usuario = await findUserById(userId);

  if (!usuario) {
    throw new AppError("Usuário autenticado não encontrado.", {
      statusCode: 404,
      code: "AUTH_USER_NOT_FOUND",
    });
  }

  return serializeUser(usuario);
}

module.exports = {
  login,
  getAuthenticatedUserProfile,
};
