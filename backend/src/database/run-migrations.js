require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { sequelize } = require("./sequelize");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const META_TABLE = "SequelizeMeta";

async function ensureMetaTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${META_TABLE}" (
      name VARCHAR(255) PRIMARY KEY
    );
  `);
}

async function getExecutedMigrationNames() {
  const [rows] = await sequelize.query(`
    SELECT name
    FROM "${META_TABLE}"
    ORDER BY name;
  `);

  return new Set(rows.map((row) => row.name));
}

function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((fileName) => fileName.endsWith(".js"))
    .sort();
}

async function markMigrationAsExecuted(fileName) {
  await sequelize.query(`INSERT INTO "${META_TABLE}" (name) VALUES (:name);`, {
    replacements: { name: fileName },
  });
}

async function unmarkMigration(fileName) {
  await sequelize.query(`DELETE FROM "${META_TABLE}" WHERE name = :name;`, {
    replacements: { name: fileName },
  });
}

async function runUpMigrations() {
  await ensureMetaTable();

  const executedMigrations = await getExecutedMigrationNames();
  const migrationFiles = getMigrationFiles();
  const queryInterface = sequelize.getQueryInterface();

  for (const fileName of migrationFiles) {
    if (executedMigrations.has(fileName)) {
      continue;
    }

    const migration = require(path.join(MIGRATIONS_DIR, fileName));

    console.log(`Aplicando migration: ${fileName}`);

    await migration.up(queryInterface, sequelize.constructor);
    await markMigrationAsExecuted(fileName);
  }
}

async function runDownMigration(targetName) {
  await ensureMetaTable();

  const executedMigrations = Array.from(await getExecutedMigrationNames()).sort();

  if (!targetName) {
    throw new Error("Informe o nome da migration para rollback em MIGRATION_NAME.");
  }

  if (!executedMigrations.includes(targetName)) {
    throw new Error(`Migration não encontrada no histórico: ${targetName}`);
  }

  const queryInterface = sequelize.getQueryInterface();
  const migration = require(path.join(MIGRATIONS_DIR, targetName));

  console.log(`Revertendo migration: ${targetName}`);

  await migration.down(queryInterface, sequelize.constructor);
  await unmarkMigration(targetName);
}

async function main() {
  const command = process.argv[2] || "up";
  const targetName = process.env.MIGRATION_NAME;

  try {
    if (command === "down") {
      await runDownMigration(targetName);
    } else {
      await runUpMigrations();
    }

    console.log("Migrações executadas com sucesso.");
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error("Falha ao executar migrations:", error.stack || error.message || error);
  process.exit(1);
});
