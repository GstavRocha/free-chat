const test = require("node:test");
const assert = require("node:assert/strict");

const { AppError } = require("../../src/errors/app-error");

const tokenServicePath = require.resolve("../../src/services/token.service");
const envModulePath = require.resolve("../../src/config/env");

function loadTokenService() {
  delete require.cache[tokenServicePath];
  delete require.cache[envModulePath];

  return require(tokenServicePath);
}

test.beforeEach(() => {
  process.env.DB_HOST = "localhost";
  process.env.DB_PORT = "5432";
  process.env.DB_NAME = "free_chat";
  process.env.DB_USER = "postgres";
  process.env.DB_PASS = "postgres";
  process.env.JWT_SECRET = "segredo-de-teste";
  process.env.JWT_EXPIRES_IN = "1d";
});

test("generateToken e verifyToken preservam o payload esperado", () => {
  const { generateToken, verifyToken } = loadTokenService();

  const token = generateToken({
    id: "user-1",
    papel: "ADMIN",
  });

  const payload = verifyToken(token);

  assert.equal(payload.id, "user-1");
  assert.equal(payload.papel, "ADMIN");
});

test("verifyToken rejeita token inválido com AppError padronizado", () => {
  const { verifyToken } = loadTokenService();

  assert.throws(
    () => verifyToken("token-invalido"),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "AUTH_TOKEN_INVALID");
      assert.equal(error.statusCode, 401);
      return true;
    },
  );
});
