function parseClientMessage(rawMessage) {
  const payload = JSON.parse(String(rawMessage));

  return {
    tipo: payload.tipo,
    dados: payload.dados || {},
  };
}

function serializeSocketEvent(tipo, dados) {
  return JSON.stringify({
    tipo,
    dados,
  });
}

function sendSocketEvent(socket, tipo, dados) {
  socket.send(serializeSocketEvent(tipo, dados));
}

function sendSocketError(socket, error) {
  sendSocketEvent(socket, "ERRO", {
    code: error.code || "WS_ERROR",
    message: error.message || "Erro no canal WebSocket.",
    details: error.details || null,
  });
}

module.exports = {
  parseClientMessage,
  sendSocketError,
  sendSocketEvent,
  serializeSocketEvent,
};
