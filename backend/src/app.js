const express = require("express");

const { errorHandler } = require("./middlewares/error-handler");
const { notFoundHandler } = require("./middlewares/not-found-handler");
const { requestLogger } = require("./middlewares/request-logger");
const { createApiRouter } = require("./routes");

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);
  app.use(createApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
