const { WebSocketServer } = require("ws");

const { AppError } = require("../errors/app-error");
const { createRoomMessage } = require("../services/mensagens.service");
const {
  registrarEntradaEmSala,
  registrarSaidaDaSala,
} = require("../services/participacao.service");
const { logger } = require("../utils/logger");
const {
  authenticateWebSocketRequest,
  ensureAuthenticatedSocketUserApproved,
} = require("./auth");
const { registerRoomEventBroadcaster } = require("./events");
const {
  parseClientMessage,
  sendSocketError,
  sendSocketEvent,
  serializeSocketEvent,
} = require("./protocol");
const { createRoomConnectionRegistry } = require("./rooms");

async function processSocketRoomExit(socket, salaId, connections, options = {}) {
  const resultado = await registrarSaidaDaSala({
    salaId,
    usuarioId: socket.auth.payload.id,
  });

  connections.dissociateSocket(socket);

  if (options.sendConfirmation !== false) {
    sendSocketEvent(socket, "SAIDA_SALA_CONFIRMADA", resultado);
  }

  const payload = serializeSocketEvent("PARTICIPANTE_SAIU", {
    evento: resultado.evento,
    sala: resultado.sala,
    participante: resultado.participante,
  });

  const totalSocketsNotificados = connections.broadcastToRoom(resultado.sala.id, payload);

  logger.info("Evento de saída de sala transmitido via WebSocket.", {
    userId: socket.auth.payload.id,
    salaId: resultado.sala.id,
    eventoParticipacaoId: resultado.evento.id,
    totalSocketsNotificados,
    origin: options.origin || "socket_message",
  });

  return resultado;
}

async function handleSocketMessage(socket, rawMessage, connections) {
  await ensureAuthenticatedSocketUserApproved(socket.auth);

  let message;

  try {
    message = parseClientMessage(rawMessage);
  } catch {
    throw new AppError("Payload WebSocket inválido.", {
      statusCode: 400,
      code: "WS_INVALID_PAYLOAD",
    });
  }

  if (message.tipo === "ENTRAR_SALA") {
    const resultado = await registrarEntradaEmSala({
      salaId: message.dados.salaId,
      usuarioId: socket.auth.payload.id,
    });

    const totalConexoesNaSala = connections.associateSocketToRoom(socket, resultado.sala.id);

    logger.info("Conexão WebSocket associada à sala.", {
      userId: socket.auth.payload.id,
      salaId: resultado.sala.id,
      totalConexoesNaSala,
    });

    sendSocketEvent(socket, "ENTRADA_SALA_CONFIRMADA", resultado);

    const payload = serializeSocketEvent("PARTICIPANTE_ENTROU", {
      evento: resultado.evento,
      sala: resultado.sala,
      participante: resultado.participante,
    });

    const totalSocketsNotificados = connections.broadcastToRoom(resultado.sala.id, payload, {
      excludeSocket: socket,
    });

    logger.info("Evento de entrada em sala transmitido via WebSocket.", {
      userId: socket.auth.payload.id,
      salaId: resultado.sala.id,
      eventoParticipacaoId: resultado.evento.id,
      totalSocketsNotificados,
    });

    return;
  }

  if (message.tipo === "SAIR_SALA") {
    const salaId = message.dados.salaId || socket.salaAtualId;

    if (!salaId) {
      throw new AppError("Sala de saída não informada.", {
        statusCode: 400,
        code: "WS_EXIT_ROOM_ID_REQUIRED",
      });
    }

    await processSocketRoomExit(socket, salaId, connections, {
      origin: "socket_message",
      sendConfirmation: true,
    });

    return;
  }

  if (message.tipo === "ENVIAR_MENSAGEM") {
    const salaId = message.dados.salaId || socket.salaAtualId;

    if (!salaId) {
      throw new AppError("Sala de destino da mensagem não informada.", {
        statusCode: 400,
        code: "WS_ROOM_ID_REQUIRED",
      });
    }

    // A regra de bloqueio para salas silenciadas fica centralizada no service,
    // mantendo o WebSocket como orquestrador do fluxo.
    const mensagem = await createRoomMessage({
      salaId,
      autorId: socket.auth.payload.id,
      conteudo: message.dados.conteudo,
      tipoMensagem: message.dados.tipoMensagem || "TEXTO",
    });

    const payload = serializeSocketEvent("MENSAGEM_CRIADA", {
      mensagem,
    });

    const remetenteAssociadoNaSala = connections.isSocketInRoom(socket, salaId);
    const totalSocketsNotificados = connections.broadcastToRoom(salaId, payload);

    if (!remetenteAssociadoNaSala) {
      socket.send(payload);
    }

    logger.info("Mensagem transmitida via WebSocket.", {
      userId: socket.auth.payload.id,
      salaId,
      mensagemId: mensagem.id,
      remetenteAssociadoNaSala,
      totalSocketsNotificados,
    });

    return;
  }

  throw new AppError("Tipo de evento WebSocket não suportado.", {
    statusCode: 400,
    code: "WS_EVENT_NOT_SUPPORTED",
    details: {
      tipo: message.tipo || null,
    },
  });
}

function createWebSocketServer(httpServer) {
  const connections = createRoomConnectionRegistry();
  registerRoomEventBroadcaster((roomId, payload) => connections.broadcastToRoom(roomId, payload));
  const websocketServer = new WebSocketServer({
    server: httpServer,
    path: "/ws",
  });

  websocketServer.on("connection", (socket, request) => {
    (async () => {
      try {
        const auth = await authenticateWebSocketRequest(request);

        socket.auth = auth;

        logger.info("Conexão WebSocket autenticada.", {
          path: request.url,
          authSource: auth.source,
          userId: auth.payload.id,
          role: auth.payload.papel,
          status: auth.currentUser.status,
        });

        sendSocketEvent(socket, "CONEXAO_AUTENTICADA", {
          userId: auth.payload.id,
          papel: auth.payload.papel,
          status: auth.currentUser.status,
        });

        socket.on("message", async (rawMessage) => {
          try {
            await handleSocketMessage(socket, rawMessage, connections);
          } catch (error) {
            const logMessage = error.code === "ROOM_MESSAGE_UNAVAILABLE"
              ? "Mensagem WebSocket bloqueada por indisponibilidade da sala."
              : "Falha ao processar mensagem WebSocket.";

            logger.error("Falha ao processar mensagem WebSocket.", {
              messageType: logMessage,
              path: request.url,
              userId: auth.payload.id,
              code: error.code || "WS_MESSAGE_ERROR",
              message: error.message,
            });

            sendSocketError(socket, error);
          }
        });

        socket.on("close", () => {
          (async () => {
            const salaAnterior = socket.salaAtualId;

            if (salaAnterior) {
              try {
                await processSocketRoomExit(socket, salaAnterior, connections, {
                  origin: "socket_close",
                  sendConfirmation: false,
                });
              } catch (error) {
                logger.error("Falha ao registrar saída de sala no encerramento do socket.", {
                  path: request.url,
                  userId: auth.payload.id,
                  salaId: salaAnterior,
                  code: error.code || "WS_ROOM_EXIT_ON_CLOSE_ERROR",
                  message: error.message,
                });

                connections.dissociateSocket(socket);
              }
            }

            logger.info("Conexão WebSocket encerrada.", {
              path: request.url,
              userId: auth.payload.id,
              salaId: salaAnterior,
            });
          })();
        });
      } catch (error) {
        logger.error("Falha na autenticação WebSocket.", {
          path: request.url,
          code: error.code || "WS_AUTH_ERROR",
          message: error.message,
        });

        socket.close(1008, error.code || "WS_AUTH_ERROR");
      }
    })();
  });

  return websocketServer;
}

module.exports = {
  createWebSocketServer,
};
