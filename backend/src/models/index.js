const { sequelize } = require("../database/sequelize");
const { initEventoParticipacaoModel, EventoParticipacao } = require("./evento-participacao.model");
const { initLogModeracaoModel, LogModeracao } = require("./log-moderacao.model");
const { initMensagemModel, Mensagem } = require("./mensagem.model");
const { initSalaModel, Sala } = require("./sala.model");
const {
  initSolicitacaoCadastroModel,
  SolicitacaoCadastro,
} = require("./solicitacao-cadastro.model");
const { initUsuarioModel, Usuario } = require("./usuario.model");

let initializedModels;

function initModels() {
  if (initializedModels) {
    return initializedModels;
  }

  initUsuarioModel(sequelize);
  initSolicitacaoCadastroModel(sequelize);
  initSalaModel(sequelize);
  initMensagemModel(sequelize);
  initEventoParticipacaoModel(sequelize);
  initLogModeracaoModel(sequelize);

  Usuario.hasMany(SolicitacaoCadastro, {
    foreignKey: "revisadoPor",
    as: "solicitacoesRevisadas",
  });
  SolicitacaoCadastro.belongsTo(Usuario, {
    foreignKey: "revisadoPor",
    as: "revisor",
  });

  Usuario.hasMany(Sala, {
    foreignKey: "proprietarioId",
    as: "salasProprietarias",
  });
  Sala.belongsTo(Usuario, {
    foreignKey: "proprietarioId",
    as: "proprietario",
  });

  Usuario.hasMany(Mensagem, {
    foreignKey: "autorId",
    as: "mensagens",
  });
  Mensagem.belongsTo(Usuario, {
    foreignKey: "autorId",
    as: "autor",
  });

  Sala.hasMany(Mensagem, {
    foreignKey: "salaId",
    as: "mensagens",
  });
  Mensagem.belongsTo(Sala, {
    foreignKey: "salaId",
    as: "sala",
  });

  Usuario.hasMany(EventoParticipacao, {
    foreignKey: "usuarioId",
    as: "eventosParticipacao",
  });
  EventoParticipacao.belongsTo(Usuario, {
    foreignKey: "usuarioId",
    as: "usuario",
  });

  Sala.hasMany(EventoParticipacao, {
    foreignKey: "salaId",
    as: "eventosParticipacao",
  });
  EventoParticipacao.belongsTo(Sala, {
    foreignKey: "salaId",
    as: "sala",
  });

  Usuario.hasMany(LogModeracao, {
    foreignKey: "administradorId",
    as: "logsAdministrados",
  });
  LogModeracao.belongsTo(Usuario, {
    foreignKey: "administradorId",
    as: "administrador",
  });

  Usuario.hasMany(LogModeracao, {
    foreignKey: "usuarioAlvo",
    as: "logsComoUsuarioAlvo",
  });
  LogModeracao.belongsTo(Usuario, {
    foreignKey: "usuarioAlvo",
    as: "usuarioModerado",
  });

  Sala.hasMany(LogModeracao, {
    foreignKey: "salaAlvo",
    as: "logsComoSalaAlvo",
  });
  LogModeracao.belongsTo(Sala, {
    foreignKey: "salaAlvo",
    as: "salaModerada",
  });

  SolicitacaoCadastro.hasMany(LogModeracao, {
    foreignKey: "solicitacaoAlvo",
    as: "logsComoSolicitacaoAlvo",
  });
  LogModeracao.belongsTo(SolicitacaoCadastro, {
    foreignKey: "solicitacaoAlvo",
    as: "solicitacaoModerada",
  });

  Mensagem.hasMany(LogModeracao, {
    foreignKey: "mensagemAlvo",
    as: "logsComoMensagemAlvo",
  });
  LogModeracao.belongsTo(Mensagem, {
    foreignKey: "mensagemAlvo",
    as: "mensagemModerada",
  });

  initializedModels = {
    sequelize,
    Usuario,
    SolicitacaoCadastro,
    Sala,
    Mensagem,
    EventoParticipacao,
    LogModeracao,
  };

  return initializedModels;
}

module.exports = {
  initModels,
  sequelize,
  Usuario,
  SolicitacaoCadastro,
  Sala,
  Mensagem,
  EventoParticipacao,
  LogModeracao,
};
