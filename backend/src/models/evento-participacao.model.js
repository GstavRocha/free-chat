const { DataTypes, Model } = require("sequelize");

const { TIPO_EVENTO_PARTICIPACAO } = require("./enums");

class EventoParticipacao extends Model {}

function initEventoParticipacaoModel(sequelize) {
  EventoParticipacao.init(
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
      usuarioId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "usuario_id",
      },
      tipoEvento: {
        type: DataTypes.ENUM(...TIPO_EVENTO_PARTICIPACAO),
        allowNull: false,
        field: "tipo_evento",
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
      modelName: "EventoParticipacao",
      tableName: "eventos_participacao",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_eventos_participacao_sala_id",
          fields: ["sala_id"],
        },
        {
          name: "idx_eventos_participacao_usuario_id",
          fields: ["usuario_id"],
        },
        {
          name: "idx_eventos_participacao_sala_criado_em",
          fields: ["sala_id", "criado_em"],
        },
      ],
    },
  );

  return EventoParticipacao;
}

module.exports = { EventoParticipacao, initEventoParticipacaoModel };
