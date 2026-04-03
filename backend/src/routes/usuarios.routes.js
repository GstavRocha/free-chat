const { Router } = require("express");

const {
  getUserByIdController,
  listUsersController,
  updateUserStatusController,
} = require("../controllers/usuarios.controller");
const {
  authenticateJwt,
  requireApprovedUser,
  requireRoles,
} = require("../middlewares/auth.middleware");

function createUsuariosRouter() {
  const router = Router();

  router.use(authenticateJwt, requireApprovedUser, requireRoles(["ADMIN"]));

  router.get("/", listUsersController);
  router.get("/:id", getUserByIdController);
  router.patch("/:id/status", updateUserStatusController);

  return router;
}

module.exports = { createUsuariosRouter };
