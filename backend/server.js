require("dotenv").config();

const http = require("http");

const { createApp } = require("./src/app");
const { getEnv } = require("./src/config/env");
const { testDatabaseConnection } = require("./src/database/sequelize");
const { initModels } = require("./src/models");
const { logger } = require("./src/utils/logger");
const { createWebSocketServer } = require("./src/websocket/server");

const env = getEnv();
const app = createApp();
const httpServer = http.createServer(app);

async function startServer() {
  initModels();
  await testDatabaseConnection();
  createWebSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    logger.info("Servidor backend inicializado.", {
      port: env.port,
    });

    logger.info("Servidor WebSocket inicializado.", {
      path: "/ws",
      port: env.port,
    });
  });
}

startServer().catch((error) => {
  logger.error("Falha ao inicializar o backend.", {
    message: error.message,
  });
  process.exit(1);
});
