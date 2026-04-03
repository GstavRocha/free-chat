async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios (status);
    CREATE INDEX IF NOT EXISTS idx_usuarios_papel ON usuarios (papel);

    CREATE INDEX IF NOT EXISTS idx_solicitacoes_cpf ON solicitacoes_cadastro (cpf_solicitado);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_cadastro (status_solicitacao);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_revisado_por ON solicitacoes_cadastro (revisado_por);

    CREATE INDEX IF NOT EXISTS idx_salas_proprietario_id ON salas (proprietario_id);
    CREATE INDEX IF NOT EXISTS idx_salas_status ON salas (status);
    CREATE INDEX IF NOT EXISTS idx_salas_excluido_em ON salas (excluido_em);

    CREATE INDEX IF NOT EXISTS idx_mensagens_sala_id ON mensagens (sala_id);
    CREATE INDEX IF NOT EXISTS idx_mensagens_autor_id ON mensagens (autor_id);
    CREATE INDEX IF NOT EXISTS idx_mensagens_sala_criado_em ON mensagens (sala_id, criado_em);
    CREATE INDEX IF NOT EXISTS idx_mensagens_tipo ON mensagens (tipo_mensagem);
    CREATE INDEX IF NOT EXISTS idx_mensagens_excluido_em ON mensagens (excluido_em);

    CREATE INDEX IF NOT EXISTS idx_eventos_participacao_sala_id ON eventos_participacao (sala_id);
    CREATE INDEX IF NOT EXISTS idx_eventos_participacao_usuario_id ON eventos_participacao (usuario_id);
    CREATE INDEX IF NOT EXISTS idx_eventos_participacao_sala_criado_em ON eventos_participacao (sala_id, criado_em);

    CREATE INDEX IF NOT EXISTS idx_logs_moderacao_administrador_id ON logs_moderacao (administrador_id);
    CREATE INDEX IF NOT EXISTS idx_logs_moderacao_usuario_alvo ON logs_moderacao (usuario_alvo);
    CREATE INDEX IF NOT EXISTS idx_logs_moderacao_sala_alvo ON logs_moderacao (sala_alvo);
    CREATE INDEX IF NOT EXISTS idx_logs_moderacao_mensagem_alvo ON logs_moderacao (mensagem_alvo);
    CREATE INDEX IF NOT EXISTS idx_logs_moderacao_tipo_acao ON logs_moderacao (tipo_acao);
    CREATE INDEX IF NOT EXISTS idx_logs_moderacao_criado_em ON logs_moderacao (criado_em);
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP INDEX IF EXISTS idx_logs_moderacao_criado_em;
    DROP INDEX IF EXISTS idx_logs_moderacao_tipo_acao;
    DROP INDEX IF EXISTS idx_logs_moderacao_mensagem_alvo;
    DROP INDEX IF EXISTS idx_logs_moderacao_sala_alvo;
    DROP INDEX IF EXISTS idx_logs_moderacao_usuario_alvo;
    DROP INDEX IF EXISTS idx_logs_moderacao_administrador_id;

    DROP INDEX IF EXISTS idx_eventos_participacao_sala_criado_em;
    DROP INDEX IF EXISTS idx_eventos_participacao_usuario_id;
    DROP INDEX IF EXISTS idx_eventos_participacao_sala_id;

    DROP INDEX IF EXISTS idx_mensagens_excluido_em;
    DROP INDEX IF EXISTS idx_mensagens_tipo;
    DROP INDEX IF EXISTS idx_mensagens_sala_criado_em;
    DROP INDEX IF EXISTS idx_mensagens_autor_id;
    DROP INDEX IF EXISTS idx_mensagens_sala_id;

    DROP INDEX IF EXISTS idx_salas_excluido_em;
    DROP INDEX IF EXISTS idx_salas_status;
    DROP INDEX IF EXISTS idx_salas_proprietario_id;

    DROP INDEX IF EXISTS idx_solicitacoes_revisado_por;
    DROP INDEX IF EXISTS idx_solicitacoes_status;
    DROP INDEX IF EXISTS idx_solicitacoes_cpf;

    DROP INDEX IF EXISTS idx_usuarios_papel;
    DROP INDEX IF EXISTS idx_usuarios_status;
  `);
}

module.exports = { up, down };
