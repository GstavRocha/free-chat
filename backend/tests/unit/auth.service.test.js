const test = require("node:test");
const assert = require("node:assert/strict");

const { AppError } = require("../../src/errors/app-error");
const { loadModuleWithMocks } = require("../helpers/load-module-with-mocks");

const authServicePath = require.resolve("../../src/services/auth.service");
const userRepositoryPath = require.resolve("../../src/repositories/usuario.repository");
const passwordServicePath = require.resolve("../../src/services/password.service");
const tokenServicePath = require.resolve("../../src/services/token.service");
const loggerPath = require.resolve("../../src/utils/logger");

function createAuthServiceHarness(overrides = {}) {
  const loggerCalls = {
    info: [],
    warn: [],
  };

  const mocks = {
    [userRepositoryPath]: {
      findUserByCpf: overrides.findUserByCpf || (async () => null),
      findUserById: overrides.findUserById || (async () => null),
    },
    [passwordServicePath]: {
      comparePassword: overrides.comparePassword || (async () => false),
    },
    [tokenServicePath]: {
      generateToken: overrides.generateToken || (() => "token-fake"),
    },
    [loggerPath]: {
      logger: {
        info(message, context) {
          loggerCalls.info.push({ message, context });
        },
        warn(message, context) {
          loggerCalls.warn.push({ message, context });
        },
        error() {},
      },
    },
  };

  delete require.cache[authServicePath];

  const authService = loadModuleWithMocks(authServicePath, mocks);

  return {
    ...authService,
    loggerCalls,
  };
}

test("login retorna token e usuário serializado para usuário aprovado", async () => {
  const approvedUser = {
    id: "user-1",
    nomeCompleto: "Maria Silva",
    cpf: "12345678901",
    papel: "ALUNO",
    status: "APROVADO",
    senhaHash: "hash-salvo",
  };

  const harness = createAuthServiceHarness({
    findUserByCpf: async () => approvedUser,
    comparePassword: async () => true,
    generateToken: () => "jwt-token",
  });

  const result = await harness.login({
    cpf: "12345678901",
    senha: "teste123",
  });

  assert.deepEqual(result, {
    token: "jwt-token",
    usuario: {
      id: "user-1",
      nomeCompleto: "Maria Silva",
      cpf: "12345678901",
      papel: "ALUNO",
      status: "APROVADO",
    },
  });
  assert.equal(harness.loggerCalls.warn.length, 0);
  assert.equal(harness.loggerCalls.info.length, 1);
  assert.equal(harness.loggerCalls.info[0].context.category, "authentication");
});

test("login rejeita credenciais quando usuário não existe", async () => {
  const harness = createAuthServiceHarness({
    findUserByCpf: async () => null,
  });

  await assert.rejects(
    () => harness.login({ cpf: "00000000000", senha: "teste123" }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "INVALID_CREDENTIALS");
      return true;
    },
  );

  assert.equal(harness.loggerCalls.warn.length, 1);
  assert.equal(harness.loggerCalls.warn[0].context.code, "INVALID_CREDENTIALS");
});

test("login rejeita usuário bloqueado", async () => {
  const harness = createAuthServiceHarness({
    findUserByCpf: async () => ({
      id: "user-2",
      nomeCompleto: "João Bloqueado",
      cpf: "22222222222",
      papel: "ALUNO",
      status: "BLOQUEADO",
      senhaHash: "hash-salvo",
    }),
  });

  await assert.rejects(
    () => harness.login({ cpf: "22222222222", senha: "teste123" }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "USER_BLOCKED");
      return true;
    },
  );

  assert.equal(harness.loggerCalls.warn.length, 1);
  assert.equal(harness.loggerCalls.warn[0].context.code, "USER_BLOCKED");
});

test("login rejeita senha inválida mesmo com usuário aprovado", async () => {
  const harness = createAuthServiceHarness({
    findUserByCpf: async () => ({
      id: "user-3",
      nomeCompleto: "Carlos Souza",
      cpf: "33333333333",
      papel: "PROFESSOR",
      status: "APROVADO",
      senhaHash: "hash-salvo",
    }),
    comparePassword: async () => false,
  });

  await assert.rejects(
    () => harness.login({ cpf: "33333333333", senha: "senha-invalida" }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "INVALID_CREDENTIALS");
      return true;
    },
  );

  assert.equal(harness.loggerCalls.warn.length, 1);
  assert.equal(harness.loggerCalls.warn[0].context.code, "INVALID_CREDENTIALS");
});

test("getAuthenticatedUserProfile retorna usuário serializado", async () => {
  const harness = createAuthServiceHarness({
    findUserById: async () => ({
      id: "user-4",
      nomeCompleto: "Ana Lima",
      cpf: "44444444444",
      papel: "FUNCIONARIO",
      status: "APROVADO",
    }),
  });

  const result = await harness.getAuthenticatedUserProfile("user-4");

  assert.deepEqual(result, {
    id: "user-4",
    nomeCompleto: "Ana Lima",
    cpf: "44444444444",
    papel: "FUNCIONARIO",
    status: "APROVADO",
  });
});

test("getAuthenticatedUserProfile falha quando usuário autenticado não existe", async () => {
  const harness = createAuthServiceHarness({
    findUserById: async () => null,
  });

  await assert.rejects(
    () => harness.getAuthenticatedUserProfile("missing-user"),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "AUTH_USER_NOT_FOUND");
      return true;
    },
  );
});
