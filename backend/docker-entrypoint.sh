#!/usr/bin/env bash
set -e

echo "Aplicando migrations do banco..."
npm run migrate

echo "Iniciando API em modo producao..."
exec npm start
