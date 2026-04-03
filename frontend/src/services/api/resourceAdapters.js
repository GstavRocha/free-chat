function normalizeOptionalText(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || null;
}

function normalizeOptionalDate(value) {
  return value || null;
}

function normalizeCpf(value) {
  return String(value || "").replace(/\D/gu, "");
}

export function normalizeAuthUser(usuario) {
  if (!usuario) {
    return null;
  }

  return {
    id: usuario.id || null,
    nomeCompleto: usuario.nomeCompleto || "",
    cpf: normalizeCpf(usuario.cpf),
    papel: usuario.papel || null,
    role: usuario.papel || null,
    status: usuario.status || null,
  };
}

export function normalizeAdministrativeUser(usuario) {
  if (!usuario) {
    return null;
  }

  return {
    id: usuario.id || null,
    nomeCompleto: usuario.nomeCompleto || "",
    cpf: normalizeCpf(usuario.cpf),
    papel: usuario.papel || null,
    role: usuario.papel || null,
    status: usuario.status || null,
    criadoEm: normalizeOptionalDate(usuario.criadoEm),
    atualizadoEm: normalizeOptionalDate(usuario.atualizadoEm),
  };
}

export function normalizeAuthSession(data) {
  return {
    token: data?.token || null,
    usuario: normalizeAuthUser(data?.usuario),
    user: normalizeAuthUser(data?.usuario),
  };
}

export function normalizeLoginPayload(credentials) {
  return {
    cpf: normalizeCpf(credentials?.cpf),
    senha: String(credentials?.senha || ""),
  };
}

export function normalizeSignupRequestPayload(payload) {
  const papel = payload?.papel || null;
  const normalizedPayload = {
    nome: normalizeOptionalText(payload?.nomeCompleto || payload?.nome),
    cpf: normalizeCpf(payload?.cpf),
    senha: String(payload?.senha || ""),
    papel,
  };

  if (papel === "ALUNO") {
    normalizedPayload.serie = normalizeOptionalText(payload?.serie);
    normalizedPayload.turma = normalizeOptionalText(payload?.turma);
  }

  if (papel === "PROFESSOR") {
    normalizedPayload.departamento = normalizeOptionalText(payload?.departamento);
  }

  if (papel === "FUNCIONARIO") {
    normalizedPayload.setor = normalizeOptionalText(payload?.setor);
  }

  return normalizedPayload;
}

export function normalizeSignupRequest(solicitacao) {
  if (!solicitacao) {
    return null;
  }

  return {
    id: solicitacao.id || null,
    nomeSolicitado: solicitacao.nomeSolicitado || "",
    cpfSolicitado: normalizeCpf(solicitacao.cpfSolicitado),
    papelSolicitado: solicitacao.papelSolicitado || null,
    serieSolicitada: normalizeOptionalText(solicitacao.serieSolicitada),
    turmaSolicitada: normalizeOptionalText(solicitacao.turmaSolicitada),
    departamentoSolicitado: normalizeOptionalText(solicitacao.departamentoSolicitado),
    setorSolicitado: normalizeOptionalText(solicitacao.setorSolicitado),
    statusSolicitacao: solicitacao.statusSolicitacao || null,
    status: solicitacao.statusSolicitacao || null,
    motivoRevisao: normalizeOptionalText(solicitacao.motivoRevisao),
    revisadoPor: solicitacao.revisadoPor || null,
    revisadoEm: normalizeOptionalDate(solicitacao.revisadoEm),
    criadoEm: normalizeOptionalDate(solicitacao.criadoEm),
    updatedAt: normalizeOptionalDate(solicitacao.atualizadoEm),
  };
}

export function normalizeRoomPayload(payload) {
  return {
    nome: normalizeOptionalText(payload?.nome),
    descricao: normalizeOptionalText(payload?.descricao),
  };
}

export function normalizeRoom(sala) {
  if (!sala) {
    return null;
  }

  const status = sala.status || null;

  return {
    id: sala.id || null,
    nome: sala.nome || "",
    descricao: normalizeOptionalText(sala.descricao),
    proprietarioId: sala.proprietarioId || null,
    proprietario: sala.proprietario
      ? {
          id: sala.proprietario.id || sala.proprietarioId || null,
          nomeCompleto: sala.proprietario.nomeCompleto || "",
          papel: sala.proprietario.papel || null,
          status: sala.proprietario.status || null,
        }
      : null,
    ownerId: sala.proprietarioId || null,
    status,
    isAvailable: status === "ATIVA" && !sala.excluidoEm,
    criadoEm: normalizeOptionalDate(sala.criadoEm),
    createdAt: normalizeOptionalDate(sala.criadoEm),
    atualizadoEm: normalizeOptionalDate(sala.atualizadoEm),
    updatedAt: normalizeOptionalDate(sala.atualizadoEm),
    excluidoEm: normalizeOptionalDate(sala.excluidoEm),
    deletedAt: normalizeOptionalDate(sala.excluidoEm),
  };
}

export function normalizeParticipant(participante) {
  if (!participante) {
    return null;
  }

  return {
    id: participante.id || null,
    nomeCompleto: participante.nomeCompleto || "",
    papel: participante.papel || null,
    role: participante.papel || null,
    status: participante.status || null,
  };
}

export function normalizeParticipationEvent(evento) {
  if (!evento) {
    return null;
  }

  return {
    id: evento.id || null,
    salaId: evento.salaId || null,
    roomId: evento.salaId || null,
    usuarioId: evento.usuarioId || null,
    userId: evento.usuarioId || null,
    tipoEvento: evento.tipoEvento || null,
    type: evento.tipoEvento || null,
    criadoEm: normalizeOptionalDate(evento.criadoEm),
    createdAt: normalizeOptionalDate(evento.criadoEm),
  };
}

export function normalizeParticipationSession(data) {
  const room = normalizeRoom(data?.sala);
  const event = normalizeParticipationEvent(data?.evento);
  const participant = normalizeParticipant(data?.participante);

  return {
    evento: event,
    event,
    sala: room,
    room,
    participante: participant,
    participant,
  };
}

export function normalizeMessagePayload(payload) {
  return {
    conteudo: String(payload?.conteudo || "").trim(),
    tipoMensagem: payload?.tipoMensagem || "TEXTO",
  };
}

export function normalizeMessageAuthor(autor, fallbackAutorId = null) {
  if (!autor && !fallbackAutorId) {
    return null;
  }

  return {
    id: autor?.id || fallbackAutorId || null,
    nomeCompleto: autor?.nomeCompleto || "",
    papel: autor?.papel || null,
    role: autor?.papel || null,
  };
}

export function normalizeMessage(mensagem) {
  if (!mensagem) {
    return null;
  }

  const author = normalizeMessageAuthor(mensagem.autor, mensagem.autorId);

  return {
    id: mensagem.id || null,
    salaId: mensagem.salaId || null,
    roomId: mensagem.salaId || null,
    autorId: mensagem.autorId || author?.id || null,
    authorId: mensagem.autorId || author?.id || null,
    tipoMensagem: mensagem.tipoMensagem || "TEXTO",
    type: mensagem.tipoMensagem || "TEXTO",
    conteudo: mensagem.conteudo || "",
    content: mensagem.conteudo || "",
    criadoEm: normalizeOptionalDate(mensagem.criadoEm),
    createdAt: normalizeOptionalDate(mensagem.criadoEm),
    atualizadoEm: normalizeOptionalDate(mensagem.atualizadoEm),
    updatedAt: normalizeOptionalDate(mensagem.atualizadoEm),
    excluidoEm: normalizeOptionalDate(mensagem.excluidoEm),
    deletedAt: normalizeOptionalDate(mensagem.excluidoEm),
    isDeleted: Boolean(mensagem.excluidoEm),
    autor: author,
    author,
  };
}

export function normalizeModerationLog(log) {
  if (!log) {
    return null;
  }

  return {
    id: log.id || null,
    administradorId: log.administradorId || null,
    usuarioAlvo: log.usuarioAlvo || null,
    salaAlvo: log.salaAlvo || null,
    solicitacaoAlvo: log.solicitacaoAlvo || null,
    mensagemAlvo: log.mensagemAlvo || null,
    tipoAcao: log.tipoAcao || null,
    motivo: log.motivo || "",
    criadoEm: normalizeOptionalDate(log.criadoEm),
  };
}
