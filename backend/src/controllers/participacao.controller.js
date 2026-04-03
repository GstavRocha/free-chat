const {
  registrarEntradaEmSala,
  registrarSaidaDaSala,
} = require("../services/participacao.service");

async function registrarEntradaEmSalaController(request, response, next) {
  try {
    const resultado = await registrarEntradaEmSala({
      salaId: request.params.id,
      usuarioId: request.auth.userId,
    });

    response.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function registrarSaidaDaSalaController(request, response, next) {
  try {
    const resultado = await registrarSaidaDaSala({
      salaId: request.params.id,
      usuarioId: request.auth.userId,
    });

    response.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registrarEntradaEmSalaController,
  registrarSaidaDaSalaController,
};
