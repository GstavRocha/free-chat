const { EventoParticipacao, initModels } = require("../models");

async function createEventoParticipacao(payload, options = {}) {
  initModels();

  return EventoParticipacao.create(payload, {
    transaction: options.transaction,
  });
}

async function findUltimoEventoParticipacao({ salaId, usuarioId }, options = {}) {
  initModels();

  return EventoParticipacao.findOne({
    where: {
      salaId,
      usuarioId,
    },
    order: [["criadoEm", "DESC"]],
    transaction: options.transaction,
  });
}

module.exports = {
  createEventoParticipacao,
  findUltimoEventoParticipacao,
};
