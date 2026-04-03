const { DataTypes, Model } = require("sequelize");

const { PAPEL_USUARIO, STATUS_SOLICITACAO } = require("./enums");

class SolicitacaoCadastro extends Model {}

function initSolicitacaoCadastroModel(sequelize) {
  SolicitacaoCadastro.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nomeSolicitado: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "nome_solicitado",
        validate: {
          notEmpty: true,
        },
      },
      cpfSolicitado: {
        type: DataTypes.STRING(14),
        allowNull: false,
        field: "cpf_solicitado",
        validate: {
          notEmpty: true,
        },
      },
      senhaHashSolicitada: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "senha_hash_solicitada",
        validate: {
          notEmpty: true,
        },
      },
      papelSolicitado: {
        type: DataTypes.ENUM(...PAPEL_USUARIO),
        allowNull: false,
        field: "papel_solicitado",
      },
      serieSolicitada: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "serie_solicitada",
      },
      turmaSolicitada: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "turma_solicitada",
      },
      departamentoSolicitado: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "departamento_solicitado",
      },
      setorSolicitado: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "setor_solicitado",
      },
      statusSolicitacao: {
        type: DataTypes.ENUM(...STATUS_SOLICITACAO),
        allowNull: false,
        field: "status_solicitacao",
        defaultValue: "PENDENTE",
      },
      revisadoPor: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "revisado_por",
      },
      motivoRevisao: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "motivo_revisao",
      },
      criadoEm: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "criado_em",
        defaultValue: DataTypes.NOW,
      },
      revisadoEm: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "revisado_em",
      },
    },
    {
      sequelize,
      modelName: "SolicitacaoCadastro",
      tableName: "solicitacoes_cadastro",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_solicitacoes_cpf",
          fields: ["cpf_solicitado"],
        },
        {
          name: "idx_solicitacoes_status",
          fields: ["status_solicitacao"],
        },
        {
          name: "idx_solicitacoes_revisado_por",
          fields: ["revisado_por"],
        },
      ],
    },
  );

  return SolicitacaoCadastro;
}

module.exports = { SolicitacaoCadastro, initSolicitacaoCadastroModel };
