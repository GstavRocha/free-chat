async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    ALTER TABLE solicitacoes_cadastro
    ADD COLUMN IF NOT EXISTS senha_hash_solicitada VARCHAR(255);
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE solicitacoes_cadastro
    DROP CONSTRAINT IF EXISTS chk_solicitacoes_senha_hash_nao_vazia;
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE solicitacoes_cadastro
    ADD CONSTRAINT chk_solicitacoes_senha_hash_nao_vazia
    CHECK (
      senha_hash_solicitada IS NULL
      OR BTRIM(senha_hash_solicitada) <> ''
    );
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    ALTER TABLE solicitacoes_cadastro
    DROP CONSTRAINT IF EXISTS chk_solicitacoes_senha_hash_nao_vazia;
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE solicitacoes_cadastro
    DROP COLUMN IF EXISTS senha_hash_solicitada;
  `);
}

module.exports = { up, down };
