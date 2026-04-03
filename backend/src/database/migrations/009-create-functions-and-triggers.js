async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.atualizado_em = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION fn_validar_usuario_admin()
    RETURNS TRIGGER AS $$
    DECLARE
        v_papel papel_usuario_enum;
    BEGIN
        IF NEW.revisado_por IS NOT NULL THEN
            SELECT papel INTO v_papel
            FROM usuarios
            WHERE id = NEW.revisado_por;

            IF v_papel IS NULL OR v_papel <> 'ADMIN' THEN
                RAISE EXCEPTION 'revisado_por deve referenciar um usuário com papel ADMIN';
            END IF;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION fn_validar_administrador_log()
    RETURNS TRIGGER AS $$
    DECLARE
        v_papel papel_usuario_enum;
    BEGIN
        SELECT papel INTO v_papel
        FROM usuarios
        WHERE id = NEW.administrador_id;

        IF v_papel IS NULL OR v_papel <> 'ADMIN' THEN
            RAISE EXCEPTION 'administrador_id deve referenciar um usuário com papel ADMIN';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION fn_validar_cpf_solicitacao()
    RETURNS TRIGGER AS $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM usuarios
            WHERE cpf = NEW.cpf_solicitado
              AND status = 'APROVADO'
        ) THEN
            RAISE EXCEPTION 'cpf_solicitado já existe para um usuário aprovado';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION fn_validar_sala_ativa_para_mensagem()
    RETURNS TRIGGER AS $$
    DECLARE
        v_status_sala status_sala_enum;
    BEGIN
        SELECT status INTO v_status_sala
        FROM salas
        WHERE id = NEW.sala_id;

        IF v_status_sala IS NULL THEN
            RAISE EXCEPTION 'sala informada não existe';
        END IF;

        IF v_status_sala = 'SILENCIADA' THEN
            RAISE EXCEPTION 'salas silenciadas não podem receber novas mensagens';
        END IF;

        IF v_status_sala = 'EXCLUIDA' THEN
            RAISE EXCEPTION 'salas excluídas não podem receber novas mensagens';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION fn_validar_usuario_aprovado_interacao()
    RETURNS TRIGGER AS $$
    DECLARE
        v_status_usuario status_usuario_enum;
    BEGIN
        IF TG_TABLE_NAME = 'mensagens' THEN
            SELECT status INTO v_status_usuario
            FROM usuarios
            WHERE id = NEW.autor_id;
        ELSIF TG_TABLE_NAME = 'eventos_participacao' THEN
            SELECT status INTO v_status_usuario
            FROM usuarios
            WHERE id = NEW.usuario_id;
        ELSE
            RETURN NEW;
        END IF;

        IF v_status_usuario IS NULL THEN
            RAISE EXCEPTION 'usuário informado não existe';
        END IF;

        IF v_status_usuario <> 'APROVADO' THEN
            RAISE EXCEPTION 'somente usuários aprovados podem interagir no sistema';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_usuarios_atualizado_em ON usuarios;
    CREATE TRIGGER trg_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

    DROP TRIGGER IF EXISTS trg_salas_atualizado_em ON salas;
    CREATE TRIGGER trg_salas_atualizado_em
    BEFORE UPDATE ON salas
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

    DROP TRIGGER IF EXISTS trg_mensagens_atualizado_em ON mensagens;
    CREATE TRIGGER trg_mensagens_atualizado_em
    BEFORE UPDATE ON mensagens
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

    DROP TRIGGER IF EXISTS trg_solicitacoes_revisor_admin ON solicitacoes_cadastro;
    CREATE TRIGGER trg_solicitacoes_revisor_admin
    BEFORE INSERT OR UPDATE ON solicitacoes_cadastro
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_usuario_admin();

    DROP TRIGGER IF EXISTS trg_logs_moderacao_admin ON logs_moderacao;
    CREATE TRIGGER trg_logs_moderacao_admin
    BEFORE INSERT OR UPDATE ON logs_moderacao
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_administrador_log();

    DROP TRIGGER IF EXISTS trg_solicitacoes_validar_cpf ON solicitacoes_cadastro;
    CREATE TRIGGER trg_solicitacoes_validar_cpf
    BEFORE INSERT OR UPDATE ON solicitacoes_cadastro
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_cpf_solicitacao();

    DROP TRIGGER IF EXISTS trg_mensagens_validar_sala ON mensagens;
    CREATE TRIGGER trg_mensagens_validar_sala
    BEFORE INSERT OR UPDATE ON mensagens
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_sala_ativa_para_mensagem();

    DROP TRIGGER IF EXISTS trg_mensagens_validar_usuario ON mensagens;
    CREATE TRIGGER trg_mensagens_validar_usuario
    BEFORE INSERT OR UPDATE ON mensagens
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_usuario_aprovado_interacao();

    DROP TRIGGER IF EXISTS trg_eventos_participacao_validar_usuario ON eventos_participacao;
    CREATE TRIGGER trg_eventos_participacao_validar_usuario
    BEFORE INSERT OR UPDATE ON eventos_participacao
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_usuario_aprovado_interacao();
  `);
}

async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    DROP TRIGGER IF EXISTS trg_eventos_participacao_validar_usuario ON eventos_participacao;
    DROP TRIGGER IF EXISTS trg_mensagens_validar_usuario ON mensagens;
    DROP TRIGGER IF EXISTS trg_mensagens_validar_sala ON mensagens;
    DROP TRIGGER IF EXISTS trg_solicitacoes_validar_cpf ON solicitacoes_cadastro;
    DROP TRIGGER IF EXISTS trg_logs_moderacao_admin ON logs_moderacao;
    DROP TRIGGER IF EXISTS trg_solicitacoes_revisor_admin ON solicitacoes_cadastro;
    DROP TRIGGER IF EXISTS trg_mensagens_atualizado_em ON mensagens;
    DROP TRIGGER IF EXISTS trg_salas_atualizado_em ON salas;
    DROP TRIGGER IF EXISTS trg_usuarios_atualizado_em ON usuarios;

    DROP FUNCTION IF EXISTS fn_validar_usuario_aprovado_interacao();
    DROP FUNCTION IF EXISTS fn_validar_sala_ativa_para_mensagem();
    DROP FUNCTION IF EXISTS fn_validar_cpf_solicitacao();
    DROP FUNCTION IF EXISTS fn_validar_administrador_log();
    DROP FUNCTION IF EXISTS fn_validar_usuario_admin();
    DROP FUNCTION IF EXISTS fn_atualizar_timestamp();
  `);
}

module.exports = { up, down };
