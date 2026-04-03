const { AppError } = require("../errors/app-error");
const { sequelize } = require("../models");
const { TIPO_MENSAGEM } = require("../models/enums");
const {
  createMensagem,
  deleteMensagemLogicamente,
  findMensagemById,
  listMensagensBySala,
  listMensagensBySalaParaModeracao,
  updateMensagem,
} = require("../repositories/mensagens.repository");
const { findUltimoEventoParticipacao } = require("../repositories/participacao.repository");
const { findSalaById } = require("../repositories/salas.repository");
const { findUserById } = require("../repositories/usuario.repository");
const {
  sanitizeMultilineText,
  sanitizeSingleLineText,
} = require("../utils/text-sanitizer");
const { registerModerationLog } = require("./logs-moderacao.service");

const TIPOS_ENVIAVEIS_PELO_USUARIO = ["TEXTO", "CODIGO"];

function serializeMensagem(mensagem) {
  return {
    id: mensagem.id,
    salaId: mensagem.salaId,
    autorId: mensagem.autorId,
    autor: mensagem.autor
      ? {
          id: mensagem.autor.id,
          nomeCompleto: mensagem.autor.nomeCompleto,
          papel: mensagem.autor.papel,
        }
      : null,
    tipoMensagem: mensagem.tipoMensagem,
    conteudo: mensagem.conteudo,
    criadoEm: mensagem.criadoEm,
    atualizadoEm: mensagem.atualizadoEm,
    excluidoEm: mensagem.excluidoEm,
  };
}

function serializeMensagemHistorico(mensagem) {
  return {
    id: mensagem.id,
    salaId: mensagem.salaId,
    tipoMensagem: mensagem.tipoMensagem,
    conteudo: mensagem.conteudo,
    criadoEm: mensagem.criadoEm,
    atualizadoEm: mensagem.atualizadoEm,
    autor: mensagem.autor
      ? {
          id: mensagem.autor.id,
          nomeCompleto: mensagem.autor.nomeCompleto,
          papel: mensagem.autor.papel,
        }
      : {
          id: mensagem.autorId,
        },
  };
}

function ensureTipoMensagemPermitido(tipoMensagem) {
  if (!TIPO_MENSAGEM.includes(tipoMensagem)) {
    throw new AppError("Tipo de mensagem inválido.", {
      statusCode: 400,
      code: "INVALID_MESSAGE_TYPE",
      details: {
        allowedTypes: TIPO_MENSAGEM,
      },
    });
  }

  if (!TIPOS_ENVIAVEIS_PELO_USUARIO.includes(tipoMensagem)) {
    throw new AppError("Tipo de mensagem não permitido neste fluxo.", {
      statusCode: 400,
      code: "MESSAGE_TYPE_NOT_ALLOWED",
      details: {
        allowedTypes: TIPOS_ENVIAVEIS_PELO_USUARIO,
      },
    });
  }
}

async function createRoomMessage({
  salaId,
  autorId,
  conteudo,
  tipoMensagem = "TEXTO",
}) {
  const usuario = await findUserById(autorId);

  if (!usuario) {
    throw new AppError("Usuário autenticado não encontrado.", {
      statusCode: 401,
      code: "AUTH_USER_NOT_FOUND",
    });
  }

  const normalizedContent = sanitizeMultilineText(conteudo);

  if (!normalizedContent) {
    throw new AppError("Conteúdo da mensagem é obrigatório.", {
      statusCode: 400,
      code: "MESSAGE_CONTENT_REQUIRED",
    });
  }

  ensureTipoMensagemPermitido(tipoMensagem);

  const sala = await findSalaById(salaId);

  if (!sala) {
    throw new AppError("Sala não encontrada.", {
      statusCode: 404,
      code: "ROOM_NOT_FOUND",
    });
  }

  if (sala.status !== "ATIVA" || sala.excluidoEm) {
    throw new AppError("Sala não aceita novas mensagens.", {
      statusCode: 409,
      code: "ROOM_MESSAGE_UNAVAILABLE",
      details: {
        status: sala.status,
      },
    });
  }

  const ultimoEvento = await findUltimoEventoParticipacao({ salaId, usuarioId: autorId });

  if (!ultimoEvento || ultimoEvento.tipoEvento !== "ENTRADA") {
    throw new AppError("Usuário precisa entrar na sala antes de enviar mensagens.", {
      statusCode: 403,
      code: "ROOM_ENTRY_REQUIRED",
    });
  }

  const mensagem = await createMensagem({
    salaId,
    autorId,
    tipoMensagem,
    conteudo: normalizedContent,
  });

  mensagem.autor = usuario;

  return serializeMensagem(mensagem);
}

async function createModerationNotice({
  salaId,
  autorId,
  conteudo,
}) {
  const transaction = await sequelize.transaction();

  try {
    const usuario = await findUserById(autorId, { transaction });

    if (!usuario) {
      throw new AppError("Usuário autenticado não encontrado.", {
        statusCode: 401,
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    if (usuario.papel !== "ADMIN") {
      throw new AppError("Usuário sem permissão para enviar aviso de moderação.", {
        statusCode: 403,
        code: "MODERATION_NOTICE_FORBIDDEN",
      });
    }

    const normalizedContent = sanitizeMultilineText(conteudo);

    if (!normalizedContent) {
      throw new AppError("Conteúdo do aviso de moderação é obrigatório.", {
        statusCode: 400,
        code: "MODERATION_NOTICE_CONTENT_REQUIRED",
      });
    }

    const sala = await findSalaById(salaId, { transaction });

    if (!sala) {
      throw new AppError("Sala não encontrada.", {
        statusCode: 404,
        code: "ROOM_NOT_FOUND",
      });
    }

    if (sala.status === "EXCLUIDA" || sala.excluidoEm) {
      throw new AppError("Sala excluída não pode receber aviso de moderação.", {
        statusCode: 409,
        code: "ROOM_UNAVAILABLE",
        details: {
          status: sala.status,
        },
      });
    }

    const mensagem = await createMensagem(
      {
        salaId,
        autorId,
        tipoMensagem: "AVISO_MODERACAO",
        conteudo: normalizedContent,
      },
      { transaction },
    );

    mensagem.autor = usuario;

    await registerModerationLog(
      {
        administradorId: autorId,
        salaAlvo: salaId,
        mensagemAlvo: mensagem.id,
        tipoAcao: "ENVIAR_AVISO_MODERACAO",
        motivo: normalizedContent,
      },
      { transaction },
    );

    await transaction.commit();

    return serializeMensagem(mensagem);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateOwnMessage({
  mensagemId,
  actorUserId,
  actorRole,
  conteudo,
}) {
  const usuario = await findUserById(actorUserId);

  if (!usuario) {
    throw new AppError("Usuário autenticado não encontrado.", {
      statusCode: 401,
      code: "AUTH_USER_NOT_FOUND",
    });
  }

  const normalizedContent = sanitizeMultilineText(conteudo);

  if (!normalizedContent) {
    throw new AppError("Conteúdo da mensagem é obrigatório.", {
      statusCode: 400,
      code: "MESSAGE_CONTENT_REQUIRED",
    });
  }

  const mensagem = await findMensagemById(mensagemId);

  if (!mensagem) {
    throw new AppError("Mensagem não encontrada.", {
      statusCode: 404,
      code: "MESSAGE_NOT_FOUND",
    });
  }

  if (mensagem.excluidoEm) {
    throw new AppError("Mensagem excluída não pode ser editada.", {
      statusCode: 400,
      code: "MESSAGE_DELETED",
    });
  }

  const isOwner = mensagem.autorId === actorUserId;
  const isAdmin = actorRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError("Usuário sem permissão para editar esta mensagem.", {
      statusCode: 403,
      code: "MESSAGE_EDIT_FORBIDDEN",
    });
  }

  const mensagemAtualizada = await updateMensagem(mensagemId, {
    conteudo: normalizedContent,
  });

  return serializeMensagem(mensagemAtualizada);
}

async function deleteOwnMessage({
  mensagemId,
  actorUserId,
  actorRole,
  motivo,
}) {
  const transaction = await sequelize.transaction();

  try {
    const usuario = await findUserById(actorUserId, { transaction });

    if (!usuario) {
      throw new AppError("Usuário autenticado não encontrado.", {
        statusCode: 401,
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    const mensagem = await findMensagemById(mensagemId, { transaction });

    if (!mensagem) {
      throw new AppError("Mensagem não encontrada.", {
        statusCode: 404,
        code: "MESSAGE_NOT_FOUND",
      });
    }

    if (mensagem.excluidoEm) {
      throw new AppError("Mensagem já foi excluída logicamente.", {
        statusCode: 400,
        code: "MESSAGE_ALREADY_DELETED",
      });
    }

    const isOwner = mensagem.autorId === actorUserId;
    const isAdmin = actorRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new AppError("Usuário sem permissão para excluir esta mensagem.", {
        statusCode: 403,
        code: "MESSAGE_DELETE_FORBIDDEN",
      });
    }

    const normalizedMotivo = sanitizeSingleLineText(motivo);

    if (isAdmin && !normalizedMotivo) {
      throw new AppError("Motivo é obrigatório para remoção administrativa de mensagem.", {
        statusCode: 400,
        code: "MESSAGE_DELETE_REASON_REQUIRED",
      });
    }

    const mensagemExcluida = await deleteMensagemLogicamente(mensagemId, { transaction });

    if (isAdmin) {
      await registerModerationLog(
        {
          administradorId: actorUserId,
          mensagemAlvo: mensagemId,
          tipoAcao: "EXCLUIR_MENSAGEM",
          motivo: normalizedMotivo,
        },
        { transaction },
      );
    }

    await transaction.commit();

    return serializeMensagem(mensagemExcluida);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function getRoomHistory({
  salaId,
  actorUserId,
}) {
  const usuario = await findUserById(actorUserId);

  if (!usuario) {
    throw new AppError("Usuário autenticado não encontrado.", {
      statusCode: 401,
      code: "AUTH_USER_NOT_FOUND",
    });
  }

  const sala = await findSalaById(salaId);

  if (!sala) {
    throw new AppError("Sala não encontrada.", {
      statusCode: 404,
      code: "ROOM_NOT_FOUND",
    });
  }

  if (sala.status !== "ATIVA" || sala.excluidoEm) {
    throw new AppError("Sala inacessível para consulta de histórico.", {
      statusCode: 409,
      code: "ROOM_HISTORY_UNAVAILABLE",
      details: {
        status: sala.status,
      },
    });
  }

  const ultimoEvento = await findUltimoEventoParticipacao({ salaId, usuarioId: actorUserId });

  if (!ultimoEvento || ultimoEvento.tipoEvento !== "ENTRADA") {
    throw new AppError("Usuário precisa entrar na sala antes de consultar o histórico.", {
      statusCode: 403,
      code: "ROOM_ENTRY_REQUIRED",
    });
  }

  const mensagens = await listMensagensBySala(salaId);

  return mensagens.map(serializeMensagemHistorico);
}

async function getRoomHistoryForModeration({
  salaId,
  actorUserId,
}) {
  const usuario = await findUserById(actorUserId);

  if (!usuario) {
    throw new AppError("Usuário autenticado não encontrado.", {
      statusCode: 401,
      code: "AUTH_USER_NOT_FOUND",
    });
  }

  if (usuario.papel !== "ADMIN") {
    throw new AppError("Usuário sem permissão para moderar mensagens.", {
      statusCode: 403,
      code: "MESSAGE_MODERATION_FORBIDDEN",
    });
  }

  const sala = await findSalaById(salaId);

  if (!sala) {
    throw new AppError("Sala não encontrada.", {
      statusCode: 404,
      code: "ROOM_NOT_FOUND",
    });
  }

  const mensagens = await listMensagensBySalaParaModeracao(salaId);

  return mensagens.map((mensagem) => ({
    ...serializeMensagemHistorico(mensagem),
    excluidoEm: mensagem.excluidoEm,
  }));
}

module.exports = {
  createModerationNotice,
  createRoomMessage,
  deleteOwnMessage,
  getRoomHistory,
  getRoomHistoryForModeration,
  updateOwnMessage,
};
