const { Router } = require("express");

const {
  createModerationLogController,
  listModerationLogsController,
} = require("../controllers/logs-moderacao.controller");
const {
  authenticateJwt,
  requireApprovedUser,
  requireRoles,
} = require("../middlewares/auth.middleware");

function createLogsModeracaoRouter() {
  const router = Router();

  router.use(authenticateJwt, requireApprovedUser, requireRoles(["ADMIN"]));

  router.get("/", listModerationLogsController);
  router.post("/", createModerationLogController);

  return router;
}

module.exports = { createLogsModeracaoRouter };
