const { SolicitacaoCadastro, Usuario, initModels } = require("../models");

async function createSolicitacao(payload, options = {}) {
  initModels();

  return SolicitacaoCadastro.create(payload, {
    transaction: options.transaction,
  });
}

async function listSolicitacoes() {
  initModels();

  return SolicitacaoCadastro.findAll({
    include: [{ model: Usuario, as: "revisor" }],
    order: [["criadoEm", "DESC"]],
  });
}

async function findSolicitacaoById(id, options = {}) {
  initModels();

  return SolicitacaoCadastro.findByPk(id, {
    transaction: options.transaction,
  });
}

async function updateSolicitacao(id, payload, options = {}) {
  initModels();

  const solicitacao = await SolicitacaoCadastro.findByPk(id, {
    transaction: options.transaction,
  });

  if (!solicitacao) {
    return null;
  }

  Object.assign(solicitacao, payload);
  await solicitacao.save({
    transaction: options.transaction,
  });

  return solicitacao;
}

module.exports = {
  createSolicitacao,
  listSolicitacoes,
  findSolicitacaoById,
  updateSolicitacao,
};
