async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    ALTER TABLE logs_moderacao
    ADD COLUMN IF NOT EXISTS solicitacao_alvo UUID NULL;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_logs_moderacao_solicitacao_alvo'
      ) THEN
        ALTER TABLE logs_moderacao
        ADD CONSTRAINT fk_logs_moderacao_solicitacao_alvo
          FOREIGN KEY (solicitacao_alvo) REFERENCES solicitacoes_cadastro (id)
          ON UPDATE CASCADE
          ON DELETE RESTRICT;
      END IF;
    END
    $$;

    ALTER TABLE logs_moderacao
    DROP CONSTRAINT IF EXISTS chk_logs_moderacao_ao_menos_um_alvo;

    ALTER TABLE logs_moderacao
    ADD CONSTRAINT chk_logs_moderacao_ao_menos_um_alvo
      CHECK (
        usuario_alvo IS NOT NULL
        OR sala_alvo IS NOT NULL
        OR solicitacao_alvo IS NOT NULL
        OR mensagem_alvo IS NOT NULL
      );

    CREATE INDEX IF NOT EXISTS idx_logs_moderacao_solicitacao_alvo
      ON logs_moderacao (solicitacao_alvo);
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP INDEX IF EXISTS idx_logs_moderacao_solicitacao_alvo;

    ALTER TABLE logs_moderacao
    DROP CONSTRAINT IF EXISTS chk_logs_moderacao_ao_menos_um_alvo;

    ALTER TABLE logs_moderacao
    ADD CONSTRAINT chk_logs_moderacao_ao_menos_um_alvo
      CHECK (
        usuario_alvo IS NOT NULL
        OR sala_alvo IS NOT NULL
        OR mensagem_alvo IS NOT NULL
      );

    ALTER TABLE logs_moderacao
    DROP CONSTRAINT IF EXISTS fk_logs_moderacao_solicitacao_alvo;

    ALTER TABLE logs_moderacao
    DROP COLUMN IF EXISTS solicitacao_alvo;
  `);
}

module.exports = { up, down };
