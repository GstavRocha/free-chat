const { AppError } = require("../errors/app-error");
const { findUserById } = require("../repositories/usuario.repository");
const { verifyToken } = require("../services/token.service");
const { logger } = require("../utils/logger");

async function authenticateJwt(request, _response, next) {
  try {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new AppError("Token de autenticação não informado.", {
        statusCode: 401,
        code: "AUTH_TOKEN_MISSING",
      });
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Formato de token inválido.", {
        statusCode: 401,
        code: "AUTH_TOKEN_INVALID_FORMAT",
      });
    }

    const payload = verifyToken(token);

    request.auth = {
      token,
      userId: payload.id,
      role: payload.papel,
    };

    next();
  } catch (error) {
    logger.warn("Falha na autenticação JWT da requisição.", {
      category: "authentication",
      method: request.method,
      path: request.originalUrl,
      code: error.code || "AUTH_JWT_ERROR",
      statusCode: error.statusCode || 401,
      message: error.message,
    });
    next(error);
  }
}

function requireRoles(allowedRoles) {
  return function roleMiddleware(request, _response, next) {
    try {
      if (!request.auth) {
        throw new AppError("Requisição não autenticada.", {
          statusCode: 401,
          code: "AUTH_REQUIRED",
        });
      }

      if (!allowedRoles.includes(request.auth.role)) {
        throw new AppError("Usuário sem permissão para esta operação.", {
          statusCode: 403,
          code: "FORBIDDEN",
          details: {
            requiredRoles: allowedRoles,
          },
        });
      }

      next();
    } catch (error) {
      logger.warn("Falha de autorização por papel.", {
        category: "authentication",
        method: request.method,
        path: request.originalUrl,
        userId: request.auth?.userId || null,
        role: request.auth?.role || null,
        code: error.code || "FORBIDDEN",
        statusCode: error.statusCode || 403,
        message: error.message,
      });
      next(error);
    }
  };
}

async function requireApprovedUser(request, _response, next) {
  try {
    if (!request.auth?.userId) {
      throw new AppError("Requisição não autenticada.", {
        statusCode: 401,
        code: "AUTH_REQUIRED",
      });
    }

    const usuario = await findUserById(request.auth.userId);

    if (!usuario) {
      throw new AppError("Usuário autenticado não encontrado.", {
        statusCode: 401,
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    if (usuario.status !== "APROVADO") {
      throw new AppError("Usuário não está apto a acessar áreas protegidas.", {
        statusCode: 403,
        code: "AUTH_USER_NOT_APPROVED",
        details: {
          status: usuario.status,
        },
      });
    }

    request.currentUser = usuario;

    next();
  } catch (error) {
    logger.warn("Falha na validação de usuário aprovado.", {
      category: "authentication",
      method: request.method,
      path: request.originalUrl,
      userId: request.auth?.userId || null,
      role: request.auth?.role || null,
      code: error.code || "AUTH_APPROVED_USER_ERROR",
      statusCode: error.statusCode || 401,
      message: error.message,
      details: error.details || null,
    });
    next(error);
  }
}

module.exports = {
  authenticateJwt,
  requireRoles,
  requireApprovedUser,
};
