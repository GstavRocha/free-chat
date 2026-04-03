const { Router } = require("express");

const { getCurrentSessionController, loginController } = require("../controllers/auth.controller");
const {
  authenticateJwt,
  requireApprovedUser,
  requireRoles,
} = require("../middlewares/auth.middleware");

function createAuthRouter() {
  const router = Router();

  router.post("/login", loginController);
  router.get("/me", authenticateJwt, requireApprovedUser, getCurrentSessionController);
  router.get(
    "/admin-check",
    authenticateJwt,
    requireApprovedUser,
    requireRoles(["ADMIN"]),
    (_request, response) => {
      response.status(200).json({
        authorized: true,
      });
    },
  );

  return router;
}

module.exports = { createAuthRouter };
