const { Mensagem, Usuario, initModels } = require("../models");

async function createMensagem(payload, options = {}) {
  initModels();

  return Mensagem.create(payload, {
    transaction: options.transaction,
  });
}

async function findMensagemById(id, options = {}) {
  initModels();

  return Mensagem.findByPk(id, {
    transaction: options.transaction,
  });
}

async function updateMensagem(id, payload, options = {}) {
  initModels();

  const mensagem = await Mensagem.findByPk(id, {
    transaction: options.transaction,
  });

  if (!mensagem) {
    return null;
  }

  Object.assign(mensagem, payload, {
    atualizadoEm: new Date(),
  });

  await mensagem.save({
    transaction: options.transaction,
  });

  return mensagem;
}

async function deleteMensagemLogicamente(id, options = {}) {
  initModels();

  const mensagem = await Mensagem.findByPk(id, {
    transaction: options.transaction,
  });

  if (!mensagem) {
    return null;
  }

  mensagem.excluidoEm = new Date();
  mensagem.atualizadoEm = new Date();

  await mensagem.save({
    transaction: options.transaction,
  });

  return mensagem;
}

async function listMensagensBySala(salaId, options = {}) {
  initModels();

  return Mensagem.findAll({
    where: {
      salaId,
      excluidoEm: null,
    },
    include: [
      {
        model: Usuario,
        as: "autor",
      },
    ],
    order: [["criadoEm", "ASC"]],
    transaction: options.transaction,
  });
}

async function listMensagensBySalaParaModeracao(salaId, options = {}) {
  initModels();

  return Mensagem.findAll({
    where: {
      salaId,
    },
    include: [
      {
        model: Usuario,
        as: "autor",
      },
    ],
    order: [["criadoEm", "ASC"]],
    transaction: options.transaction,
  });
}

module.exports = {
  createMensagem,
  deleteMensagemLogicamente,
  findMensagemById,
  listMensagensBySala,
  listMensagensBySalaParaModeracao,
  updateMensagem,
};
