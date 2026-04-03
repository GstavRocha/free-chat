async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS logs_moderacao (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        administrador_id UUID NOT NULL,
        usuario_alvo UUID NULL,
        sala_alvo UUID NULL,
        mensagem_alvo UUID NULL,
        tipo_acao tipo_acao_moderacao_enum NOT NULL,
        motivo TEXT NOT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_logs_moderacao_administrador
            FOREIGN KEY (administrador_id) REFERENCES usuarios (id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        CONSTRAINT fk_logs_moderacao_usuario_alvo
            FOREIGN KEY (usuario_alvo) REFERENCES usuarios (id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        CONSTRAINT fk_logs_moderacao_sala_alvo
            FOREIGN KEY (sala_alvo) REFERENCES salas (id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        CONSTRAINT fk_logs_moderacao_mensagem_alvo
            FOREIGN KEY (mensagem_alvo) REFERENCES mensagens (id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        CONSTRAINT chk_logs_moderacao_motivo_nao_vazio CHECK (BTRIM(motivo) <> ''),
        CONSTRAINT chk_logs_moderacao_ao_menos_um_alvo
            CHECK (
                usuario_alvo IS NOT NULL
                OR sala_alvo IS NOT NULL
                OR mensagem_alvo IS NOT NULL
            )
    );
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP TABLE IF EXISTS logs_moderacao;
  `);
}

module.exports = { up, down };
