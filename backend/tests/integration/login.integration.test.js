const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { Router } = require("express");

const { fetch } = globalThis;
const { AppError } = require("../../src/errors/app-error");
const { loadModuleWithMocks } = require("../helpers/load-module-with-mocks");

const appModulePath = require.resolve("../../src/app");
const routesIndexPath = require.resolve("../../src/routes");
const authControllerPath = require.resolve("../../src/controllers/auth.controller");
const authServicePath = require.resolve("../../src/services/auth.service");
const loggerPath = require.resolve("../../src/utils/logger");

function createCreateAppHarness(overrides = {}) {
  const loggerCalls = {
    info: [],
    warn: [],
    error: [],
  };

  const mocks = {
    [authServicePath]: {
      login: overrides.login || (async () => {
        throw new AppError("Credenciais inválidas.", {
          statusCode: 401,
          code: "INVALID_CREDENTIALS",
        });
      }),
      getAuthenticatedUserProfile: overrides.getAuthenticatedUserProfile || (async () => null),
    },
    [loggerPath]: {
      logger: {
        info(message, context) {
          loggerCalls.info.push({ message, context });
        },
        warn(message, context) {
          loggerCalls.warn.push({ message, context });
        },
        error(message, context) {
          loggerCalls.error.push({ message, context });
        },
      },
    },
    [routesIndexPath]: {
      createApiRouter() {
        const router = Router();
        const { loginController } = require(authControllerPath);

        router.post("/api/auth/login", loginController);

        return router;
      },
    },
  };

  delete require.cache[authControllerPath];
  const { loginController } = loadModuleWithMocks(authControllerPath, mocks);

  mocks[routesIndexPath] = {
    createApiRouter() {
      const router = Router();

      router.post("/api/auth/login", loginController);

      return router;
    },
  };

  delete require.cache[appModulePath];

  const { createApp } = loadModuleWithMocks(appModulePath, mocks);

  return {
    createApp,
    loggerCalls,
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

test("POST /api/auth/login retorna 200 com token e usuário serializado", async () => {
  const harness = createCreateAppHarness({
    login: async ({ cpf, senha }) => ({
      token: `jwt-${cpf}-${senha}`,
      usuario: {
        id: "user-1",
        nomeCompleto: "Maria Silva",
        cpf,
        papel: "ALUNO",
        status: "APROVADO",
      },
    }),
  });

  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        cpf: "123.456.789-01",
        senha: "teste123",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      token: "jwt-12345678901-teste123",
      usuario: {
        id: "user-1",
        nomeCompleto: "Maria Silva",
        cpf: "12345678901",
        papel: "ALUNO",
        status: "APROVADO",
      },
    });
  });
});

test("POST /api/auth/login retorna 400 quando o payload é inválido", async () => {
  const harness = createCreateAppHarness();
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        cpf: "   ",
        senha: "",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "INVALID_LOGIN_PAYLOAD");
    assert.deepEqual(payload.error.details.blankFields, ["cpf", "senha"]);
  });
});

test("POST /api/auth/login retorna 401 quando o serviço rejeita as credenciais", async () => {
  const harness = createCreateAppHarness({
    login: async () => {
      throw new AppError("Credenciais inválidas.", {
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
      });
    },
  });
  const app = harness.createApp();

  await withHttpServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        cpf: "12345678901",
        senha: "senha-invalida",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error.code, "INVALID_CREDENTIALS");
    assert.equal(payload.error.message, "Credenciais inválidas.");
  });
});
