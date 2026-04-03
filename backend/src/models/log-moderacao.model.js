const { DataTypes, Model } = require("sequelize");

const { TIPO_ACAO_MODERACAO } = require("./enums");

class LogModeracao extends Model {}

function initLogModeracaoModel(sequelize) {
  LogModeracao.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      administradorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "administrador_id",
      },
      usuarioAlvo: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "usuario_alvo",
      },
      salaAlvo: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "sala_alvo",
      },
      solicitacaoAlvo: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "solicitacao_alvo",
      },
      mensagemAlvo: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "mensagem_alvo",
      },
      tipoAcao: {
        type: DataTypes.ENUM(...TIPO_ACAO_MODERACAO),
        allowNull: false,
        field: "tipo_acao",
      },
      motivo: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      criadoEm: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "criado_em",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "LogModeracao",
      tableName: "logs_moderacao",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_logs_moderacao_administrador_id",
          fields: ["administrador_id"],
        },
        {
          name: "idx_logs_moderacao_usuario_alvo",
          fields: ["usuario_alvo"],
        },
        {
          name: "idx_logs_moderacao_sala_alvo",
          fields: ["sala_alvo"],
        },
        {
          name: "idx_logs_moderacao_solicitacao_alvo",
          fields: ["solicitacao_alvo"],
        },
        {
          name: "idx_logs_moderacao_mensagem_alvo",
          fields: ["mensagem_alvo"],
        },
        {
          name: "idx_logs_moderacao_tipo_acao",
          fields: ["tipo_acao"],
        },
        {
          name: "idx_logs_moderacao_criado_em",
          fields: ["criado_em"],
        },
      ],
      validate: {
        aoMenosUmAlvoInformado() {
          if (!this.usuarioAlvo && !this.salaAlvo && !this.solicitacaoAlvo && !this.mensagemAlvo) {
            throw new Error("Ao menos um alvo de moderação deve ser informado.");
          }
        },
      },
    },
  );

  return LogModeracao;
}

module.exports = { LogModeracao, initLogModeracaoModel };
