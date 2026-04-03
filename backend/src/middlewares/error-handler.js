const { AppError } = require("../errors/app-error");
const { logger } = require("../utils/logger");

function isSequelizeError(error) {
  return typeof error?.name === "string" && error.name.startsWith("Sequelize");
}

function classifyError(appError, originalError) {
  if (
    appError.code === "INVALID_CREDENTIALS"
    || appError.code.startsWith("AUTH_")
    || appError.code === "USER_PENDING_APPROVAL"
    || appError.code === "USER_REJECTED"
    || appError.code === "USER_BLOCKED"
    || appError.code === "USER_STATUS_INVALID"
  ) {
    return "authentication";
  }

  if (isSequelizeError(originalError)) {
    return "persistence_failure";
  }

  if (appError.statusCode >= 500) {
    return "integration_error";
  }

  return "application_error";
}

function errorHandler(error, request, response, _next) {
  const appError =
    error instanceof AppError
      ? error
      : new AppError("Erro interno do servidor.", {
          statusCode: 500,
          code: "INTERNAL_ERROR",
        });

  const category = classifyError(appError, error);
  const logLevel = category === "authentication" && appError.statusCode < 500 ? "warn" : "error";

  logger[logLevel]("Falha no processamento da requisição.", {
    method: request.method,
    path: request.originalUrl,
    category,
    statusCode: appError.statusCode,
    code: appError.code,
    message: error.message,
    errorName: error.name || "Error",
    details: appError.details,
  });

  response.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
    },
  });
}

module.exports = { errorHandler };
