-- databasescript.sql
-- Script de criação do banco de dados do sistema Free Chat Maker
-- Compatível com PostgreSQL

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    papel papel_usuario_enum NOT NULL,
    status status_usuario_enum NOT NULL DEFAULT 'PENDENTE',
    serie VARCHAR(50),
    turma VARCHAR(50),
    departamento VARCHAR(100),
    setor VARCHAR(100),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usuarios_cpf UNIQUE (cpf),
    CONSTRAINT chk_usuarios_nome_nao_vazio CHECK (BTRIM(nome_completo) <> ''),
    CONSTRAINT chk_usuarios_cpf_nao_vazio CHECK (BTRIM(cpf) <> ''),
    CONSTRAINT chk_usuarios_senha_hash_nao_vazia CHECK (BTRIM(senha_hash) <> '')
);

CREATE TABLE IF NOT EXISTS solicitacoes_cadastro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_solicitado VARCHAR(255) NOT NULL,
    cpf_solicitado VARCHAR(14) NOT NULL,
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
    CONSTRAINT chk_solicitacoes_revisao_consistente
        CHECK (
            (status_solicitacao = 'PENDENTE' AND revisado_por IS NULL AND revisado_em IS NULL)
            OR
            (status_solicitacao IN ('APROVADO', 'REJEITADO') AND revisado_por IS NOT NULL AND revisado_em IS NOT NULL)
        )
);

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

CREATE TABLE IF NOT EXISTS logs_moderacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    administrador_id UUID NOT NULL,
    usuario_alvo UUID NULL,
    sala_alvo UUID NULL,
    solicitacao_alvo UUID NULL,
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
    CONSTRAINT fk_logs_moderacao_solicitacao_alvo
        FOREIGN KEY (solicitacao_alvo) REFERENCES solicitacoes_cadastro (id)
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
            OR solicitacao_alvo IS NOT NULL
            OR mensagem_alvo IS NOT NULL
        )
);

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
CREATE INDEX IF NOT EXISTS idx_logs_moderacao_solicitacao_alvo ON logs_moderacao (solicitacao_alvo);
CREATE INDEX IF NOT EXISTS idx_logs_moderacao_mensagem_alvo ON logs_moderacao (mensagem_alvo);
CREATE INDEX IF NOT EXISTS idx_logs_moderacao_tipo_acao ON logs_moderacao (tipo_acao);
CREATE INDEX IF NOT EXISTS idx_logs_moderacao_criado_em ON logs_moderacao (criado_em);

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

COMMIT;
