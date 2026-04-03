const { createApp } = require("./app");
const { logger } = require("./utils/logger");

const PORT = process.env.PORT || 3000;

createApp();

logger.info("Servidor da aplicação inicializado.", {
  category: "application_boot",
  port: PORT,
});
