const { getApiInfo, getHealthStatus } = require("../services/system.service");

function getRoot(_request, response) {
  response.status(200).json(getApiInfo());
}

function getHealth(_request, response) {
  response.status(200).json(getHealthStatus());
}

module.exports = {
  getRoot,
  getHealth,
};
