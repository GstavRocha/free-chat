# Docker do banco

O container PostgreSQL do projeto é iniciado pelos arquivos de compose na raiz de `free-chat-maker`.

Arquivos de ambiente:

* `dockerenv.example`: exemplo para o ambiente de producao com `docker compose`
* `dockerenv`: arquivo real usado por `docker-compose.yml` e `docker-compose.dev.yml`
* `backend/.env.example`: exemplo para executar a API fora do Docker

Configuracao atual:

* banco: definido em `POSTGRES_DB`
* usuario: definido em `POSTGRES_USER`
* senha: definida em `POSTGRES_PASSWORD`
* porta host em desenvolvimento: `5435`
* porta externa em producao compose: nao exposta
* script de inicializacao: `specs/databasescript.sql`

Para subir apenas o banco no ambiente de desenvolvimento:

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

Para subir a stack de producao local:

```bash
cp dockerenv.example dockerenv
docker compose up -d --build
```
