const { logger } = require("../utils/logger");
const { serializeSocketEvent } = require("./protocol");

let roomEventBroadcaster = null;

function registerRoomEventBroadcaster(broadcaster) {
  roomEventBroadcaster = broadcaster;
}

function broadcastRoomEvent(roomId, tipo, dados) {
  if (!roomEventBroadcaster) {
    logger.info("Broadcast WebSocket ignorado por indisponibilidade do registry.", {
      roomId,
      tipo,
    });
    return 0;
  }

  const payload = serializeSocketEvent(tipo, dados);
  const deliveredCount = roomEventBroadcaster(roomId, payload);

  logger.info("Evento WebSocket publicado para sala.", {
    roomId,
    tipo,
    deliveredCount,
  });

  return deliveredCount;
}

function broadcastMessageCreated(mensagem) {
  return broadcastRoomEvent(mensagem.salaId, "MENSAGEM_CRIADA", {
    mensagem,
  });
}

function broadcastMessageUpdated(mensagem) {
  return broadcastRoomEvent(mensagem.salaId, "MENSAGEM_ATUALIZADA", {
    mensagem,
  });
}

function broadcastMessageDeleted(mensagem) {
  return broadcastRoomEvent(mensagem.salaId, "MENSAGEM_REMOVIDA", {
    mensagem,
  });
}

function broadcastRoomUpdated(sala) {
  return broadcastRoomEvent(sala.id, "SALA_ATUALIZADA", {
    sala,
  });
}

module.exports = {
  broadcastMessageCreated,
  broadcastMessageDeleted,
  broadcastMessageUpdated,
  broadcastRoomUpdated,
  registerRoomEventBroadcaster,
};
