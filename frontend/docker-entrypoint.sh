#!/usr/bin/env bash
set -e

echo "Preparando dependencias do frontend..."
npm install

# TEMPORARIO: este entrypoint inicia o frontend em modo de desenvolvimento
# dentro do container para acelerar a iteracao local durante a FASE 7.
echo "Iniciando frontend Vue em modo desenvolvimento..."
exec bash -lc "npm run dev -- --host 0.0.0.0"
