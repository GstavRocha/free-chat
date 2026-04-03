async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome_completo VARCHAR(255) NOT NULL,
        cpf VARCHAR(14) NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        papel papel_usuario_enum NOT NULL,
        status status_usuario_enum NOT NULL DEFAULT 'PENDENTE',
        serie VARCHAR(50),
        turma VARCHAR(50),
        departamento VARCHAR(100),
        setor VARCHAR(100),
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_usuarios_cpf UNIQUE (cpf),
        CONSTRAINT chk_usuarios_nome_nao_vazio CHECK (BTRIM(nome_completo) <> ''),
        CONSTRAINT chk_usuarios_cpf_nao_vazio CHECK (BTRIM(cpf) <> ''),
        CONSTRAINT chk_usuarios_senha_hash_nao_vazia CHECK (BTRIM(senha_hash) <> '')
    );
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP TABLE IF EXISTS usuarios;
  `);
}

module.exports = { up, down };
