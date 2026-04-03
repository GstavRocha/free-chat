const { getServiceMetadata } = require("../repositories/system.repository");

function getApiInfo() {
  const metadata = getServiceMetadata();

  return {
    name: metadata.name,
    status: "online",
  };
}

function getHealthStatus() {
  const metadata = getServiceMetadata();

  return {
    status: "ok",
    service: metadata.service,
  };
}

module.exports = {
  getApiInfo,
  getHealthStatus,
};
