const { Sala, Usuario, initModels } = require("../models");

async function createSala(payload, options = {}) {
  initModels();

  return Sala.create(payload, {
    transaction: options.transaction,
  });
}

async function findSalaById(id, options = {}) {
  initModels();

  return Sala.findByPk(id, {
    include: [
      {
        model: Usuario,
        as: "proprietario",
      },
    ],
    transaction: options.transaction,
  });
}

async function listSalasAtivas(options = {}) {
  initModels();

  return Sala.findAll({
    where: {
      status: "ATIVA",
      excluidoEm: null,
    },
    include: [
      {
        model: Usuario,
        as: "proprietario",
      },
    ],
    order: [["criadoEm", "DESC"]],
    transaction: options.transaction,
  });
}

async function listSalasParaModeracao(options = {}) {
  initModels();

  return Sala.findAll({
    include: [
      {
        model: Usuario,
        as: "proprietario",
      },
    ],
    order: [["criadoEm", "DESC"]],
    transaction: options.transaction,
  });
}

async function updateSala(id, payload, options = {}) {
  initModels();

  const sala = await Sala.findByPk(id, {
    transaction: options.transaction,
  });

  if (!sala) {
    return null;
  }

  Object.assign(sala, payload);
  await sala.save({
    transaction: options.transaction,
  });

  return sala;
}

module.exports = {
  createSala,
  findSalaById,
  listSalasAtivas,
  listSalasParaModeracao,
  updateSala,
};
