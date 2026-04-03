async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS mensagens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sala_id UUID NOT NULL,
        autor_id UUID NOT NULL,
        tipo_mensagem tipo_mensagem_enum NOT NULL DEFAULT 'TEXTO',
        conteudo TEXT NOT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        excluido_em TIMESTAMPTZ NULL,
        CONSTRAINT fk_mensagens_sala
            FOREIGN KEY (sala_id) REFERENCES salas (id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        CONSTRAINT fk_mensagens_autor
            FOREIGN KEY (autor_id) REFERENCES usuarios (id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        CONSTRAINT chk_mensagens_conteudo_nao_vazio CHECK (BTRIM(conteudo) <> '')
    );
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP TABLE IF EXISTS mensagens;
  `);
}

module.exports = { up, down };
