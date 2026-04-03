const { AppError } = require("../errors/app-error");

function notFoundHandler(request, _response, next) {
  next(
    new AppError("Recurso não encontrado.", {
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
      details: {
        method: request.method,
        path: request.originalUrl,
      },
    }),
  );
}

module.exports = { notFoundHandler };
