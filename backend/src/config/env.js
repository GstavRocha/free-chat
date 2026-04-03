const requiredEnvVars = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASS", "JWT_SECRET"];

function getEnv() {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Variavel de ambiente obrigatoria ausente: ${envVar}`);
    }
  }

  return {
    port: Number(process.env.PORT || 3000),
    database: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  };
}

module.exports = { getEnv };
