const { AppError } = require("../errors/app-error");
const { findUserById } = require("../repositories/usuario.repository");
const { findSalaById } = require("../repositories/salas.repository");
const {
  createEventoParticipacao,
  findUltimoEventoParticipacao,
} = require("../repositories/participacao.repository");

function serializeEventoParticipacao(evento) {
  return {
    id: evento.id,
    salaId: evento.salaId,
    usuarioId: evento.usuarioId,
    tipoEvento: evento.tipoEvento,
    criadoEm: evento.criadoEm,
  };
}

function serializeParticipante(usuario) {
  return {
    id: usuario.id,
    nomeCompleto: usuario.nomeCompleto,
    papel: usuario.papel,
    status: usuario.status,
  };
}

async function registrarEntradaEmSala({ salaId, usuarioId }) {
  const usuario = await findUserById(usuarioId);

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
    throw new AppError("Sala indisponível para entrada.", {
      statusCode: 409,
      code: "ROOM_ENTRY_UNAVAILABLE",
      details: {
        status: sala.status,
      },
    });
  }

  const evento = await createEventoParticipacao({
    salaId,
    usuarioId,
    tipoEvento: "ENTRADA",
  });

  return {
    evento: serializeEventoParticipacao(evento),
    sala: {
      id: sala.id,
      nome: sala.nome,
      status: sala.status,
    },
    participante: serializeParticipante(usuario),
  };
}

async function registrarSaidaDaSala({ salaId, usuarioId }) {
  const usuario = await findUserById(usuarioId);

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

  const ultimoEvento = await findUltimoEventoParticipacao({ salaId, usuarioId });

  if (!ultimoEvento || ultimoEvento.tipoEvento !== "ENTRADA") {
    throw new AppError("Não há entrada ativa registrada para esta sala.", {
      statusCode: 409,
      code: "ROOM_EXIT_NOT_ALLOWED",
    });
  }

  const evento = await createEventoParticipacao({
    salaId,
    usuarioId,
    tipoEvento: "SAIDA",
  });

  return {
    evento: serializeEventoParticipacao(evento),
    sala: {
      id: sala.id,
      nome: sala.nome,
      status: sala.status,
    },
    participante: serializeParticipante(usuario),
  };
}

module.exports = {
  registrarEntradaEmSala,
  registrarSaidaDaSala,
};
