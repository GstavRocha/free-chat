function writeLog(level, message, context = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const output = JSON.stringify(payload);

  if (level === "error") {
    console.error(output);
    return;
  }

  console.log(output);
}

const logger = {
  info(message, context) {
    writeLog("info", message, context);
  },
  warn(message, context) {
    writeLog("warn", message, context);
  },
  error(message, context) {
    writeLog("error", message, context);
  },
};

module.exports = { logger };
