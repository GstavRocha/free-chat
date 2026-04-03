# Specs - Free Chat Maker

version: 0.1.0
status: Draft
Autor: Gustavo
Abordagem: Spec-Driven Development (SDD)
Camadas de Stack:

1. Frontend:

* Vue.js

* Vuetify.js

2. Backend:

* Node.js

2.1. API:

* Express.js

2.2. Variáveis de ambiente:

* dotenv

2.3. ORM:

* Sequelize

2.4. Segurança:

* bcrypt ou equivalente para hash de senha

* JWT para autenticação e sessão

* controle de acesso baseado em papéis (RBAC)

3. Infraestrutura:

* Docker

* Docker Compose

* Dockerfile

* `.env`

4. Camada de aplicação:

* HTTP server

* frontend Vue.js em build de produção

5. Restrições técnicas obrigatórias:

* frontend em Vue.js

* backend em Node.js + Express.js

* banco de dados PostgreSQL

* ORM Sequelize

* containerização com Docker

* comunicação em tempo real via WebSocket

---

#### 1. Visão do Produto:

O Free Chat Maker é uma aplicação web acessível por desktop e mobile, com foco na comunicação entre alunos, professores e funcionários por meio de salas públicas institucionais.

Essas salas poderão ser criadas por usuários autorizados e utilizadas para troca de mensagens em tempo real, desde que o usuário tenha sido previamente aprovado pelo Administrator do System.

O sistema será usado em contexto local e institucional, com foco inicial em simplicidade, rastreabilidade, organização por salas, moderação básica e base estruturada para futuras expansões.

---

#### 2. Problema:

Em ambientes escolares, a comunicação entre professores, alunos e funcionários pode perder consistência, rastreabilidade e organização. Em um contexto com alto volume de interações, informações importantes podem se dispersar, gerar ruído ou não ficar registradas de forma adequada.

O que o Free Chat Maker propõe:

* autenticação de usuário

* identificação institucional do usuário

* salas públicas

* troca de mensagens em tempo real

* rastreabilidade administrativa mínima

---

#### 3. Objetivo Principal:

* centralizar a comunicação institucional

* manter cadastro mínimo estruturado de usuários

* permitir crescimento futuro da plataforma

* garantir rastreabilidade mínima das ações principais

* criar uma comunidade consistente para apoiar as rotinas escolares

* criar ambiente de debates e interações entre alunos, professores e funcionários, onde o aprendizado pode ser compartilhado de forma colaborativa

---

## 4. Escopo

#### 4.1 Em Escopo

* solicitação de cadastro de usuário

* aprovação administrativa de novos usuários

* login de usuário aprovado

* criação, edição, silenciamento e exclusão lógica de salas públicas

* listagem de salas públicas disponíveis

* entrada em salas com identificação do evento de entrada para os participantes

* envio, edição e remoção de mensagens na sala

* histórico de mensagens por sala

* message audit tracking com identificação dos IDs dos usuários

* message retention e administrative traceability

* persistência em PostgreSQL

* execução com Docker e Docker Compose

* envio de trechos de código nas mensagens

* comunicação em tempo real via WebSocket

#### 4.2 Fora do Escopo versão 1.0

* salas privadas

* mensagens diretas entre usuários

* anexo de documentos

* reações

* modo agenda

* mural de informativos

* mídias escolares como vídeos, podcasts e artigos de texto

* videochamadas ou chamadas de áudio coletivas ou individuais

* hierarquia de permissão complexa além dos papéis definidos nesta versão

---

#### 5. Personas

#### 5.1 Administrator

**papel**

Responsável pela administração do System, aprovação de acessos, moderação de conteúdo e gerenciamento global das salas e usuários.

**regras**

* aprova ou rejeita solicitações de cadastro

* bloqueia usuários

* pode moderar mensagens em qualquer sala

* pode registrar motivo administrativo ao moderar conteúdo

* pode criar, editar, silenciar e excluir logicamente salas

* pode acessar rastros administrativos de mensagens e eventos

> nesta versão existe um painel administrativo simplificado para gerenciamento de usuários, salas, moderação e consistência operacional do sistema.

#### 5.2 Student

**papel**

Usuário do tipo aluno, com acesso às salas públicas após aprovação administrativa.

**regras**

* solicita cadastro

* acessa o sistema somente após aprovação

* entra em salas públicas ativas

* envia, edita e remove mensagens próprias conforme regras do sistema

* cria, edita e remove suas próprias salas públicas, respeitando rastreabilidade administrativa

#### 5.3 Teacher

**papel**

Usuário do tipo professor, com acesso às salas públicas após aprovação administrativa.

**regras**

* solicita cadastro

* depende de validação administrativa da solicitação

* cria, edita e remove salas públicas próprias

* envia, edita e remove mensagens próprias

#### 5.4 Employee

**papel**

Usuário do tipo funcionário, com acesso às salas públicas após aprovação administrativa.

**regras**

* solicita cadastro

* entra em salas públicas ativas

* cria, edita e remove salas públicas próprias

* envia, edita e remove mensagens próprias

---

## 6. Requisitos Funcionais

### RF-01 — Solicitação de cadastro de usuário

O sistema deve permitir que um visitante solicite cadastro informando os dados obrigatórios conforme seu papel institucional.

Campos obrigatórios comuns:

* name

* cpf

* password

* role

Campos adicionais por papel:

* Student: grade e class

* Teacher: department opcional

* Employee: sector opcional

### RF-02 — Fluxo de aprovação administrativa

O sistema deve permitir que o Administrator visualize solicitações de cadastro pendentes e decida por aprovar, rejeitar ou bloquear o acesso, conforme política institucional.

### RF-03 — Autenticação

O sistema deve autenticar usuários aprovados por meio de login com CPF e senha, emitindo sessão autenticada com JWT.

### RF-04 — Criação de sala

O sistema deve permitir a criação de sala pública por usuários autenticados com permissão para essa ação, registrando autor, data e estado inicial da sala.

### RF-05 — Edição de sala

O sistema deve permitir que o autor da sala ou o Administrator edite os dados permitidos da sala pública.

### RF-06 — Exclusão lógica e silenciamento de sala

O sistema deve permitir que o autor da sala ou o Administrator altere o estado da sala para `SILENCED` ou `DELETED`, conforme permissão.

### RF-07 — Listagem de salas

O sistema deve listar salas públicas disponíveis ao usuário autenticado, considerando apenas salas visíveis e acessíveis conforme seu estado.

### RF-08 — Evento de entrada em sala

O sistema deve registrar e divulgar o evento de entrada do usuário em uma sala, identificando o participante que entrou.

### RF-09 — Envio de mensagem

O sistema deve permitir que usuários autenticados enviem mensagens em salas ativas nas quais tenham entrado.

### RF-10 — Edição de mensagem

O sistema deve permitir a edição de mensagens próprias e, quando aplicável, pelo Administrator para fins de moderação operacional.

### RF-11 — Remoção de mensagem

O sistema deve permitir a remoção lógica de mensagens próprias e a remoção administrativa de qualquer mensagem pelo Administrator.

### RF-12 — Recuperação do histórico de mensagens

O sistema deve recuperar o histórico de mensagens de uma sala em ordem cronológica, incluindo informações mínimas de autoria e data/hora.

### RF-13 — Moderação administrativa

O sistema deve permitir ao Administrator moderar salas, mensagens e acessos, registrando ação, motivo e referência do alvo moderado.

### RF-14 — Bloqueio de usuário

O sistema deve permitir ao Administrator alterar o estado de um usuário para `BLOCKED`, impedindo novo acesso autenticado ao System.

### RF-15 — Rastreabilidade de auditoria de mensagens

O sistema deve manter message audit tracking sobre criação, edição, remoção e moderação de mensagens, com administrative traceability.

### RF-16 — Mensagens com trecho de código

O sistema deve permitir o envio de mensagens contendo script ou trecho de código em formato textual, preservando o conteúdo enviado.

### RF-17 — Mensageria em tempo real via WebSocket

O sistema deve propagar mensagens em tempo real por WebSocket para os participantes conectados na sala.

### RF-18 — Eventos de participação em sala

O sistema deve publicar eventos de participação relacionados à entrada do usuário em sala e manter o respectivo registro mínimo para rastreabilidade.

---

## 7. Regras de Negócio

### RN-01 — Cadastro obrigatório

Somente usuários cadastrados podem acessar o sistema autenticado.

### RN-02 — Solicitação de cadastro antes do acesso

Todo usuário deve primeiro realizar uma solicitação de cadastro antes de poder autenticar no System.

### RN-03 — Dados mínimos do cadastro

Toda solicitação de cadastro deve conter, no mínimo:

* name

* cpf

* password

* role

Campos adicionais por papel:

* Student: grade e class obrigatórios

* Teacher: department opcional

* Employee: sector opcional

### RN-04 — CPF único

Não pode haver dois usuários com o mesmo CPF, considerando tanto solicitações aprovadas quanto registros efetivos de usuário.

### RN-05 — Estados do usuário

Todo usuário ou solicitação de cadastro deve estar associado a um dos seguintes estados:

* `PENDING`

* `APPROVED`

* `BLOCKED`

* `REJECTED`

### RN-06 — Aprovação obrigatória para acesso

Somente usuários com estado `APPROVED` podem autenticar e usar o sistema.

### RN-07 — Bloqueio impede autenticação

Usuários com estado `BLOCKED` não podem autenticar nem acessar áreas protegidas do System.

### RN-08 — Login obrigatório

Somente usuários autenticados podem:

* listar salas

* entrar em salas

* criar salas

* enviar mensagens

* editar mensagens próprias

### RN-09 — Salas sempre públicas

Todas as salas da versão inicial são públicas e visíveis conforme sua disponibilidade operacional.

### RN-10 — Estados da sala

Toda sala deve possuir um estado de ciclo de vida:

* `ACTIVE`

* `SILENCED`

* `DELETED` (lógico)

### RN-11 — Regra de visibilidade de sala

Somente salas com estado `ACTIVE` devem aceitar entrada e troca normal de mensagens. Salas `SILENCED` ficam indisponíveis para uso comum. Salas `DELETED` não devem aparecer na listagem padrão.

### RN-12 — Criador identificado

Toda sala deve registrar qual usuário a criou.

### RN-13 — Mensagem vinculada ao autor

Toda mensagem enviada deve estar associada ao usuário autenticado que a enviou e à sala correspondente.

### RN-14 — Sem envio vazio

O sistema não deve permitir envio de mensagem vazia ou composta apenas por espaços.

### RN-15 — Histórico por sala

As mensagens devem ser recuperadas por sala, respeitando a ordem cronológica de envio.

### RN-16 — Entrada condicionada à sala existente e ativa

O usuário só poderá entrar em uma sala que exista e esteja em estado `ACTIVE`.

### RN-17 — Persistência obrigatória

Usuários, solicitações de cadastro, salas, mensagens, eventos de participação e logs de moderação devem ser persistidos no PostgreSQL.

### RN-18 — Auditoria mínima temporal

Usuários, salas, mensagens, eventos de participação e logs de moderação devem possuir registro de data/hora de criação.

### RN-19 — Message retention e administrative traceability

O sistema deve manter retenção mínima das mensagens e trilhas administrativas para investigação, moderação e acompanhamento de uso indevido.

### RN-20 — Permissões de admissão de acesso

Somente o Administrator pode aprovar ou rejeitar solicitações de cadastro.

### RN-21 — Gerenciamento administrativo de salas

O Administrator pode gerenciar salas de outros usuários, inclusive editar, silenciar ou excluir logicamente.

### RN-22 — Gerenciamento administrativo de mensagens

O Administrator pode moderar mensagens de qualquer usuário.

### RN-23 — Propriedade operacional

Usuários não administradores podem editar ou remover apenas salas e mensagens de sua própria autoria, respeitando os limites do seu papel.

### RN-24 — Código como conteúdo textual

Trechos de código enviados em mensagens devem ser tratados como conteúdo textual da mensagem, sem execução automática pelo System.

### RN-25 — Comunicação em tempo real obrigatória na versão 1

A versão 1 deve suportar troca de mensagens e eventos principais de participação em tempo real via WebSocket.

---

## 8. Requisitos Não Funcionais

### RNF-01 — Arquitetura web

O sistema deve seguir arquitetura cliente-servidor:

* frontend em Vue.js

* backend em Node.js + Express.js

* banco em PostgreSQL

### RNF-02 — Containerização

A aplicação deve poder ser executada com Docker, Docker Compose e Dockerfile.

### RNF-03 — Persistência relacional

Os dados devem ser armazenados em PostgreSQL.

### RNF-04 — Estrutura modular

A camada HTTP pode seguir estilo MVC para organização de rotas, controllers e responses.

A estrutura interna da aplicação deve seguir princípios de Clean Architecture com Modularization por domínio, minimizando acoplamento entre os módulos principais.

Módulos mínimos esperados:

* auth

* users

* rooms

* messages

* moderation

### RNF-05 — Legibilidade e manutenção

O código deve priorizar clareza, separação de responsabilidades, facilidade de manutenção e tratamento consistente de erros, validações e sanitização de entrada.

### RNF-06 — Segurança básica

As senhas devem ser armazenadas com hash seguro, utilizando bcrypt ou equivalente.

JWT deve ser utilizado apenas para autenticação e gerenciamento de sessão.

### RNF-07 — Validação de entrada

Campos obrigatórios, formatos mínimos e consistência básica dos dados devem ser validados no backend.

### RNF-08 — Evolutividade

A estrutura deve permitir futura expansão para:

* salas privadas

* moderação mais detalhada

* perfis

* notificações em tempo real via WebSocket

### RNF-09 — Comunicação em tempo real

O backend deve disponibilizar suporte a WebSocket para propagação de mensagens e eventos de participação.

### RNF-10 — Rastreabilidade mínima

O sistema deve manter registros suficientes para auditoria operacional sem descaracterizar a simplicidade da versão inicial.

---

## 9. Modelo de Papéis e Permissões (RBAC)

Papéis formais do sistema:

* `ADMIN`

* `STUDENT`

* `TEACHER`

* `STAFF`

### 9.1 Permissões por papel

#### ADMIN

* visualizar solicitações de cadastro

* aprovar solicitações

* rejeitar solicitações

* bloquear usuários

* autenticar no sistema

* listar salas

* entrar em salas ativas

* criar salas

* editar qualquer sala

* silenciar qualquer sala

* excluir logicamente qualquer sala

* enviar mensagens

* editar mensagens próprias

* moderar qualquer mensagem

* acessar logs e trilhas administrativas

#### STUDENT

* solicitar cadastro

* autenticar se aprovado

* listar salas ativas

* entrar em salas ativas

* criar salas próprias

* editar salas próprias

* excluir logicamente salas próprias

* enviar mensagens

* editar mensagens próprias

* remover mensagens próprias

#### TEACHER

* solicitar cadastro

* autenticar se aprovado

* listar salas ativas

* entrar em salas ativas

* criar salas próprias

* editar salas próprias

* excluir logicamente salas próprias

* enviar mensagens

* editar mensagens próprias

* remover mensagens próprias

#### STAFF

* solicitar cadastro

* autenticar se aprovado

* listar salas ativas

* entrar em salas ativas

* criar salas próprias

* editar salas próprias

* excluir logicamente salas próprias

* enviar mensagens

* editar mensagens próprias

* remover mensagens próprias

### 9.2 Observações de RBAC

* a permissão de autenticação depende do estado `APPROVED`

* o estado `BLOCKED` sobrepõe qualquer permissão de acesso

* o Administrator possui autoridade de moderação acima da autoria do recurso

* não há hierarquia complexa além dos papéis definidos nesta versão

---

## 10. Entidades de Domínio

### 10.1 User

Representa o usuário aprovado ou bloqueado dentro do sistema.

Atributos mínimos:

* id

* name

* cpf

* passwordHash

* role (`ADMIN`, `STUDENT`, `TEACHER`, `STAFF`)

* status (`APPROVED` ou `BLOCKED`)

* grade opcional

* class opcional

* department opcional

* sector opcional

* createdAt

* updatedAt

### 10.2 RegistrationRequest

Representa a solicitação inicial de cadastro antes da aprovação administrativa.

Atributos mínimos:

* id

* name

* cpf

* passwordHash

* role

* requestedData complementar por papel

* status (`PENDING`, `APPROVED`, `REJECTED`, `BLOCKED`)

* reviewedBy opcional

* reviewedAt opcional

* createdAt

### 10.3 Room

Representa a sala pública institucional.

Atributos mínimos:

* id

* name

* description opcional

* createdBy

* status (`ACTIVE`, `SILENCED`, `DELETED`)

* createdAt

* updatedAt

### 10.4 Message

Representa a mensagem enviada em uma sala.

Atributos mínimos:

* id

* roomId

* authorId

* content

* contentType textual

* isCodeSnippet indicador lógico

* createdAt

* updatedAt

* deletedAt opcional

### 10.5 RoomParticipantEvent

Representa evento de participação relacionado à presença do usuário em sala.

Atributos mínimos:

* id

* roomId

* userId

* eventType

* createdAt

### 10.6 ModerationLog

Representa o rastro administrativo de ações de moderação.

Atributos mínimos:

* id

* actorUserId

* targetType

* targetId

* action

* reason opcional

* createdAt

---

## 11. Modelo de Segurança

### 11.1 Autenticação

* o acesso autenticado deve ocorrer por login com CPF e senha

* somente usuários com estado `APPROVED` podem receber token JWT

* o JWT deve representar apenas autenticação e sessão

### 11.2 Armazenamento de senha

* a senha nunca deve ser persistida em texto puro

* a senha deve ser armazenada com hash seguro usando bcrypt ou equivalente

### 11.3 Autorização

* a autorização deve seguir RBAC com base nos papéis formais do sistema

* verificações de autoria devem ser aplicadas em salas e mensagens

* verificações administrativas devem prevalecer em ações de moderação

### 11.4 Validação e proteção básica

* entradas do usuário devem ser validadas no backend

* mensagens vazias devem ser rejeitadas

* o sistema deve impedir operações sobre recursos inexistentes ou indisponíveis

---

## 12. Comunicação em Tempo Real

### 12.1 Canal de tempo real

O sistema deve suportar comunicação em tempo real via WebSocket na versão 1.

### 12.2 Eventos mínimos de tempo real

Eventos mínimos esperados:

* nova mensagem em sala

* edição de mensagem

* remoção de mensagem

* entrada de participante em sala

* atualização operacional de sala quando aplicável

### 12.3 Regras operacionais

* somente usuários autenticados e autorizados podem estabelecer interação de tempo real compatível com sua sessão

* eventos recebidos em tempo real devem respeitar o estado da sala e as permissões do usuário

* a persistência em banco continua sendo obrigatória mesmo com comunicação em tempo real
