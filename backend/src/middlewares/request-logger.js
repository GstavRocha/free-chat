const { logger } = require("../utils/logger");

function requestLogger(request, response, next) {
  const startedAt = Date.now();

  response.on("finish", () => {
    logger.info("Requisição processada.", {
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}

module.exports = { requestLogger };
