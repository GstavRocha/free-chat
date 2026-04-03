const {
  LogModeracao,
  initModels,
  Mensagem,
  Sala,
  SolicitacaoCadastro,
  Usuario,
} = require("../models");

async function listLogsModeracao() {
  initModels();

  return LogModeracao.findAll({
    include: [
      { model: Usuario, as: "administrador" },
      { model: Usuario, as: "usuarioModerado" },
      { model: Sala, as: "salaModerada" },
      { model: SolicitacaoCadastro, as: "solicitacaoModerada" },
      { model: Mensagem, as: "mensagemModerada" },
    ],
    order: [["criadoEm", "DESC"]],
  });
}

async function createLogModeracao(payload, options = {}) {
  initModels();

  return LogModeracao.create(payload, {
    transaction: options.transaction,
  });
}

module.exports = {
  listLogsModeracao,
  createLogModeracao,
};
