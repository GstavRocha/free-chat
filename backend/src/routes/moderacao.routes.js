const { Router } = require("express");

const {
  blockUserModerationController,
  createModerationNoticeForSalaController,
  deleteMensagemModerationController,
  deleteSalaModerationController,
  listModerationLogsController,
  listMensagensBySalaModerationController,
  listSalasModerationController,
  silenceSalaModerationController,
} = require("../controllers/moderacao.controller");
const {
  authenticateJwt,
  requireApprovedUser,
  requireRoles,
} = require("../middlewares/auth.middleware");

function createModeracaoRouter() {
  const router = Router();

  router.use(authenticateJwt, requireApprovedUser, requireRoles(["ADMIN"]));

  router.get("/logs", listModerationLogsController);
  router.get("/salas", listSalasModerationController);
  router.get("/salas/:id/mensagens", listMensagensBySalaModerationController);
  router.patch("/usuarios/:id/bloquear", blockUserModerationController);
  router.patch("/salas/:id/silenciar", silenceSalaModerationController);
  router.patch("/salas/:id/excluir", deleteSalaModerationController);
  router.post("/salas/:id/avisos", createModerationNoticeForSalaController);
  router.patch("/mensagens/:id/excluir", deleteMensagemModerationController);

  return router;
}

module.exports = { createModeracaoRouter };
