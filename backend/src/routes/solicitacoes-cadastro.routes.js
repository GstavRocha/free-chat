const { Router } = require("express");

const {
  approveSolicitacaoCadastroController,
  createSolicitacaoCadastroController,
  listSolicitacoesCadastroController,
  rejectSolicitacaoCadastroController,
} = require("../controllers/solicitacoes-cadastro.controller");
const {
  authenticateJwt,
  requireApprovedUser,
  requireRoles,
} = require("../middlewares/auth.middleware");

function createSolicitacoesCadastroRouter() {
  const router = Router();

  router.post("/", createSolicitacaoCadastroController);

  router.use(authenticateJwt, requireApprovedUser, requireRoles(["ADMIN"]));

  router.get("/", listSolicitacoesCadastroController);
  router.patch("/:id/aprovar", approveSolicitacaoCadastroController);
  router.patch("/:id/rejeitar", rejectSolicitacaoCadastroController);

  return router;
}

module.exports = { createSolicitacoesCadastroRouter };
