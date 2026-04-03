const { URL } = require("node:url");

const { AppError } = require("../errors/app-error");
const { findUserById } = require("../repositories/usuario.repository");
const { verifyToken } = require("../services/token.service");

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function extractWebSocketAuth(request) {
  const requestUrl = new URL(request.url, "http://localhost");
  const queryToken = requestUrl.searchParams.get("token");

  if (queryToken) {
    return {
      token: queryToken,
      source: "query",
    };
  }

  const headerToken = extractBearerToken(request.headers.authorization);

  if (headerToken) {
    return {
      token: headerToken,
      source: "header",
    };
  }

  return {
    token: null,
    source: null,
  };
}

async function authenticateWebSocketRequest(request) {
  const auth = extractWebSocketAuth(request);

  if (!auth.token) {
    throw new AppError("Token de autenticação não informado.", {
      statusCode: 401,
      code: "AUTH_TOKEN_MISSING",
    });
  }

  const payload = verifyToken(auth.token);
  const usuario = await findUserById(payload.id);

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

  return {
    ...auth,
    payload,
    currentUser: usuario,
  };
}

async function ensureAuthenticatedSocketUserApproved(auth) {
  const usuario = await findUserById(auth?.payload?.id);

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

  auth.currentUser = usuario;

  return usuario;
}

module.exports = {
  extractWebSocketAuth,
  authenticateWebSocketRequest,
  ensureAuthenticatedSocketUserApproved,
};
