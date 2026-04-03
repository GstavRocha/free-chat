const { DataTypes, Model } = require("sequelize");

const { TIPO_MENSAGEM } = require("./enums");

class Mensagem extends Model {}

function initMensagemModel(sequelize) {
  Mensagem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      salaId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "sala_id",
      },
      autorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "autor_id",
      },
      tipoMensagem: {
        type: DataTypes.ENUM(...TIPO_MENSAGEM),
        allowNull: false,
        field: "tipo_mensagem",
        defaultValue: "TEXTO",
      },
      conteudo: {
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
      atualizadoEm: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "atualizado_em",
        defaultValue: DataTypes.NOW,
      },
      excluidoEm: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "excluido_em",
      },
    },
    {
      sequelize,
      modelName: "Mensagem",
      tableName: "mensagens",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_mensagens_sala_id",
          fields: ["sala_id"],
        },
        {
          name: "idx_mensagens_autor_id",
          fields: ["autor_id"],
        },
        {
          name: "idx_mensagens_sala_criado_em",
          fields: ["sala_id", "criado_em"],
        },
        {
          name: "idx_mensagens_tipo",
          fields: ["tipo_mensagem"],
        },
        {
          name: "idx_mensagens_excluido_em",
          fields: ["excluido_em"],
        },
      ],
    },
  );

  return Mensagem;
}

module.exports = { Mensagem, initMensagemModel };
