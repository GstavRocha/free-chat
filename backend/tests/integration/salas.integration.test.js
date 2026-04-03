const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { Router } = require("express");

const { fetch } = globalThis;
const { loadModuleWithMocks } = require("../helpers/load-module-with-mocks");

const appModulePath = require.resolve("../../src/app");
const routesIndexPath = require.resolve("../../src/routes");
const authMiddlewarePath = require.resolve("../../src/middlewares/auth.middleware");
const salasControllerPath = require.resolve("../../src/controllers/salas.controller");
const tokenServicePath = require.resolve("../../src/services/token.service");
const userRepositoryPath = require.resolve("../../src/repositories/usuario.repository");
const salasServicePath = require.resolve("../../src/services/salas.service");
const loggerPath = require.resolve("../../src/utils/logger");

function createSalasIntegrationHarness(overrides = {}) {
  const mocks = {
    [tokenServicePath]: {
      verifyToken: overrides.verifyToken || (() => ({
        id: "user-1",
        papel: "ALUNO",
      })),
    },
    [userRepositoryPath]: {
      findUserById: overrides.findUserById || (async () => ({
        id: "user-1",
        nomeCompleto: "Maria Silva",
        papel: "ALUNO",
        status: "APROVADO",
      })),
    },
    [salasServicePath]: {
      createPublicSala: overrides.createPublicSala || (async ({ nome, descricao, proprietarioId }) => ({
        id: "sala-1",
        nome,
        descricao: descricao || null,
        status: "ATIVA",
        proprietarioId,
        criadoEm: "2026-04-03T12:00:00.000Z",
        atualizadoEm: null,
        excluidoEm: null,
      })),
      deletePublicSala: async () => null,
      getSalaByIdForAccess: async () => null,
      listAvailableSalas: async () => [],
      silenceSalaAdministratively: async () => null,
      updatePublicSala: async () => null,
    },
    [loggerPath]: {
      logger: {
        info() {},
        warn() {},
        error() {},
      },
    },
  };

  delete require.cache[authMiddlewarePath];
  delete require.cache[salasControllerPath];

  const {
    authenticateJwt,
    requireApprovedUser,
  } = loadModuleWithMocks(authMiddlewarePath, mocks);
  const { createSalaController } = loadModuleWithMocks(salasControllerPath, mocks);

  mocks[routesIndexPath] = {
    createApiRouter() {
      const router = Router();

      router.use("/api/salas", authenticateJwt, requireApprovedUser);
      router.post("/api/salas", createSalaController);

      return router;
    },
  };

  delete require.cache[appModulePath];

  const { createApp } = loadModuleWithMocks(appModulePath, mocks);

  return { createApp };
}

async function withHttpServer(app, callback) {
  const server = app.listen(0);
  await once(server, "listening");

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await callback(baseUrl);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("POST /api/salas retorna 201 ao criar sala autenticada", async () => {
  const harness = createSalasIntegrationHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/salas`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-valido",
      },
      body: JSON.stringify({
        nome: " Sala de Estudos ",
        descricao: "  Conversas da turma  ",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      sala: {
        id: "sala-1",
        nome: "Sala de Estudos",
        descricao: "Conversas da turma",
        status: "ATIVA",
        proprietarioId: "user-1",
        criadoEm: "2026-04-03T12:00:00.000Z",
        atualizadoEm: null,
        excluidoEm: null,
      },
    });
  });
});

test("POST /api/salas retorna 400 quando o payload da sala é inválido", async () => {
  const harness = createSalasIntegrationHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/salas`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-valido",
      },
      body: JSON.stringify({
        nome: "   ",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "INVALID_ROOM_PAYLOAD");
    assert.deepEqual(payload.error.details.blankFields, ["nome"]);
  });
});

test("POST /api/salas retorna 401 quando o token não é informado", async () => {
  const harness = createSalasIntegrationHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/salas`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        nome: "Sala sem token",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error.code, "AUTH_TOKEN_MISSING");
  });
});

test("POST /api/salas retorna 403 quando o usuário autenticado não está aprovado", async () => {
  const harness = createSalasIntegrationHarness({
    findUserById: async () => ({
      id: "user-1",
      nomeCompleto: "Maria Silva",
      papel: "ALUNO",
      status: "BLOQUEADO",
    }),
  });
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/salas`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-valido",
      },
      body: JSON.stringify({
        nome: "Sala bloqueada",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error.code, "AUTH_USER_NOT_APPROVED");
    assert.deepEqual(payload.error.details, {
      status: "BLOQUEADO",
    });
  });
});
