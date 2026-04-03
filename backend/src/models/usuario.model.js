const { DataTypes, Model } = require("sequelize");

const { PAPEL_USUARIO, STATUS_USUARIO } = require("./enums");

class Usuario extends Model {}

function initUsuarioModel(sequelize) {
  Usuario.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nomeCompleto: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "nome_completo",
        validate: {
          notEmpty: true,
        },
      },
      cpf: {
        type: DataTypes.STRING(14),
        allowNull: false,
        unique: "uq_usuarios_cpf",
        validate: {
          notEmpty: true,
        },
      },
      senhaHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "senha_hash",
        validate: {
          notEmpty: true,
        },
      },
      papel: {
        type: DataTypes.ENUM(...PAPEL_USUARIO),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...STATUS_USUARIO),
        allowNull: false,
        defaultValue: "PENDENTE",
      },
      serie: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      turma: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      departamento: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      setor: {
        type: DataTypes.STRING(100),
        allowNull: true,
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
    },
    {
      sequelize,
      modelName: "Usuario",
      tableName: "usuarios",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_usuarios_status",
          fields: ["status"],
        },
        {
          name: "idx_usuarios_papel",
          fields: ["papel"],
        },
      ],
    },
  );

  return Usuario;
}

module.exports = { Usuario, initUsuarioModel };
