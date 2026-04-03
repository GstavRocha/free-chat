const { DataTypes, Model } = require("sequelize");

const { STATUS_SALA } = require("./enums");

class Sala extends Model {}

function initSalaModel(sequelize) {
  Sala.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      descricao: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      proprietarioId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "proprietario_id",
      },
      status: {
        type: DataTypes.ENUM(...STATUS_SALA),
        allowNull: false,
        defaultValue: "ATIVA",
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
      modelName: "Sala",
      tableName: "salas",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_salas_proprietario_id",
          fields: ["proprietario_id"],
        },
        {
          name: "idx_salas_status",
          fields: ["status"],
        },
        {
          name: "idx_salas_excluido_em",
          fields: ["excluido_em"],
        },
      ],
    },
  );

  return Sala;
}

module.exports = { Sala, initSalaModel };
