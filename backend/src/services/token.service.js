const jwt = require("jsonwebtoken");

const { AppError } = require("../errors/app-error");
const { getEnv } = require("../config/env");

function generateToken(payload) {
  const env = getEnv();

  return jwt.sign(payload, env.auth.jwtSecret, {
    expiresIn: env.auth.jwtExpiresIn,
  });
}

function verifyToken(token) {
  const env = getEnv();

  try {
    return jwt.verify(token, env.auth.jwtSecret);
  } catch {
    throw new AppError("Token inválido ou expirado.", {
      statusCode: 401,
      code: "AUTH_TOKEN_INVALID",
    });
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
