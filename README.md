# Free Chat Maker
*
Sistema de chat institucional com salas públicas, comunicação em tempo real e moderação administrativa, desenvolvido utilizando abordagem **Spec-Driven Development (SDD)** para garantir consistência arquitetural, rastreabilidade de requisitos e evolução sustentável.

O projeto foi estruturado seguindo práticas modernas de engenharia de software, separando claramente:

- requisitos
- modelo de domínio
- design de banco
- arquitetura
- tasks de implementação
- código

---

# Objetivo do projeto

O Free Chat Maker tem como objetivo fornecer uma plataforma de comunicação interna organizada, segura e auditável, permitindo:

- comunicação entre usuários autenticados
- criação de salas públicas
- envio de mensagens em tempo real
- envio de código dentro do chat
- moderação administrativa
- rastreabilidade de ações
- controle de acesso por papéis

O sistema foi pensado como uma aplicação institucional, não como um chat genérico.

---

# Arquitetura do sistema

O sistema segue arquitetura cliente-servidor com backend modular.

Arquitetura geral:

Frontend (Vue.js + Vuetify)
↓
API REST (Node.js + Express)
↓
WebSocket Gateway
↓
PostgreSQL (persistência)
↓
Docker (infraestrutura)

---

# Stack tecnológica

## Backend

- Node.js
- Express
- Sequelize ORM
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- WebSocket (ws)
- dotenv

## Frontend

- Vue.js
- Vuetify
- Axios
- WebSocket client

## Infraestrutura

- Docker
- Docker Compose
- PostgreSQL container

## Engenharia

- Spec-Driven Development
- Domain Modeling
- RBAC authorization
- Modular backend architecture

---

# Estrutura do projeto

```

free-chat-maker/

backend/
src/

config/
database/

models/
repositories/

services/

controllers/

routes/

middlewares/

websocket/

utils/

app.js
server.js

frontend/

spec/

specs.md
use-cases.md
domain-model.md
database-design.md
architecture-design.md
tasks.md

docker/

README.md

```

---

# Abordagem de desenvolvimento

O projeto segue **Spec-Driven Development (SDD)**:

Fluxo:

```

Spec
→ Use Cases
→ Domain Model
→ Database Design
→ Architecture
→ Tasks
→ Code

```

Isso evita:

- arquitetura improvisada
- regras esquecidas
- refatorações caóticas
- inconsistência entre requisitos e código

---

# Principais funcionalidades

## Cadastro com aprovação administrativa

Usuários não entram automaticamente no sistema.

Fluxo:

Solicitação cadastro  
→ Revisão admin  
→ Aprovação  
→ Liberação acesso  

---

## Autenticação segura

Sistema usa:

- JWT
- hash bcrypt
- controle de status usuário
- RBAC

Estados possíveis:

PENDENTE  
APROVADO  
BLOQUEADO  
REJEITADO  

---

## Salas públicas

Usuários podem:

- criar salas
- entrar em salas
- visualizar histórico
- interagir em tempo real

Estados da sala:

ATIVA  
SILENCIADA  
EXCLUIDA  

---

## Mensagens

Suporte a:

- texto
- código
- eventos sistema
- avisos moderação

Mensagens são persistidas.

---

## Comunicação em tempo real

Implementado com WebSocket.

Fluxo:

Cliente envia mensagem  
→ Backend valida  
→ Backend persiste  
→ Backend broadcast  

---

## Moderação administrativa

Administradores podem:

- bloquear usuários
- remover mensagens
- silenciar salas
- enviar avisos
- registrar logs

Toda ação administrativa gera auditoria.

---

# Modelo de domínio

Principais entidades:

Usuario  
SolicitacaoCadastro  
Sala  
Mensagem  
EventoParticipacao  
LogModeracao  

Relacionamentos definidos em:

```

spec/database-design.md

```

---

# MVP do sistema

Escopo mínimo inicial:

Login  
Criar sala  
Entrar sala  
Enviar mensagem  
Broadcast realtime  

Funcionalidades avançadas entram depois.

---

# Como executar o backend

## Instalar dependências

```

cd backend

npm install

```

## Configurar variáveis

Criar:

```

.env

```

Exemplo:

```

PORT=3000

DB_HOST=localhost
DB_USER=postgres
DB_PASS=postgres
DB_NAME=freechat

```

## Convenção de ambientes

Para evitar conflito entre execução local e execução via Docker:

- `backend/.env` deve ser usado quando a API roda fora do Docker
- `dockerenv` deve ser usado quando a API roda pelo `docker compose`

Diferença principal:

- local: `DB_HOST=localhost` e `DB_PORT=5435`
- docker: `DB_HOST=postgres` e `DB_PORT=5432`

Arquivos de exemplo disponíveis:

```

backend/.env.example
dockerenv.example

```

## Rodar servidor

```

npm run dev

```

ou:

```

node src/server.js

```

---

# Banco de dados

Sistema usa PostgreSQL.

Design completo:

```

spec/database-design.md

```

Modelagem baseada em:

- integridade relacional
- rastreabilidade
- soft delete
- enums controlados
- RBAC

---

# Roadmap de desenvolvimento

Ordem:

Infraestrutura  
Banco  
Backend core  
Auth  
Chat  
Realtime  
Frontend  
Moderação  
Qualidade  
Deploy  

Definido em:

```

spec/tasks.md

```

---

# Princípios arquiteturais

O projeto segue:

Separação de responsabilidades  
Baixo acoplamento  
Alta coesão  
Rastreabilidade  
Evolução incremental  
Persistência consistente  
Segurança básica  
Domínio primeiro  

---

# Regras importantes do projeto

Nunca:

Pular service layer  
Misturar controller com regra negócio  
Persistir senha em texto  
Ignorar RBAC  
Remover logs  

Sempre:

Validar domínio no service  
Persistir antes de broadcast  
Usar middleware auth  
Registrar ações administrativas  

---

# Possíveis evoluções futuras

Salas privadas  
Notificações  
Presença online  
Analytics  
Sistema de denúncias  
Busca mensagens  
Upload arquivos  
Integração institucional  

---

# Status do projeto

Em desenvolvimento.

Fase atual:

Backend foundation

---

# Autor

Projeto desenvolvido como estudo de arquitetura de software e engenharia de sistemas orientada a especificação.

---

# Licença

Uso educacional.
```

---

# Próximo passo lógico agora

Agora você tem:

SDD
Use cases
Tasks
README

Você já pode:

**começar a implementação sem improviso.**
