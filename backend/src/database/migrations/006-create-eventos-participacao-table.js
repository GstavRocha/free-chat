async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS eventos_participacao (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sala_id UUID NOT NULL,
        usuario_id UUID NOT NULL,
        tipo_evento tipo_evento_participacao_enum NOT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_eventos_participacao_sala
            FOREIGN KEY (sala_id) REFERENCES salas (id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        CONSTRAINT fk_eventos_participacao_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT
    );
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP TABLE IF EXISTS eventos_participacao;
  `);
}

module.exports = { up, down };
