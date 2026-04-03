const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { Router } = require("express");

const { fetch } = globalThis;
const { loadModuleWithMocks } = require("../helpers/load-module-with-mocks");

const appModulePath = require.resolve("../../src/app");
const routesIndexPath = require.resolve("../../src/routes");
const moderacaoRoutesPath = require.resolve("../../src/routes/moderacao.routes");
const moderacaoControllerPath = require.resolve("../../src/controllers/moderacao.controller");
const authMiddlewarePath = require.resolve("../../src/middlewares/auth.middleware");
const tokenServicePath = require.resolve("../../src/services/token.service");
const userRepositoryPath = require.resolve("../../src/repositories/usuario.repository");
const usuariosServicePath = require.resolve("../../src/services/usuarios.service");
const salasServicePath = require.resolve("../../src/services/salas.service");
const mensagensServicePath = require.resolve("../../src/services/mensagens.service");
const logsModeracaoServicePath = require.resolve("../../src/services/logs-moderacao.service");
const websocketEventsPath = require.resolve("../../src/websocket/events");
const loggerPath = require.resolve("../../src/utils/logger");

function createModeracaoIntegrationHarness(overrides = {}) {
  const calls = {
    broadcastMessageCreated: [],
    broadcastRoomUpdated: [],
  };

  const mocks = {
    [tokenServicePath]: {
      verifyToken: overrides.verifyToken || (() => ({
        id: "admin-1",
        papel: "ADMIN",
      })),
    },
    [userRepositoryPath]: {
      findUserById: overrides.findUserById || (async () => ({
        id: "admin-1",
        nomeCompleto: "Admin",
        papel: "ADMIN",
        status: "APROVADO",
      })),
    },
    [usuariosServicePath]: {
      updateAdministrativeUserStatus: overrides.updateAdministrativeUserStatus || (async ({
        targetUserId,
        newStatus,
        actorUserId,
        motivo,
      }) => ({
        id: targetUserId,
        nomeCompleto: "Usuário Moderado",
        papel: "ALUNO",
        status: newStatus,
        atualizadoPor: actorUserId,
        motivoBloqueio: motivo,
      })),
    },
    [salasServicePath]: {
      deletePublicSala: async () => null,
      listSalasForModeration: async () => [],
      silenceSalaAdministratively: overrides.silenceSalaAdministratively || (async ({
        salaId,
        actorUserId,
        motivo,
      }) => ({
        id: salaId,
        nome: "Sala Moderada",
        status: "SILENCIADA",
        proprietarioId: "user-1",
        atualizadoPor: actorUserId,
        motivoSilenciamento: motivo,
      })),
    },
    [mensagensServicePath]: {
      createModerationNotice: overrides.createModerationNotice || (async ({
        salaId,
        autorId,
        conteudo,
      }) => ({
        id: "mensagem-1",
        salaId,
        autorId,
        tipoMensagem: "AVISO_MODERACAO",
        conteudo,
        criadoEm: "2026-04-03T14:00:00.000Z",
        atualizadoEm: null,
        excluidoEm: null,
      })),
      deleteOwnMessage: async () => null,
      getRoomHistoryForModeration: async () => [],
    },
    [logsModeracaoServicePath]: {
      listModerationLogs: overrides.listModerationLogs || (async () => [
        {
          id: "log-1",
          tipoAcao: "BLOQUEAR_USUARIO",
          motivo: "Motivo de teste",
        },
      ]),
    },
    [websocketEventsPath]: {
      broadcastMessageCreated(mensagem) {
        calls.broadcastMessageCreated.push(mensagem);
        return 1;
      },
      broadcastMessageDeleted() {
        return 0;
      },
      broadcastRoomUpdated(sala) {
        calls.broadcastRoomUpdated.push(sala);
        return 1;
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
  delete require.cache[moderacaoControllerPath];
  delete require.cache[moderacaoRoutesPath];
  const { createModeracaoRouter } = loadModuleWithMocks(moderacaoRoutesPath, mocks);

  mocks[routesIndexPath] = {
    createApiRouter() {
      const router = Router();

      router.use("/api/moderacao", createModeracaoRouter());

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

test("PATCH /api/moderacao/usuarios/:id/bloquear retorna 200 em bloqueio administrativo", async () => {
  const harness = createModeracaoIntegrationHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/moderacao/usuarios/user-2/bloquear`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-admin",
      },
      body: JSON.stringify({
        motivo: " Conduta inadequada ",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      usuario: {
        id: "user-2",
        nomeCompleto: "Usuário Moderado",
        papel: "ALUNO",
        status: "BLOQUEADO",
        atualizadoPor: "admin-1",
        motivoBloqueio: "Conduta inadequada",
      },
    });
  });
});

test("PATCH /api/moderacao/usuarios/:id/bloquear retorna 400 para payload inválido", async () => {
  const harness = createModeracaoIntegrationHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/moderacao/usuarios/user-2/bloquear`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-admin",
      },
      body: JSON.stringify({
        motivo: "   ",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "INVALID_MODERATION_BLOCK_PAYLOAD");
    assert.deepEqual(payload.error.details.blankFields, ["motivo"]);
  });
});

test("PATCH /api/moderacao/salas/:id/silenciar retorna 200 e publica atualização da sala", async () => {
  const harness = createModeracaoIntegrationHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/moderacao/salas/sala-1/silenciar`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-admin",
      },
      body: JSON.stringify({
        motivo: " Sala fora das regras ",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.sala.id, "sala-1");
    assert.equal(payload.sala.status, "SILENCIADA");
  });

  assert.equal(harness.calls.broadcastRoomUpdated.length, 1);
  assert.equal(harness.calls.broadcastRoomUpdated[0].id, "sala-1");
});

test("POST /api/moderacao/salas/:id/avisos retorna 201 e publica aviso de moderação", async () => {
  const harness = createModeracaoIntegrationHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/moderacao/salas/sala-1/avisos`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-admin",
      },
      body: JSON.stringify({
        conteudo: " Aviso importante ",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.mensagem.tipoMensagem, "AVISO_MODERACAO");
    assert.equal(payload.mensagem.conteudo, "Aviso importante");
  });

  assert.equal(harness.calls.broadcastMessageCreated.length, 1);
  assert.equal(harness.calls.broadcastMessageCreated[0].tipoMensagem, "AVISO_MODERACAO");
});

test("GET /api/moderacao/logs retorna 403 para usuário autenticado sem papel ADMIN", async () => {
  const harness = createModeracaoIntegrationHarness({
    verifyToken: () => ({
      id: "user-1",
      papel: "ALUNO",
    }),
    findUserById: async () => ({
      id: "user-1",
      nomeCompleto: "Aluno",
      papel: "ALUNO",
      status: "APROVADO",
    }),
  });
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/moderacao/logs`, {
      method: "GET",
      headers: {
        authorization: "Bearer token-aluno",
      },
    });

    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error.code, "FORBIDDEN");
    assert.deepEqual(payload.error.details, {
      requiredRoles: ["ADMIN"],
    });
  });
});
