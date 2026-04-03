const bcrypt = require("bcrypt");

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
