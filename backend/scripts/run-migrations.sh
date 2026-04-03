#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMAND="${1:-up}"

cd "$ROOT_DIR"

export NODE_ENV="${NODE_ENV:-production}"

echo "Executando migrations do backend..."
echo "NODE_ENV=${NODE_ENV}"
echo "COMANDO=${COMMAND}"

exec node src/database/run-migrations.js "$COMMAND"
