const { Router } = require("express");

const { createAuthRouter } = require("./auth.routes");
const { createLogsModeracaoRouter } = require("./logs-moderacao.routes");
const { createMensagensRouter } = require("./mensagens.routes");
const { createModeracaoRouter } = require("./moderacao.routes");
const { createSalasRouter } = require("./salas.routes");
const { createSolicitacoesCadastroRouter } = require("./solicitacoes-cadastro.routes");
const { createUsuariosRouter } = require("./usuarios.routes");
const { getHealth, getRoot } = require("../controllers/system.controller");

function createApiRouter() {
  const router = Router();

  router.get("/", getRoot);
  router.get("/health", getHealth);
  router.use("/api/auth", createAuthRouter());
  router.use("/api/logs-moderacao", createLogsModeracaoRouter());
  router.use("/api/mensagens", createMensagensRouter());
  router.use("/api/moderacao", createModeracaoRouter());
  router.use("/api/salas", createSalasRouter());
  router.use("/api/solicitacoes-cadastro", createSolicitacoesCadastroRouter());
  router.use("/api/usuarios", createUsuariosRouter());

  return router;
}

module.exports = { createApiRouter };
