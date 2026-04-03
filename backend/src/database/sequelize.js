const { Sequelize } = require("sequelize");

const { getEnv } = require("../config/env");
const { logger } = require("../utils/logger");

const env = getEnv();

const sequelize = new Sequelize(env.database.name, env.database.user, env.database.password, {
  host: env.database.host,
  port: env.database.port,
  dialect: "postgres",
  logging: false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: false,
  },
});

async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    logger.info("Conexão com PostgreSQL estabelecida com sucesso.", {
      category: "persistence",
      host: env.database.host,
      port: env.database.port,
      database: env.database.name,
    });
  } catch (error) {
    logger.error("Falha ao autenticar conexão com PostgreSQL.", {
      category: "persistence_failure",
      host: env.database.host,
      port: env.database.port,
      database: env.database.name,
      errorName: error.name || "Error",
      message: error.message,
    });
    throw error;
  }
}

module.exports = { sequelize, testDatabaseConnection };
