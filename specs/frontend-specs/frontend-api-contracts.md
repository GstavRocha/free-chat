# frontend-api-contracts.md

## Frontend API Contracts — Free Chat Maker

**Versão:** 0.1.0  
**Status:** Draft  
**Derivado de:** `specs.md`, `frontend-spec.md`, `frontend-use-case.md`, `frontend-routes.md`, `frontend-state-model.md`, `frontend-implementation-plan.md`, contratos reais do backend

---

## 1. Objetivo

Este documento define os contratos de comunicação entre frontend e backend do **Free Chat Maker**.

Ele busca estabelecer:

* endpoints realmente consumidos pelo frontend
* formato atual das respostas HTTP
* formato atual dos erros HTTP
* contrato atual do WebSocket
* códigos de erro relevantes para a UI
* mapeamento entre respostas e domínios de estado do frontend

Este documento não inventa uma API nova. Ele deve refletir o backend real.

---

## 2. Regra de precedência entre artefatos

Em caso de conflito entre documentos, a precedência obrigatória é:

1. `specs.md`
2. backend implementado
3. `frontend-spec.md`
4. `frontend-use-case.md`
5. `frontend-routes.md`
6. `frontend-state-model.md`
7. `frontend-implementation-plan.md`
8. `frontend-api-contracts.md`

Se houver divergência entre este documento e o backend real, o backend prevalece e este artefato deve ser atualizado.

---

## 3. Convenções gerais

### 3.1 Base HTTP atual

```text
/api
```

Rotas reais atuais:

* `/api/auth`
* `/api/salas`
* `/api/mensagens`
* `/api/solicitacoes-cadastro`
* `/api/usuarios`
* `/api/logs-moderacao`

### 3.2 Headers autenticados

```http
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

### 3.3 Formato atual de sucesso HTTP

O backend não usa um envelope único com `success` e `data`.

As respostas de sucesso atuais variam por recurso, por exemplo:

```json
{
  "salas": []
}
```

```json
{
  "sala": {}
}
```

```json
{
  "mensagem": {}
}
```

```json
{
  "solicitacao": {}
}
```

```json
{
  "usuario": {}
}
```

O frontend deve adaptar cada resposta por recurso, e não assumir um envelope padronizado inexistente.

### 3.4 Formato atual de erro HTTP

O middleware global de erro retorna:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem legível",
    "details": {}
  }
}
```

O frontend deve sempre ler:

* `error.code`
* `error.message`
* `error.details`

### 3.5 Formato atual do WebSocket

Mensagens WebSocket usam:

```json
{
  "tipo": "NOME_DO_EVENTO",
  "dados": {}
}
```

Erros WebSocket usam:

```json
{
  "tipo": "ERRO",
  "dados": {
    "code": "WS_ERROR",
    "message": "Mensagem legível",
    "details": {}
  }
}
```

---

## 4. Autenticação

### 4.1 Login

**Request**

`POST /api/auth/login`

Payload:

```json
{
  "cpf": "string",
  "senha": "string"
}
```

**Success response**

O shape vem do service de autenticação e deve ser consumido como contrato do backend. O frontend deve esperar, no mínimo:

```json
{
  "token": "JWT",
  "usuario": {
    "id": "uuid",
    "nomeCompleto": "string",
    "papel": "ADMIN",
    "status": "APROVADO"
  }
}
```

Campos adicionais retornados pelo backend devem ser tratados de forma tolerante.

**Erros relevantes**

* `INVALID_LOGIN_PAYLOAD`
* `INVALID_CREDENTIALS`
* `USER_PENDING_APPROVAL`
* `USER_REJECTED`
* `USER_BLOCKED`
* `USER_STATUS_INVALID`

**Mapeamento sugerido para frontend**

* `INVALID_CREDENTIALS` -> erro no `LoginForm`
* `USER_PENDING_APPROVAL` -> `AuthState = PENDENTE_APROVACAO`
* `USER_REJECTED` -> `AuthState = REJEITADO`
* `USER_BLOCKED` -> `AuthState = BLOQUEADO`

### 4.2 Sessão autenticada atual

`GET /api/auth/me`

Success:

```json
{
  "usuario": {}
}
```

Uso no frontend:

* restaurar sessão persistida
* validar token ainda utilizável
* reconstruir `authStore`

### 4.3 Logout

Não há endpoint obrigatório de logout no backend atual.

O logout do frontend deve:

* limpar token local
* limpar stores relacionadas
* encerrar conexões WebSocket do contexto autenticado
* redirecionar para `/login`

---

## 5. Solicitação de cadastro

### 5.1 Criar solicitação

`POST /api/solicitacoes-cadastro`

Payload mínimo:

```json
{
  "nome": "string",
  "cpf": "string",
  "senha": "string",
  "papel": "ALUNO"
}
```

Campos complementares variam conforme o papel:

* `ALUNO` -> `serie`, `turma`
* `PROFESSOR` -> `departamento`
* `FUNCIONARIO` -> `setor`

Success:

```json
{
  "solicitacao": {
    "id": "uuid",
    "status": "PENDENTE"
  }
}
```

Erros relevantes:

* `INVALID_SIGNUP_REQUEST_PAYLOAD`
* `INVALID_USER_ROLE`
* `CPF_ALREADY_REGISTERED`

Mapeamento sugerido:

* `CPF_ALREADY_REGISTERED` -> `RegistrationRequestState = CPF_DUPLICADO`
* `INVALID_SIGNUP_REQUEST_PAYLOAD` -> erro por validação/payload

### 5.2 Listar solicitações pendentes

`GET /api/solicitacoes-cadastro`

Autorização:

* apenas `ADMIN`

Success:

```json
{
  "solicitacoes": []
}
```

### 5.3 Aprovar solicitação

`PATCH /api/solicitacoes-cadastro/:id/aprovar`

Autorização:

* apenas `ADMIN`

Success:

```json
{
  "solicitacao": {},
  "usuario": {}
}
```

O frontend deve tratar o resultado de forma tolerante, usando os objetos que vierem do backend.

Erros relevantes:

* `SIGNUP_REQUEST_NOT_FOUND`
* `SIGNUP_REQUEST_ALREADY_REVIEWED`
* `SIGNUP_REQUEST_ALREADY_MATERIALIZED`

### 5.4 Rejeitar solicitação

`PATCH /api/solicitacoes-cadastro/:id/rejeitar`

Payload:

```json
{
  "motivo": "string"
}
```

Erros relevantes:

* `INVALID_SIGNUP_REJECTION_PAYLOAD`
* `SIGNUP_REQUEST_NOT_FOUND`
* `SIGNUP_REQUEST_ALREADY_REVIEWED`

---

## 6. Salas

### 6.1 Listar salas

`GET /api/salas`

Success:

```json
{
  "salas": []
}
```

Uso no frontend:

* popular `RoomsListState`
* tratar lista vazia como estado `empty`

### 6.2 Buscar detalhes da sala

`GET /api/salas/:id`

Success:

```json
{
  "sala": {}
}
```

Erros relevantes:

* `ROOM_NOT_FOUND`
* `ROOM_UNAVAILABLE`

### 6.3 Criar sala

`POST /api/salas`

Payload:

```json
{
  "nome": "string",
  "descricao": "string"
}
```

Success:

```json
{
  "sala": {}
}
```

Erros relevantes:

* `INVALID_ROOM_PAYLOAD`
* `ROOM_NAME_REQUIRED`
* `AUTH_USER_NOT_FOUND`

### 6.4 Editar sala

`PATCH /api/salas/:id`

Payload permitido atualmente:

```json
{
  "nome": "string",
  "descricao": "string"
}
```

Erros relevantes:

* `INVALID_ROOM_UPDATE_PAYLOAD`
* `ROOM_NOT_FOUND`
* `ROOM_EDIT_FORBIDDEN`
* `ROOM_DELETED`
* `ROOM_UPDATE_EMPTY`
* `ROOM_NAME_REQUIRED`

### 6.5 Excluir sala logicamente

`PATCH /api/salas/:id/excluir`

Payload opcional:

```json
{
  "motivo": "string"
}
```

Erros relevantes:

* `ROOM_NOT_FOUND`
* `ROOM_DELETE_FORBIDDEN`
* `ROOM_ALREADY_DELETED`
* `ROOM_DELETE_REASON_REQUIRED`

### 6.6 Entrada e saída HTTP da sala

Embora a experiência principal use WebSocket, o backend também expõe:

* `POST /api/salas/:id/entrar`
* `POST /api/salas/:id/sair`

Esses endpoints retornam o resultado do service de participação e podem ser usados pelo frontend em fallback, auditoria ou bootstrap controlado.

---

## 7. Mensagens

### 7.1 Histórico da sala

`GET /api/salas/:id/mensagens`

Success:

```json
{
  "mensagens": []
}
```

Erros relevantes:

* `ROOM_NOT_FOUND`
* `ROOM_HISTORY_UNAVAILABLE`
* `ROOM_ENTRY_REQUIRED`

### 7.2 Criar mensagem por HTTP

`POST /api/salas/:id/mensagens`

Payload:

```json
{
  "conteudo": "texto",
  "tipoMensagem": "TEXTO"
}
```

Success:

```json
{
  "mensagem": {}
}
```

Erros relevantes:

* `INVALID_MESSAGE_PAYLOAD`
* `MESSAGE_CONTENT_REQUIRED`
* `INVALID_MESSAGE_TYPE`
* `MESSAGE_TYPE_NOT_ALLOWED`
* `ROOM_NOT_FOUND`
* `ROOM_MESSAGE_UNAVAILABLE`
* `ROOM_ENTRY_REQUIRED`

Observação:

* `ROOM_MESSAGE_UNAVAILABLE` cobre indisponibilidade da sala, incluindo sala `SILENCIADA`

### 7.3 Editar mensagem

`PATCH /api/mensagens/:id`

Payload:

```json
{
  "conteudo": "novo texto"
}
```

Success:

```json
{
  "mensagem": {}
}
```

Erros relevantes:

* `INVALID_MESSAGE_UPDATE_PAYLOAD`
* `MESSAGE_CONTENT_REQUIRED`
* `MESSAGE_NOT_FOUND`
* `MESSAGE_DELETED`
* `MESSAGE_EDIT_FORBIDDEN`

### 7.4 Remover mensagem logicamente

`PATCH /api/mensagens/:id/excluir`

Success:

```json
{
  "mensagem": {}
}
```

Erros relevantes:

* `MESSAGE_NOT_FOUND`
* `MESSAGE_ALREADY_DELETED`
* `MESSAGE_DELETE_FORBIDDEN`

---

## 8. Usuários administrativos

### 8.1 Listar usuários

`GET /api/usuarios`

Autorização:

* apenas `ADMIN`

Success:

```json
{
  "usuarios": []
}
```

### 8.2 Buscar usuário administrativo por id

`GET /api/usuarios/:id`

Success:

```json
{
  "usuario": {}
}
```

### 8.3 Atualizar status do usuário

`PATCH /api/usuarios/:id/status`

Payload:

```json
{
  "status": "BLOQUEADO",
  "motivo": "string"
}
```

Erros relevantes:

* `INVALID_USER_STATUS_PAYLOAD`
* `USER_NOT_FOUND`
* `INVALID_USER_STATUS`
* `INVALID_SELF_BLOCK`
* `USER_BLOCK_REASON_REQUIRED`

Observação:

* este fluxo existe no backend, mas o frontend consolidado atual ainda prioriza painel administrativo simplificado

---

## 9. WebSocket

### 9.1 Endpoint

```text
/ws
```

### 9.2 Autenticação

O socket é autenticado na conexão.

Após sucesso, o backend envia:

```json
{
  "tipo": "CONEXAO_AUTENTICADA",
  "dados": {
    "userId": "uuid",
    "papel": "ALUNO",
    "status": "APROVADO"
  }
}
```

### 9.3 Eventos enviados pelo cliente

#### Entrar em sala

```json
{
  "tipo": "ENTRAR_SALA",
  "dados": {
    "salaId": "uuid"
  }
}
```

#### Sair da sala

```json
{
  "tipo": "SAIR_SALA",
  "dados": {
    "salaId": "uuid"
  }
}
```

O `salaId` também pode ser omitido se o socket já estiver associado a uma sala atual.

#### Enviar mensagem

```json
{
  "tipo": "ENVIAR_MENSAGEM",
  "dados": {
    "salaId": "uuid",
    "conteudo": "texto",
    "tipoMensagem": "TEXTO"
  }
}
```

### 9.4 Eventos recebidos do servidor

#### Entrada confirmada

```json
{
  "tipo": "ENTRADA_SALA_CONFIRMADA",
  "dados": {
    "evento": {},
    "sala": {},
    "participante": {}
  }
}
```

#### Saída confirmada

```json
{
  "tipo": "SAIDA_SALA_CONFIRMADA",
  "dados": {
    "evento": {},
    "sala": {},
    "participante": {}
  }
}
```

#### Participante entrou

```json
{
  "tipo": "PARTICIPANTE_ENTROU",
  "dados": {
    "evento": {},
    "sala": {},
    "participante": {}
  }
}
```

#### Participante saiu

```json
{
  "tipo": "PARTICIPANTE_SAIU",
  "dados": {
    "evento": {},
    "sala": {},
    "participante": {}
  }
}
```

#### Mensagem criada

```json
{
  "tipo": "MENSAGEM_CRIADA",
  "dados": {
    "mensagem": {}
  }
}
```

#### Mensagem atualizada

```json
{
  "tipo": "MENSAGEM_ATUALIZADA",
  "dados": {
    "mensagem": {}
  }
}
```

#### Mensagem removida

```json
{
  "tipo": "MENSAGEM_REMOVIDA",
  "dados": {
    "mensagem": {}
  }
}
```

#### Erro de canal

```json
{
  "tipo": "ERRO",
  "dados": {
    "code": "WS_ERROR",
    "message": "Mensagem legível",
    "details": {}
  }
}
```

### 9.5 Códigos de erro WebSocket relevantes

* `WS_INVALID_PAYLOAD`
* `WS_EXIT_ROOM_ID_REQUIRED`
* `WS_ROOM_ID_REQUIRED`
* `WS_EVENT_NOT_SUPPORTED`
* `ROOM_MESSAGE_UNAVAILABLE`
* `ROOM_ENTRY_REQUIRED`

---

## 10. Mapeamento sugerido endpoint -> domínio de estado

| Recurso | Domínio principal de estado |
| --- | --- |
| `POST /api/auth/login` | `AuthState` |
| `GET /api/auth/me` | `AuthState` + `ApplicationBootState` |
| `POST /api/solicitacoes-cadastro` | `RegistrationRequestState` |
| `GET /api/salas` | `RoomsListState` |
| `GET /api/salas/:id` | `ActiveRoomState` |
| `GET /api/salas/:id/mensagens` | `MessageListState` |
| `POST /api/salas/:id/mensagens` | `MessageComposerState` + `MessageListState` |
| `PATCH /api/mensagens/:id` | `MessageListState` |
| `PATCH /api/mensagens/:id/excluir` | `MessageListState` |
| `GET /api/solicitacoes-cadastro` | `AdminPanelState` |
| `PATCH /api/solicitacoes-cadastro/:id/aprovar` | `AdminPanelState` |
| `PATCH /api/solicitacoes-cadastro/:id/rejeitar` | `AdminPanelState` |
| WebSocket `/ws` | `RealtimeConnectionState`, `ParticipantEventsState`, `MessageListState` |

---

## 11. Estrutura recomendada da camada de API

```text
src/services/api/
  authApi.ts
  solicitacoesCadastroApi.ts
  salasApi.ts
  mensagensApi.ts
  usuariosApi.ts
  websocketClient.ts
```

### 11.1 Recomendação importante

O frontend deve criar adaptadores finos por recurso para converter o contrato atual do backend em modelos internos do frontend.

Exemplo conceitual:

```ts
export async function listSalas() {
  const response = await api.get("/api/salas");
  return response.data.salas;
}
```

---

## 12. Estratégia de interceptação HTTP

### 12.1 401 e falhas de autenticação

Quando o contrato retornar falhas como:

* `AUTH_REQUIRED`
* `AUTH_TOKEN_MISSING`
* `AUTH_TOKEN_INVALID_FORMAT`
* `AUTH_TOKEN_INVALID`

o frontend deve:

* limpar sessão local
* marcar `AuthState` como expirado ou não autenticado
* redirecionar para `/login`

### 12.2 403 e acesso negado

Quando o contrato retornar:

* `FORBIDDEN`
* `AUTH_USER_NOT_APPROVED`

o frontend deve:

* bloquear acesso à rota protegida
* redirecionar conforme regra de guarda adotada

---

## 13. Critério de pronto

Este documento está adequado quando:

* todo endpoint usado pelo frontend reflete a API real
* erros relevantes estão previstos
* stores sabem o que esperar de cada recurso
* o frontend pode ser implementado sem inventar payloads
* HTTP e WebSocket falam a mesma linguagem do backend atual
