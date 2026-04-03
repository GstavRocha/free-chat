function createRoomConnectionRegistry() {
  const roomConnections = new Map();

  function ensureRoom(roomId) {
    if (!roomConnections.has(roomId)) {
      roomConnections.set(roomId, new Set());
    }

    return roomConnections.get(roomId);
  }

  function dissociateSocket(socket) {
    const currentRoomId = socket.salaAtualId;

    if (!currentRoomId) {
      return null;
    }

    const roomSockets = roomConnections.get(currentRoomId);

    if (!roomSockets) {
      socket.salaAtualId = null;
      return currentRoomId;
    }

    roomSockets.delete(socket);

    if (roomSockets.size === 0) {
      roomConnections.delete(currentRoomId);
    }

    socket.salaAtualId = null;

    return currentRoomId;
  }

  function associateSocketToRoom(socket, roomId) {
    if (socket.salaAtualId && socket.salaAtualId !== roomId) {
      dissociateSocket(socket);
    }

    const roomSockets = ensureRoom(roomId);
    roomSockets.add(socket);
    socket.salaAtualId = roomId;

    return roomSockets.size;
  }

  function countRoomConnections(roomId) {
    const roomSockets = roomConnections.get(roomId);
    return roomSockets ? roomSockets.size : 0;
  }

  function isSocketInRoom(socket, roomId) {
    const roomSockets = roomConnections.get(roomId);
    return Boolean(roomSockets && roomSockets.has(socket));
  }

  function broadcastToRoom(roomId, payload, options = {}) {
    const roomSockets = roomConnections.get(roomId);

    if (!roomSockets || roomSockets.size === 0) {
      return 0;
    }

    let deliveredCount = 0;

    roomSockets.forEach((socket) => {
      if (options.excludeSocket && socket === options.excludeSocket) {
        return;
      }

      if (socket.readyState !== 1) {
        return;
      }

      socket.send(payload);
      deliveredCount += 1;
    });

    return deliveredCount;
  }

  return {
    associateSocketToRoom,
    broadcastToRoom,
    countRoomConnections,
    dissociateSocket,
    isSocketInRoom,
  };
}

module.exports = {
  createRoomConnectionRegistry,
};
