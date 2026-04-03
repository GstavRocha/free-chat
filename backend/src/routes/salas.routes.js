const { Router } = require("express");

const {
  createSalaController,
  deleteSalaController,
  getSalaByIdController,
  listSalasController,
  silenceSalaController,
  updateSalaController,
} = require("../controllers/salas.controller");
const {
  createModerationNoticeController,
  createMensagemController,
  listHistoricoSalaController,
} = require("../controllers/mensagens.controller");
const {
  registrarEntradaEmSalaController,
  registrarSaidaDaSalaController,
} = require("../controllers/participacao.controller");
const {
  authenticateJwt,
  requireApprovedUser,
  requireRoles,
} = require("../middlewares/auth.middleware");

function createSalasRouter() {
  const router = Router();

  router.use(authenticateJwt, requireApprovedUser);

  router.get("/", listSalasController);
  router.get("/:id", getSalaByIdController);
  router.get("/:id/mensagens", listHistoricoSalaController);
  router.post("/:id/entrar", registrarEntradaEmSalaController);
  router.post("/:id/sair", registrarSaidaDaSalaController);
  router.post("/:id/mensagens", createMensagemController);
  router.post("/:id/avisos-moderacao", requireRoles(["ADMIN"]), createModerationNoticeController);
  router.post("/", createSalaController);
  router.patch("/:id/silenciar", requireRoles(["ADMIN"]), silenceSalaController);
  router.patch("/:id", updateSalaController);
  router.patch("/:id/excluir", deleteSalaController);

  return router;
}

module.exports = { createSalasRouter };
