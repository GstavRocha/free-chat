async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS solicitacoes_cadastro (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome_solicitado VARCHAR(255) NOT NULL,
        cpf_solicitado VARCHAR(14) NOT NULL,
        senha_hash_solicitada VARCHAR(255) NOT NULL,
        papel_solicitado papel_usuario_enum NOT NULL,
        serie_solicitada VARCHAR(50),
        turma_solicitada VARCHAR(50),
        departamento_solicitado VARCHAR(100),
        setor_solicitado VARCHAR(100),
        status_solicitacao status_solicitacao_enum NOT NULL DEFAULT 'PENDENTE',
        revisado_por UUID NULL,
        motivo_revisao TEXT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revisado_em TIMESTAMPTZ NULL,
        CONSTRAINT fk_solicitacoes_revisado_por
            FOREIGN KEY (revisado_por) REFERENCES usuarios (id)
            ON UPDATE CASCADE
            ON DELETE SET NULL,
        CONSTRAINT chk_solicitacoes_nome_nao_vazio CHECK (BTRIM(nome_solicitado) <> ''),
        CONSTRAINT chk_solicitacoes_cpf_nao_vazio CHECK (BTRIM(cpf_solicitado) <> ''),
        CONSTRAINT chk_solicitacoes_senha_hash_nao_vazia CHECK (BTRIM(senha_hash_solicitada) <> ''),
        CONSTRAINT chk_solicitacoes_revisao_consistente
            CHECK (
                (status_solicitacao = 'PENDENTE' AND revisado_por IS NULL AND revisado_em IS NULL)
                OR
                (status_solicitacao IN ('APROVADO', 'REJEITADO') AND revisado_por IS NOT NULL AND revisado_em IS NOT NULL)
            )
    );
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP TABLE IF EXISTS solicitacoes_cadastro;
  `);
}

module.exports = { up, down };
