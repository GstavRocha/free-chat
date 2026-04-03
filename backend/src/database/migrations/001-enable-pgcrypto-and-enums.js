async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  `);

  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'papel_usuario_enum') THEN
            CREATE TYPE papel_usuario_enum AS ENUM (
                'ADMIN',
                'ALUNO',
                'PROFESSOR',
                'FUNCIONARIO'
            );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_usuario_enum') THEN
            CREATE TYPE status_usuario_enum AS ENUM (
                'PENDENTE',
                'APROVADO',
                'BLOQUEADO',
                'REJEITADO'
            );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_solicitacao_enum') THEN
            CREATE TYPE status_solicitacao_enum AS ENUM (
                'PENDENTE',
                'APROVADO',
                'REJEITADO'
            );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_sala_enum') THEN
            CREATE TYPE status_sala_enum AS ENUM (
                'ATIVA',
                'SILENCIADA',
                'EXCLUIDA'
            );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_mensagem_enum') THEN
            CREATE TYPE tipo_mensagem_enum AS ENUM (
                'TEXTO',
                'CODIGO',
                'EVENTO_SISTEMA',
                'AVISO_MODERACAO'
            );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_evento_participacao_enum') THEN
            CREATE TYPE tipo_evento_participacao_enum AS ENUM (
                'ENTRADA',
                'SAIDA'
            );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_acao_moderacao_enum') THEN
            CREATE TYPE tipo_acao_moderacao_enum AS ENUM (
                'APROVAR_USUARIO',
                'REJEITAR_USUARIO',
                'BLOQUEAR_USUARIO',
                'EXCLUIR_MENSAGEM',
                'SILENCIAR_SALA',
                'EXCLUIR_SALA',
                'ENVIAR_AVISO_MODERACAO'
            );
        END IF;
    END $$;
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS tipo_acao_moderacao_enum;
    DROP TYPE IF EXISTS tipo_evento_participacao_enum;
    DROP TYPE IF EXISTS tipo_mensagem_enum;
    DROP TYPE IF EXISTS status_sala_enum;
    DROP TYPE IF EXISTS status_solicitacao_enum;
    DROP TYPE IF EXISTS status_usuario_enum;
    DROP TYPE IF EXISTS papel_usuario_enum;
  `);
}

module.exports = { up, down };
