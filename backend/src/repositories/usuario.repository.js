const { Op } = require("sequelize");

const { Usuario, initModels } = require("../models");

function normalizeCpfInput(cpf) {
  return String(cpf || "").trim();
}

async function findUserByCpf(cpf, options = {}) {
  initModels();

  const normalizedCpf = normalizeCpfInput(cpf);
  const digitsOnlyCpf = normalizedCpf.replace(/\D/g, "");

  const searchValues = Array.from(new Set([normalizedCpf, digitsOnlyCpf].filter(Boolean)));

  return Usuario.findOne({
    where: {
      cpf: {
        [Op.in]: searchValues,
      },
    },
    transaction: options.transaction,
  });
}

async function findUserById(id, options = {}) {
  initModels();

  return Usuario.findByPk(id, {
    transaction: options.transaction,
  });
}

async function listUsers() {
  initModels();

  return Usuario.findAll({
    order: [["criadoEm", "DESC"]],
  });
}

async function updateUserStatus(id, status, options = {}) {
  initModels();

  const usuario = await Usuario.findByPk(id, {
    transaction: options.transaction,
  });

  if (!usuario) {
    return null;
  }

  usuario.status = status;
  await usuario.save({
    transaction: options.transaction,
  });

  return usuario;
}

module.exports = {
  findUserByCpf,
  findUserById,
  listUsers,
  updateUserStatus,
};
