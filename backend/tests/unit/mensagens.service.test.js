const test = require("node:test");
const assert = require("node:assert/strict");

const { AppError } = require("../../src/errors/app-error");
const { loadModuleWithMocks } = require("../helpers/load-module-with-mocks");

const mensagensServicePath = require.resolve("../../src/services/mensagens.service");
const modelsPath = require.resolve("../../src/models");
const mensagensRepositoryPath = require.resolve("../../src/repositories/mensagens.repository");
const participacaoRepositoryPath = require.resolve("../../src/repositories/participacao.repository");
const salasRepositoryPath = require.resolve("../../src/repositories/salas.repository");
const usuarioRepositoryPath = require.resolve("../../src/repositories/usuario.repository");
const logsModeracaoServicePath = require.resolve("../../src/services/logs-moderacao.service");

function createMensagensServiceHarness(overrides = {}) {
  const transactionState = {
    commitCalls: 0,
    rollbackCalls: 0,
  };
  const capturedCalls = {
    createMensagem: [],
    registerModerationLog: [],
    deleteMensagemLogicamente: [],
  };
  const transaction = {
    async commit() {
      transactionState.commitCalls += 1;
    },
    async rollback() {
      transactionState.rollbackCalls += 1;
    },
  };

  const mocks = {
    [modelsPath]: {
      sequelize: {
        transaction: overrides.transaction || (async () => transaction),
      },
    },
    [mensagensRepositoryPath]: {
      createMensagem: overrides.createMensagem || (async (payload) => {
        capturedCalls.createMensagem.push(payload);

        return {
          id: "mensagem-1",
          atualizadoEm: null,
          excluidoEm: null,
          criadoEm: "2026-04-03T10:00:00.000Z",
          ...payload,
        };
      }),
      deleteMensagemLogicamente: overrides.deleteMensagemLogicamente || (async (mensagemId) => {
        capturedCalls.deleteMensagemLogicamente.push(mensagemId);

        return {
          id: mensagemId,
          salaId: "sala-1",
          autorId: "autor-1",
          tipoMensagem: "TEXTO",
          conteudo: "mensagem excluida",
          criadoEm: "2026-04-03T10:00:00.000Z",
          atualizadoEm: null,
          excluidoEm: "2026-04-03T11:00:00.000Z",
        };
      }),
      findMensagemById: overrides.findMensagemById || (async () => null),
      listMensagensBySala: overrides.listMensagensBySala || (async () => []),
      listMensagensBySalaParaModeracao: overrides.listMensagensBySalaParaModeracao || (async () => []),
      updateMensagem: overrides.updateMensagem || (async () => null),
    },
    [participacaoRepositoryPath]: {
      findUltimoEventoParticipacao: overrides.findUltimoEventoParticipacao || (async () => null),
    },
    [salasRepositoryPath]: {
      findSalaById: overrides.findSalaById || (async () => null),
    },
    [usuarioRepositoryPath]: {
      findUserById: overrides.findUserById || (async () => null),
    },
    [logsModeracaoServicePath]: {
      registerModerationLog: overrides.registerModerationLog || (async (payload) => {
        capturedCalls.registerModerationLog.push(payload);
      }),
    },
  };

  delete require.cache[mensagensServicePath];

  const mensagensService = loadModuleWithMocks(mensagensServicePath, mocks);

  return {
    ...mensagensService,
    capturedCalls,
    transactionState,
  };
}

test("createRoomMessage cria mensagem para participante ativo e sanitiza o conteúdo", async () => {
  const harness = createMensagensServiceHarness({
    findUserById: async () => ({
      id: "autor-1",
      papel: "ALUNO",
      status: "APROVADO",
    }),
    findSalaById: async () => ({
      id: "sala-1",
      status: "ATIVA",
      excluidoEm: null,
    }),
    findUltimoEventoParticipacao: async () => ({
      tipoEvento: "ENTRADA",
    }),
  });

  const result = await harness.createRoomMessage({
    salaId: "sala-1",
    autorId: "autor-1",
    conteudo: "  Olá   mundo \n  segunda linha  ",
    tipoMensagem: "TEXTO",
  });

  assert.equal(harness.capturedCalls.createMensagem.length, 1);
  assert.deepEqual(harness.capturedCalls.createMensagem[0], {
    salaId: "sala-1",
    autorId: "autor-1",
    tipoMensagem: "TEXTO",
    conteudo: "Olá mundo\nsegunda linha",
  });
  assert.equal(result.conteudo, "Olá mundo\nsegunda linha");
  assert.equal(result.tipoMensagem, "TEXTO");
});

test("createRoomMessage rejeita usuário sem entrada ativa na sala", async () => {
  const harness = createMensagensServiceHarness({
    findUserById: async () => ({
      id: "autor-1",
      papel: "ALUNO",
      status: "APROVADO",
    }),
    findSalaById: async () => ({
      id: "sala-1",
      status: "ATIVA",
      excluidoEm: null,
    }),
    findUltimoEventoParticipacao: async () => null,
  });

  await assert.rejects(
    () => harness.createRoomMessage({
      salaId: "sala-1",
      autorId: "autor-1",
      conteudo: "Mensagem sem entrada",
    }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "ROOM_ENTRY_REQUIRED");
      return true;
    },
  );
});

test("createModerationNotice cria aviso administrativo, registra log e confirma a transação", async () => {
  const harness = createMensagensServiceHarness({
    findUserById: async () => ({
      id: "admin-1",
      papel: "ADMIN",
      status: "APROVADO",
    }),
    findSalaById: async () => ({
      id: "sala-1",
      status: "ATIVA",
      excluidoEm: null,
    }),
  });

  const result = await harness.createModerationNotice({
    salaId: "sala-1",
    autorId: "admin-1",
    conteudo: "  Atenção \n  regra aplicada  ",
  });

  assert.equal(harness.transactionState.commitCalls, 1);
  assert.equal(harness.transactionState.rollbackCalls, 0);
  assert.equal(harness.capturedCalls.createMensagem.length, 1);
  assert.deepEqual(harness.capturedCalls.createMensagem[0], {
    salaId: "sala-1",
    autorId: "admin-1",
    tipoMensagem: "AVISO_MODERACAO",
    conteudo: "Atenção\nregra aplicada",
  });
  assert.equal(harness.capturedCalls.registerModerationLog.length, 1);
  assert.deepEqual(harness.capturedCalls.registerModerationLog[0], {
    administradorId: "admin-1",
    salaAlvo: "sala-1",
    mensagemAlvo: "mensagem-1",
    tipoAcao: "ENVIAR_AVISO_MODERACAO",
    motivo: "Atenção\nregra aplicada",
  });
  assert.equal(result.tipoMensagem, "AVISO_MODERACAO");
});

test("deleteOwnMessage exige motivo na remoção administrativa e faz rollback da transação", async () => {
  const harness = createMensagensServiceHarness({
    findUserById: async () => ({
      id: "admin-1",
      papel: "ADMIN",
      status: "APROVADO",
    }),
    findMensagemById: async () => ({
      id: "mensagem-1",
      autorId: "autor-1",
      excluidoEm: null,
    }),
  });

  await assert.rejects(
    () => harness.deleteOwnMessage({
      mensagemId: "mensagem-1",
      actorUserId: "admin-1",
      actorRole: "ADMIN",
      motivo: "   ",
    }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "MESSAGE_DELETE_REASON_REQUIRED");
      return true;
    },
  );

  assert.equal(harness.transactionState.commitCalls, 0);
  assert.equal(harness.transactionState.rollbackCalls, 1);
  assert.equal(harness.capturedCalls.deleteMensagemLogicamente.length, 0);
  assert.equal(harness.capturedCalls.registerModerationLog.length, 0);
});

test("getRoomHistory retorna histórico serializado para participante ativo", async () => {
  const harness = createMensagensServiceHarness({
    findUserById: async () => ({
      id: "autor-1",
      papel: "ALUNO",
      status: "APROVADO",
    }),
    findSalaById: async () => ({
      id: "sala-1",
      status: "ATIVA",
      excluidoEm: null,
    }),
    findUltimoEventoParticipacao: async () => ({
      tipoEvento: "ENTRADA",
    }),
    listMensagensBySala: async () => [
      {
        id: "mensagem-1",
        salaId: "sala-1",
        autorId: "autor-1",
        tipoMensagem: "TEXTO",
        conteudo: "Primeira mensagem",
        criadoEm: "2026-04-03T10:00:00.000Z",
        atualizadoEm: null,
        autor: {
          id: "autor-1",
          nomeCompleto: "Maria Silva",
          papel: "ALUNO",
        },
      },
    ],
  });

  const result = await harness.getRoomHistory({
    salaId: "sala-1",
    actorUserId: "autor-1",
  });

  assert.deepEqual(result, [
    {
      id: "mensagem-1",
      salaId: "sala-1",
      tipoMensagem: "TEXTO",
      conteudo: "Primeira mensagem",
      criadoEm: "2026-04-03T10:00:00.000Z",
      atualizadoEm: null,
      autor: {
        id: "autor-1",
        nomeCompleto: "Maria Silva",
        papel: "ALUNO",
      },
    },
  ]);
});
