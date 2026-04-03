const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { Router } = require("express");

const { fetch } = globalThis;
const { AppError } = require("../../src/errors/app-error");
const { loadModuleWithMocks } = require("../helpers/load-module-with-mocks");

const appModulePath = require.resolve("../../src/app");
const routesIndexPath = require.resolve("../../src/routes");
const authMiddlewarePath = require.resolve("../../src/middlewares/auth.middleware");
const mensagensControllerPath = require.resolve("../../src/controllers/mensagens.controller");
const tokenServicePath = require.resolve("../../src/services/token.service");
const userRepositoryPath = require.resolve("../../src/repositories/usuario.repository");
const mensagensServicePath = require.resolve("../../src/services/mensagens.service");
const websocketEventsPath = require.resolve("../../src/websocket/events");
const loggerPath = require.resolve("../../src/utils/logger");

function createMensagensIntegrationHarness(overrides = {}) {
  const calls = {
    broadcastMessageCreated: [],
  };

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
    [mensagensServicePath]: {
      createModerationNotice: async () => null,
      createRoomMessage: overrides.createRoomMessage || (async ({ salaId, autorId, conteudo, tipoMensagem }) => ({
        id: "mensagem-1",
        salaId,
        autorId,
        tipoMensagem,
        conteudo,
        criadoEm: "2026-04-03T13:00:00.000Z",
        atualizadoEm: null,
        excluidoEm: null,
      })),
      deleteOwnMessage: async () => null,
      getRoomHistory: async () => [],
      updateOwnMessage: async () => null,
    },
    [websocketEventsPath]: {
      broadcastMessageCreated(mensagem) {
        calls.broadcastMessageCreated.push(mensagem);
        return 1;
      },
      broadcastMessageDeleted() {
        return 0;
      },
      broadcastMessageUpdated() {
        return 0;
      },
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
  delete require.cache[mensagensControllerPath];

  const {
    authenticateJwt,
    requireApprovedUser,
  } = loadModuleWithMocks(authMiddlewarePath, mocks);
  const { createMensagemController } = loadModuleWithMocks(mensagensControllerPath, mocks);

  mocks[routesIndexPath] = {
    createApiRouter() {
      const router = Router();

      router.use("/api/salas", authenticateJwt, requireApprovedUser);
      router.post("/api/salas/:id/mensagens", createMensagemController);

      return router;
    },
  };

  delete require.cache[appModulePath];
  const { createApp } = loadModuleWithMocks(appModulePath, mocks);

  return {
    createApp,
    calls,
  };
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

test("POST /api/salas/:id/mensagens retorna 201 e publica broadcast ao enviar mensagem", async () => {
  const harness = createMensagensIntegrationHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/salas/sala-1/mensagens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-valido",
      },
      body: JSON.stringify({
        conteudo: " Mensagem integrada ",
        tipoMensagem: "CODIGO",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      mensagem: {
        id: "mensagem-1",
        salaId: "sala-1",
        autorId: "user-1",
        tipoMensagem: "CODIGO",
        conteudo: "Mensagem integrada",
        criadoEm: "2026-04-03T13:00:00.000Z",
        atualizadoEm: null,
        excluidoEm: null,
      },
    });
  });

  assert.equal(harness.calls.broadcastMessageCreated.length, 1);
  assert.equal(harness.calls.broadcastMessageCreated[0].id, "mensagem-1");
  assert.equal(harness.calls.broadcastMessageCreated[0].salaId, "sala-1");
});

test("POST /api/salas/:id/mensagens retorna 400 quando o payload da mensagem é inválido", async () => {
  const harness = createMensagensIntegrationHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/salas/sala-1/mensagens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-valido",
      },
      body: JSON.stringify({
        conteudo: "   ",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "INVALID_MESSAGE_PAYLOAD");
    assert.deepEqual(payload.error.details.blankFields, ["conteudo"]);
  });
});

test("POST /api/salas/:id/mensagens retorna 403 quando o usuário ainda não entrou na sala", async () => {
  const harness = createMensagensIntegrationHarness({
    createRoomMessage: async () => {
      throw new AppError("Usuário precisa entrar na sala antes de enviar mensagens.", {
        statusCode: 403,
        code: "ROOM_ENTRY_REQUIRED",
      });
    },
  });
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/salas/sala-1/mensagens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-valido",
      },
      body: JSON.stringify({
        conteudo: "Mensagem sem entrada",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error.code, "ROOM_ENTRY_REQUIRED");
  });

  assert.equal(harness.calls.broadcastMessageCreated.length, 0);
});

test("POST /api/salas/:id/mensagens retorna 409 quando a sala não aceita novas mensagens", async () => {
  const harness = createMensagensIntegrationHarness({
    createRoomMessage: async () => {
      throw new AppError("Sala não aceita novas mensagens.", {
        statusCode: 409,
        code: "ROOM_MESSAGE_UNAVAILABLE",
        details: {
          status: "SILENCIADA",
        },
      });
    },
  });
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/salas/sala-1/mensagens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-valido",
      },
      body: JSON.stringify({
        conteudo: "Mensagem em sala silenciada",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 409);
    assert.equal(payload.error.code, "ROOM_MESSAGE_UNAVAILABLE");
    assert.deepEqual(payload.error.details, {
      status: "SILENCIADA",
    });
  });

  assert.equal(harness.calls.broadcastMessageCreated.length, 0);
});
