# Free Chat Maker

Sistema de chat institucional com:

- autenticação por CPF e senha
- solicitação de cadastro com aprovação administrativa
- salas públicas
- mensagens em tempo real
- moderação administrativa
- auditoria de ações sensíveis

O projeto foi desenvolvido com abordagem Spec-Driven Development, então a implementação acompanha os artefatos em `specs/`.

## Stack

- Frontend: Vue 3, Vuetify, Pinia, Vue Router, Vite
- Backend: Node.js, Express, Sequelize, WebSocket (`ws`)
- Banco: PostgreSQL
- Infra: Docker e Docker Compose

## Estrutura

```text
free-chat-maker/
├── backend/
├── frontend/
├── docker/
├── specs/
├── docker-compose.yml
├── docker-compose.dev.yml
├── dockerenv.example
└── README.md
```

## Pré-requisitos

Para rodar localmente, você precisa de:

- Node.js 20+
- npm 10+
- Docker
- Docker Compose

## Modos de execução

O projeto hoje tem 2 modos principais:

1. desenvolvimento híbrido
   - banco em Docker
   - backend e frontend rodando localmente com Node/Vite
2. produção local
   - frontend, backend e banco rodando com Docker Compose

## Variáveis de ambiente

### Arquivos de exemplo

- raiz: [.env.example](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/.env.example)
- Docker Compose: [dockerenv.example](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/dockerenv.example)
- backend local: [backend/.env.example](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/backend/.env.example)
- frontend opcional: [frontend/.env.example](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/frontend/.env.example)

### Convenção usada no projeto

- `backend/.env`
  - use quando o backend roda fora do Docker
- `dockerenv`
  - use quando a stack roda por `docker compose`

### Variáveis obrigatórias do backend

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5435
DB_NAME=freechat
DB_USER=postgres
DB_PASS=change_me
JWT_SECRET=change_me
```

### Variável opcional recomendada

```env
JWT_EXPIRES_IN=1d
```

### Observação sobre o frontend

No deploy padrão com Nginx, o frontend usa proxy interno para:

- `/api`
- `/ws`

Por isso, estas variáveis são opcionais:

- `VITE_API_BASE_URL`
- `VITE_WS_BASE_URL`

Você só precisa delas se quiser buildar o frontend apontando para endpoints externos explícitos.

## Como rodar em desenvolvimento

### 1. Subir o banco com Docker

```bash
cp dockerenv.example dockerenv
docker compose -f docker-compose.dev.yml up -d postgres
```

Isso expõe o PostgreSQL na porta `5435`.

### 2. Instalar dependências

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 3. Configurar o backend local

Crie o arquivo `backend/.env` a partir de `backend/.env.example`.

Exemplo:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5435
DB_NAME=freechat
DB_USER=postgres
DB_PASS=change_me
JWT_SECRET=change_me
JWT_EXPIRES_IN=1d
```

### 4. Rodar migrations

```bash
cd backend
npm run migrate
```

### 5. Subir backend e frontend

Em terminais separados:

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

### 6. Endereços locais

- frontend Vite: `http://localhost:5173`
- backend API: `http://localhost:3000`
- healthcheck: `http://localhost:3000/health`

## Como rodar em produção local com Docker

### 1. Preparar variáveis

```bash
cp dockerenv.example dockerenv
```

Edite `dockerenv` com valores reais para:

- `DB_PASS`
- `JWT_SECRET`
- `POSTGRES_PASSWORD`

### 2. Subir a stack

```bash
docker compose up -d --build
```

### 3. Endereços

- frontend: `http://localhost:8080`
- backend interno via proxy do frontend:
  - `http://localhost:8080/api/...`
  - `ws://localhost:8080/ws`

### 4. Observações

- no compose de produção, a API e o PostgreSQL não ficam expostos para fora
- o frontend espera a API ficar saudável antes de subir
- o backend executa migrations antes de iniciar

## Fluxo de acesso na aplicação

Rotas principais:

- `/login`
- `/cadastro`
- `/salas`
- `/salas/:id`
- `/admin`

Fluxo comum:

1. visitante solicita cadastro em `/cadastro`
2. administrador aprova no painel
3. usuário faz login em `/login`
4. usuário acessa `/salas`
5. usuário entra na sala e conversa em tempo real

## Scripts de automação usados no projeto

### Scripts da raiz

Arquivo: [package.json](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/package.json)

```bash
npm run dev:backend
npm run dev:frontend
npm run lint:backend
npm run lint:frontend
npm run format:backend
npm run format:frontend
```

Esses scripts são atalhos para executar comandos nas subpastas.

### Scripts do backend

Arquivo: [backend/package.json](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/backend/package.json)

Principais comandos:

```bash
npm run dev
npm start
npm run start:server
npm run migrate
npm run migrate:down
npm test
npm run lint
```

Scripts operacionais criados:

- [backend/scripts/start-backend.sh](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/backend/scripts/start-backend.sh)
  - start de produção do backend
- [backend/scripts/run-migrations.sh](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/backend/scripts/run-migrations.sh)
  - execução de migrations `up` e `down`

Resumo:

- `npm start`
  - usa o script de start de produção
- `npm run migrate`
  - usa o script operacional de migrations
- `npm run migrate:down`
  - faz rollback da migration indicada por `MIGRATION_NAME`

Exemplo de rollback:

```bash
cd backend
MIGRATION_NAME=011-add-solicitacao-alvo-to-logs-moderacao.js npm run migrate:down
```

### Scripts do frontend

Arquivo: [frontend/package.json](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/frontend/package.json)

Principais comandos:

```bash
npm run dev
npm run build
npm run build:app
npm run lint
npm run preview
```

Script operacional criado:

- [frontend/scripts/build-frontend.sh](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/frontend/scripts/build-frontend.sh)
  - build de produção do frontend

Resumo:

- `npm run build`
  - usa o script operacional de build
- `npm run build:app`
  - chama o `vite build` diretamente

## Docker

### Arquivos principais

- produção: [docker-compose.yml](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/docker-compose.yml)
- desenvolvimento: [docker-compose.dev.yml](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/docker-compose.dev.yml)
- documentação complementar: [docker/README.md](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/docker/README.md)

### Diferença entre os arquivos de compose

`docker-compose.dev.yml`

- expõe banco e API
- monta volumes de código
- é voltado para desenvolvimento iterativo

`docker-compose.yml`

- é o compose orientado a produção local
- não expõe PostgreSQL nem API
- sobe o frontend em `8080`
- usa healthcheck para ordenar a subida dos serviços

## Qualidade

### Backend

```bash
cd backend
npm run lint
npm test
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

Observação:

- o frontend ainda possui warnings visuais do ESLint/Vue
- o backend está com lint e testes passando

## Estado atual dos itens de automação já implementados

Já estão prontos:

- script de start do backend
- script de build do frontend
- script de execução de migrations
- Dockerfile de produção do backend
- Dockerfile de produção do frontend
- compose de produção local
- exemplos de variáveis de ambiente

Ainda pode evoluir depois:

- seed automático do administrador
- subida validada ponta a ponta em modo de produção local
- pipeline de CI/CD

## Artefatos de especificação

Os documentos principais do projeto ficam em [specs/](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/specs):

- [specs.md](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/specs/specs.md)
- [use-cases.md](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/specs/use-cases.md)
- [domain-model.md](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/specs/domain-model.md)
- [database-spec.md](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/specs/database-spec.md)
- [architecture-design.md](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/specs/architecture-design.md)
- [tasks.md](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/specs/tasks.md)
- [execution-protocol.md](/home/gustavo/Desktop/TCC_2026_RESEARCH/specs-designer-developer/free-chat-maker/specs/execution-protocol.md)

## Autor

Projeto desenvolvido por Gustavo Rocha com foco educacional e arquitetural.

## Licença

Uso educacional.
