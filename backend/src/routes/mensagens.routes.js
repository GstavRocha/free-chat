const { Router } = require("express");

const { deleteMensagemController, updateMensagemController } = require("../controllers/mensagens.controller");
const { authenticateJwt, requireApprovedUser } = require("../middlewares/auth.middleware");

function createMensagensRouter() {
  const router = Router();

  router.use(authenticateJwt, requireApprovedUser);

  router.patch("/:id", updateMensagemController);
  router.patch("/:id/excluir", deleteMensagemController);

  return router;
}

module.exports = { createMensagensRouter };
