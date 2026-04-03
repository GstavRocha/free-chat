async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS salas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(150) NOT NULL,
        descricao TEXT NULL,
        proprietario_id UUID NOT NULL,
        status status_sala_enum NOT NULL DEFAULT 'ATIVA',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        excluido_em TIMESTAMPTZ NULL,
        CONSTRAINT fk_salas_proprietario
            FOREIGN KEY (proprietario_id) REFERENCES usuarios (id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        CONSTRAINT chk_salas_nome_nao_vazio CHECK (BTRIM(nome) <> ''),
        CONSTRAINT chk_salas_exclusao_consistente
            CHECK (
                (status = 'EXCLUIDA' AND excluido_em IS NOT NULL)
                OR
                (status IN ('ATIVA', 'SILENCIADA') AND excluido_em IS NULL)
            )
    );
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP TABLE IF EXISTS salas;
  `);
}

module.exports = { up, down };
