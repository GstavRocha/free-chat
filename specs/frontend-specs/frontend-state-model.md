# frontend-state-model.md

## Frontend State Model — Free Chat Maker

**Versão:** 0.1.0  
**Status:** Draft  
**Derivado de:** `specs.md`, `frontend-spec.md`, `frontend-use-case.md`, `frontend-screens.md`, `frontend-routes.md`

---

## 1. Objetivo do documento

Este documento define o modelo de estado do frontend do **Free Chat Maker**, descrevendo:

* estados globais da aplicação
* estados por domínio funcional
* transições principais
* eventos que alteram a interface
* dependências entre estados
* comportamento esperado da UI diante desses estados

Este artefato deve orientar:

* stores
* composables
* guards de navegação
* renderização condicional
* tratamento de erro
* reconexão em tempo real

---

## 2. Regra de precedência entre artefatos

Em caso de conflito entre documentos, a precedência obrigatória é:

1. `specs.md`
2. `frontend-spec.md`
3. `frontend-use-case.md`
4. `frontend-screens.md`
5. `frontend-routes.md`
6. `frontend-state-model.md`

Este documento não define regra de negócio nova. Ele modela o estado operacional necessário para que a interface expresse corretamente os artefatos superiores.

---

## 3. Princípios do modelo de estado

### 3.1 Estado antes de componente

O frontend não deve ser modelado a partir de componentes visuais, mas a partir dos estados do sistema.

### 3.2 Estado explícito

Todo comportamento importante da interface deve estar associado a um estado nomeado e previsível.

### 3.3 Transição controlada

Mudanças de estado devem acontecer por eventos claros:

* ação do usuário
* resposta HTTP
* evento WebSocket
* expiração de sessão
* erro operacional
* navegação protegida

### 3.4 Backend como fonte de verdade

O frontend mantém estado operacional, mas a verdade final sobre autenticação, autorização, recursos e transições de negócio pertence ao backend.

---

## 4. Visão geral dos domínios de estado

O frontend da versão 1 deve tratar, no mínimo:

* inicialização da aplicação
* autenticação e sessão
* solicitação de cadastro
* navegação e guardas
* listagem de salas
* sala ativa
* histórico e mensagens
* conexão em tempo real
* administração
* feedback global de interface

---

## 5. Estado global da aplicação

### 5.1 ApplicationBootState

Representa o estado de inicialização do frontend.

#### Estados possíveis

* `BOOTING`
* `READY`
* `BOOT_ERROR`

#### Uso

Esse estado cobre:

* leitura de sessão persistida
* restauração inicial do usuário
* preparação base do router
* avaliação inicial das guardas de navegação
* preparação do canal de tempo real, quando aplicável

#### Transições principais

* `BOOTING` → `READY`
* `BOOTING` → `BOOT_ERROR`

---

## 6. Estado de autenticação e sessão

### 6.1 AuthState

Representa o ciclo de autenticação do usuário.

#### Estados possíveis

* `NAO_AUTENTICADO`
* `AUTENTICANDO`
* `AUTENTICADO`
* `PENDENTE_APROVACAO`
* `REJEITADO`
* `BLOQUEADO`
* `SESSAO_EXPIRADA`
* `ERRO_AUTENTICACAO`

#### Dados mínimos associados

```ts
interface AuthContext {
  status:
    | "NAO_AUTENTICADO"
    | "AUTENTICANDO"
    | "AUTENTICADO"
    | "PENDENTE_APROVACAO"
    | "REJEITADO"
    | "BLOQUEADO"
    | "SESSAO_EXPIRADA"
    | "ERRO_AUTENTICACAO";
  token: string | null;
  user: AuthenticatedUser | null;
  errorMessage: string | null;
}
```

#### Observação de modelagem

`AuthenticatedUser` representa um modelo de estado do frontend derivado do contrato do backend, e não uma nova entidade de domínio.

#### Eventos principais

* `APP_STARTED`
* `LOGIN_REQUESTED`
* `LOGIN_SUCCEEDED`
* `LOGIN_FAILED`
* `LOGIN_STATUS_PENDING`
* `LOGIN_STATUS_REJECTED`
* `LOGIN_STATUS_BLOCKED`
* `LOGOUT_REQUESTED`
* `SESSION_EXPIRED_DETECTED`

#### Transições principais

* `NAO_AUTENTICADO` → `AUTENTICANDO`
* `AUTENTICANDO` → `AUTENTICADO`
* `AUTENTICANDO` → `PENDENTE_APROVACAO`
* `AUTENTICANDO` → `REJEITADO`
* `AUTENTICANDO` → `BLOQUEADO`
* `AUTENTICANDO` → `ERRO_AUTENTICACAO`
* `AUTENTICADO` → `SESSAO_EXPIRADA`
* `AUTENTICADO` → `NAO_AUTENTICADO`

#### Regras de UI

* `AUTENTICADO`: libera rotas protegidas
* `PENDENTE_APROVACAO`: exibe feedback e bloqueia área autenticada
* `REJEITADO`: exibe feedback e bloqueia área autenticada
* `BLOQUEADO`: exibe feedback e bloqueia área autenticada
* `SESSAO_EXPIRADA`: limpa contexto e redireciona para login

---

## 7. Estado da solicitação de cadastro

### 7.1 RegistrationRequestState

Representa o ciclo do formulário de solicitação de cadastro.

#### Estados possíveis

* `IDLE`
* `EDITANDO`
* `VALIDANDO`
* `ENVIANDO`
* `SUCESSO`
* `ERRO_VALIDACAO`
* `CPF_DUPLICADO`
* `ERRO_SUBMISSAO`

#### Dados mínimos associados

```ts
interface RegistrationRequestContext {
  status:
    | "IDLE"
    | "EDITANDO"
    | "VALIDANDO"
    | "ENVIANDO"
    | "SUCESSO"
    | "ERRO_VALIDACAO"
    | "CPF_DUPLICADO"
    | "ERRO_SUBMISSAO";
  formData: {
    nomeCompleto: string;
    cpf: string;
    senha: string;
    papel: "ALUNO" | "PROFESSOR" | "FUNCIONARIO" | "";
    serie?: string;
    turma?: string;
    departamento?: string;
    setor?: string;
  };
  errors: Record<string, string>;
}
```

#### Eventos principais

* `REGISTRATION_FORM_OPENED`
* `REGISTRATION_FIELD_CHANGED`
* `REGISTRATION_SUBMIT_REQUESTED`
* `REGISTRATION_VALIDATION_FAILED`
* `REGISTRATION_DUPLICATE_CPF`
* `REGISTRATION_SUBMIT_SUCCEEDED`
* `REGISTRATION_SUBMIT_FAILED`

#### Transições principais

* `IDLE` → `EDITANDO`
* `EDITANDO` → `VALIDANDO`
* `VALIDANDO` → `ENVIANDO`
* `VALIDANDO` → `ERRO_VALIDACAO`
* `ENVIANDO` → `SUCESSO`
* `ENVIANDO` → `CPF_DUPLICADO`
* `ENVIANDO` → `ERRO_SUBMISSAO`

#### Regras de UI

* campos condicionais devem depender do papel
* estado `SUCESSO` deve informar cadastro pendente
* estado `ERRO_VALIDACAO` deve manter o formulário preenchido

---

## 8. Estado de navegação e guardas

### 8.1 RouteAccessState

Representa a decisão de navegação em rotas públicas, protegidas e administrativas.

#### Estados possíveis

* `CHECKING_ACCESS`
* `ACCESS_GRANTED`
* `REDIRECT_TO_LOGIN`
* `REDIRECT_TO_ROOMS`
* `REDIRECT_TO_ENTRY`
* `REDIRECT_FORBIDDEN`

#### Dados mínimos associados

```ts
interface RouteAccessContext {
  currentPath: string;
  targetPath: string;
  requiredAccess: "PUBLIC" | "AUTHENTICATED" | "ADMIN";
  decision:
    | "CHECKING_ACCESS"
    | "ACCESS_GRANTED"
    | "REDIRECT_TO_LOGIN"
    | "REDIRECT_TO_ROOMS"
    | "REDIRECT_TO_ENTRY"
    | "REDIRECT_FORBIDDEN";
}
```

#### Eventos principais

* `ROUTE_NAVIGATION_REQUESTED`
* `PUBLIC_ROUTE_EVALUATED`
* `AUTH_ROUTE_EVALUATED`
* `ADMIN_ROUTE_EVALUATED`
* `FALLBACK_ROUTE_TRIGGERED`

#### Regras de UI

* rotas públicas devem redirecionar usuários autenticados para `/salas`
* rotas protegidas devem redirecionar usuários sem sessão para `/login`
* rotas administrativas devem redirecionar usuários sem papel `ADMIN` para `/salas`

---

## 9. Estado de carregamento das salas

### 9.1 RoomsListState

Representa o carregamento e exibição da listagem de salas.

#### Estados possíveis

* `IDLE`
* `LOADING`
* `SUCCESS`
* `EMPTY`
* `ERROR`

#### Dados mínimos associados

```ts
interface RoomsListContext {
  status: "IDLE" | "LOADING" | "SUCCESS" | "EMPTY" | "ERROR";
  rooms: RoomSummary[];
  errorMessage: string | null;
}
```

#### Observação de modelagem

`RoomSummary` representa uma projeção de frontend derivada da sala retornada pelo backend.

#### Eventos principais

* `ROOMS_FETCH_REQUESTED`
* `ROOMS_FETCH_SUCCEEDED`
* `ROOMS_FETCH_EMPTY`
* `ROOMS_FETCH_FAILED`
* `ROOMS_REFRESH_REQUESTED`

#### Transições principais

* `IDLE` → `LOADING`
* `LOADING` → `SUCCESS`
* `LOADING` → `EMPTY`
* `LOADING` → `ERROR`
* `SUCCESS` → `LOADING`

#### Regras de UI

* salas `EXCLUIDA` não entram na listagem padrão
* salas `SILENCIADA` devem aparecer com restrição visual
* salas `ATIVA` exibem CTA principal de entrada

---

## 10. Estado da sala ativa

### 10.1 ActiveRoomState

Representa o ciclo de vida da visualização de uma sala específica.

#### Estados possíveis

* `IDLE`
* `LOADING_ROOM`
* `ROOM_READY`
* `ROOM_UNAVAILABLE`
* `ACCESS_DENIED`
* `ROOM_NOT_FOUND`
* `ERROR`

#### Dados mínimos associados

```ts
interface ActiveRoomContext {
  status:
    | "IDLE"
    | "LOADING_ROOM"
    | "ROOM_READY"
    | "ROOM_UNAVAILABLE"
    | "ACCESS_DENIED"
    | "ROOM_NOT_FOUND"
    | "ERROR";
  room: RoomDetails | null;
  errorMessage: string | null;
}
```

#### Observação de modelagem

`RoomDetails` representa uma projeção de frontend derivada do recurso de sala retornado pelo backend.

#### Eventos principais

* `ROOM_OPEN_REQUESTED`
* `ROOM_FETCH_SUCCEEDED`
* `ROOM_FETCH_NOT_FOUND`
* `ROOM_FETCH_UNAVAILABLE`
* `ROOM_FETCH_ACCESS_DENIED`
* `ROOM_FETCH_FAILED`

#### Transições principais

* `IDLE` → `LOADING_ROOM`
* `LOADING_ROOM` → `ROOM_READY`
* `LOADING_ROOM` → `ROOM_NOT_FOUND`
* `LOADING_ROOM` → `ROOM_UNAVAILABLE`
* `LOADING_ROOM` → `ACCESS_DENIED`
* `LOADING_ROOM` → `ERROR`

#### Regras de UI

* apenas salas `ATIVA` devem permitir experiência normal de chat
* `ROOM_UNAVAILABLE` deve impedir compositor de mensagem
* `ACCESS_DENIED` deve bloquear interação
* `ROOM_NOT_FOUND` deve exibir estado específico

---

## 11. Estado do histórico e das mensagens

### 11.1 MessageListState

Representa o carregamento e manutenção da lista de mensagens da sala.

#### Estados possíveis

* `IDLE`
* `LOADING_HISTORY`
* `READY`
* `EMPTY`
* `ERROR`

#### Dados mínimos associados

```ts
interface MessageListContext {
  status: "IDLE" | "LOADING_HISTORY" | "READY" | "EMPTY" | "ERROR";
  messages: RoomMessage[];
  errorMessage: string | null;
}
```

#### Observação de modelagem

`RoomMessage` representa uma projeção de frontend derivada das mensagens retornadas pelo backend e pelos eventos WebSocket.

#### Eventos principais

* `MESSAGE_HISTORY_REQUESTED`
* `MESSAGE_HISTORY_SUCCEEDED`
* `MESSAGE_HISTORY_EMPTY`
* `MESSAGE_HISTORY_FAILED`
* `MESSAGE_CREATED_RECEIVED`
* `MESSAGE_UPDATED_RECEIVED`
* `MESSAGE_REMOVED_RECEIVED`

#### Regras de UI

* mensagens devem permanecer ordenadas cronologicamente
* mensagens removidas devem refletir a política visual definida pela interface
* atualizações WebSocket devem sincronizar a lista sem quebrar a ordem lógica

### 11.2 MessageComposerState

Representa o estado do compositor de mensagem.

#### Estados possíveis

* `IDLE`
* `EDITANDO`
* `ENVIANDO`
* `ERRO_ENVIO`
* `BLOQUEADO`

#### Dados mínimos associados

```ts
interface MessageComposerContext {
  status: "IDLE" | "EDITANDO" | "ENVIANDO" | "ERRO_ENVIO" | "BLOQUEADO";
  draft: string;
  errorMessage: string | null;
}
```

#### Eventos principais

* `MESSAGE_DRAFT_CHANGED`
* `MESSAGE_SEND_REQUESTED`
* `MESSAGE_SEND_SUCCEEDED`
* `MESSAGE_SEND_FAILED`
* `MESSAGE_SEND_BLOCKED`

#### Regras de UI

* não permitir mensagem vazia ou com apenas espaços
* compositor deve entrar em `BLOQUEADO` se a sala não aceitar novas mensagens
* em falha de envio, preservar o texto digitado

---

## 12. Estado da conexão em tempo real

### 12.1 RealtimeConnectionState

Representa o estado do canal WebSocket.

#### Estados possíveis

* `DISCONNECTED`
* `CONNECTING`
* `CONNECTED`
* `RECONNECTING`
* `CONNECTION_ERROR`

#### Dados mínimos associados

```ts
interface RealtimeConnectionContext {
  status:
    | "DISCONNECTED"
    | "CONNECTING"
    | "CONNECTED"
    | "RECONNECTING"
    | "CONNECTION_ERROR";
  currentRoomId: string | null;
  lastErrorMessage: string | null;
}
```

#### Eventos principais

* `WS_CONNECT_REQUESTED`
* `WS_CONNECTED`
* `WS_CONNECTION_FAILED`
* `WS_DISCONNECTED`
* `WS_RECONNECT_REQUESTED`
* `WS_ERROR_RECEIVED`
* `WS_AUTHENTICATED`
* `WS_ROOM_ENTER_CONFIRMED`
* `WS_ROOM_EXIT_CONFIRMED`

#### Regras de UI

* `CONNECTED` permite fluxo normal de tempo real
* `RECONNECTING` deve manter banner de instabilidade visível
* `CONNECTION_ERROR` deve refletir falha técnica e possibilidade de nova tentativa

---

## 13. Estado de eventos de participação

### 13.1 ParticipantEventsState

Representa os eventos de entrada e saída percebidos visualmente dentro da sala.

#### Estados possíveis

* `IDLE`
* `TRACKING`
* `ERROR`

#### Dados mínimos associados

```ts
interface ParticipantEventsContext {
  status: "IDLE" | "TRACKING" | "ERROR";
  events: RoomParticipantEvent[];
  errorMessage: string | null;
}
```

#### Observação de modelagem

`RoomParticipantEvent` representa uma projeção de frontend derivada dos eventos `PARTICIPANTE_ENTROU` e `PARTICIPANTE_SAIU`.

#### Eventos principais

* `PARTICIPANT_EVENT_RECEIVED`
* `PARTICIPANT_EVENT_IGNORED`
* `PARTICIPANT_EVENT_RENDER_FAILED`

#### Regras de UI

* eventos inconsistentes podem ser ignorados sem quebrar a tela
* a exibição deve ser contextual à sala ativa

---

## 14. Estado administrativo

### 14.1 AdminPanelState

Representa o estado operacional do painel administrativo simplificado.

#### Estados possíveis

* `IDLE`
* `LOADING`
* `READY`
* `EMPTY`
* `ERROR`
* `SUBMITTING_ACTION`

#### Dados mínimos associados

```ts
interface AdminPanelContext {
  status: "IDLE" | "LOADING" | "READY" | "EMPTY" | "ERROR" | "SUBMITTING_ACTION";
  pendingRequests: RegistrationRequestSummary[];
  errorMessage: string | null;
}
```

#### Observação de modelagem

`RegistrationRequestSummary` representa uma projeção de frontend das solicitações de cadastro exibidas ao administrador.

#### Eventos principais

* `ADMIN_PANEL_OPENED`
* `PENDING_REQUESTS_FETCH_REQUESTED`
* `PENDING_REQUESTS_FETCH_SUCCEEDED`
* `PENDING_REQUESTS_FETCH_EMPTY`
* `PENDING_REQUESTS_FETCH_FAILED`
* `ADMIN_APPROVAL_REQUESTED`
* `ADMIN_REJECTION_REQUESTED`
* `ADMIN_ACTION_SUCCEEDED`
* `ADMIN_ACTION_FAILED`

#### Regras de UI

* painel só deve existir para `ADMIN`
* estados vazios devem ser tratados explicitamente
* ações administrativas devem refletir loading e resultado

---

## 15. Estado de feedback global

### 15.1 GlobalFeedbackState

Representa mensagens de feedback transversais à interface.

#### Estados possíveis

* `IDLE`
* `INFO_VISIBLE`
* `SUCCESS_VISIBLE`
* `WARNING_VISIBLE`
* `ERROR_VISIBLE`

#### Dados mínimos associados

```ts
interface GlobalFeedbackContext {
  status:
    | "IDLE"
    | "INFO_VISIBLE"
    | "SUCCESS_VISIBLE"
    | "WARNING_VISIBLE"
    | "ERROR_VISIBLE";
  message: string | null;
}
```

#### Eventos principais

* `GLOBAL_INFO_TRIGGERED`
* `GLOBAL_SUCCESS_TRIGGERED`
* `GLOBAL_WARNING_TRIGGERED`
* `GLOBAL_ERROR_TRIGGERED`
* `GLOBAL_FEEDBACK_DISMISSED`

#### Regras de UI

* feedback global não substitui estados específicos das telas
* deve existir canal visual consistente para erros e confirmações transversais

---

## 16. Critérios de consistência

Um estado descrito neste documento deve:

* corresponder a uma necessidade real de interface
* derivar de fluxos e telas previamente definidos
* respeitar os perfis e permissões do sistema
* não contradizer guardas e rotas estabelecidas
* não criar regra de negócio nova
Claro. Aqui está o **`frontend-state-model.md`** em formato canônico, alinhado ao seu `frontend-spec.md` e à estrutura que você já vem montando. Ele formaliza os **estados da aplicação**, as **transições** e a **responsabilidade de cada domínio de estado** no frontend. 

---

# frontend-state-model.md

## Frontend State Model — Free Chat Maker

**Versão:** 0.1.0
**Status:** Draft
**Derivado de:** `frontend-spec.md` 

---

## 1. Objetivo

Este documento define o modelo de estado do frontend do **Free Chat Maker**, descrevendo os estados necessários para que a interface represente corretamente:

* autenticação e sessão
* solicitação de cadastro
* listagem de salas
* sala ativa
* mensagens
* ações administrativas
* conexão em tempo real
* feedback global de interface

O objetivo é garantir que o frontend seja construído como **expressão de estado**, e não apenas como um conjunto de telas isoladas. 

---

## 2. Princípios

### 2.1 Estado antes de componente

A interface deve ser derivada do estado da aplicação.

### 2.2 Estado explícito

Todo fluxo importante precisa ter estados nomeados e previsíveis.

### 2.3 Backend como fonte de verdade

O frontend controla a experiência, mas não substitui o backend em autenticação, autorização, validação e persistência. 

### 2.4 Transições dirigidas por evento

Os estados devem mudar por:

* ação do usuário
* resposta HTTP
* evento WebSocket
* expiração de sessão
* erro operacional

---

## 3. Domínios de estado

O frontend deve prever, no mínimo, os seguintes domínios:

* `app`
* `auth`
* `registration`
* `roomsList`
* `activeRoom`
* `messages`
* `messageComposer`
* `roomForm`
* `admin`
* `realtime`
* `feedback`

---

## 4. Estado global de aplicação

## 4.1 AppState

Representa o ciclo de inicialização da aplicação.

### Estados possíveis

* `BOOTING`
* `READY`
* `BOOT_ERROR`

### Responsabilidades

* restaurar sessão persistida
* preparar stores base
* validar contexto inicial
* iniciar infraestrutura mínima do app

### Transições principais

* `BOOTING -> READY`
* `BOOTING -> BOOT_ERROR`

### Estrutura sugerida

```ts
interface AppState {
  status: "BOOTING" | "READY" | "BOOT_ERROR";
  errorMessage: string | null;
}
```

---

## 5. Estado de autenticação

## 5.1 AuthState

Representa o ciclo de autenticação e sessão do usuário.

### Estados possíveis

* `NAO_AUTENTICADO`
* `AUTENTICANDO`
* `AUTENTICADO`
* `PENDENTE_APROVACAO`
* `REJEITADO`
* `BLOQUEADO`
* `SESSAO_EXPIRADA`
* `ERRO_AUTENTICACAO`

Esses estados seguem o frontend-spec, que já prevê estados específicos para autenticação e sessão. 

### Estrutura sugerida

```ts
interface AuthState {
  status:
    | "NAO_AUTENTICADO"
    | "AUTENTICANDO"
    | "AUTENTICADO"
    | "PENDENTE_APROVACAO"
    | "REJEITADO"
    | "BLOQUEADO"
    | "SESSAO_EXPIRADA"
    | "ERRO_AUTENTICACAO";
  token: string | null;
  user: {
    id: string;
    nome: string;
    papel: "ADMIN" | "ALUNO" | "PROFESSOR" | "FUNCIONARIO";
    status: "APROVADO" | "BLOQUEADO";
  } | null;
  errorMessage: string | null;
}
```

### Eventos principais

* `APP_STARTED`
* `LOGIN_REQUESTED`
* `LOGIN_SUCCEEDED`
* `LOGIN_FAILED`
* `LOGIN_PENDING`
* `LOGIN_REJECTED`
* `LOGIN_BLOCKED`
* `LOGOUT_REQUESTED`
* `SESSION_EXPIRED_DETECTED`

### Transições principais

* `NAO_AUTENTICADO -> AUTENTICANDO`
* `AUTENTICANDO -> AUTENTICADO`
* `AUTENTICANDO -> PENDENTE_APROVACAO`
* `AUTENTICANDO -> REJEITADO`
* `AUTENTICANDO -> BLOQUEADO`
* `AUTENTICANDO -> ERRO_AUTENTICACAO`
* `AUTENTICADO -> SESSAO_EXPIRADA`
* `AUTENTICADO -> NAO_AUTENTICADO`

### Regras de UI

* `AUTENTICADO` libera rotas protegidas
* `PENDENTE_APROVACAO`, `REJEITADO` e `BLOQUEADO` impedem acesso à área autenticada
* `SESSAO_EXPIRADA` deve limpar credenciais e redirecionar para login

---

## 6. Estado da solicitação de cadastro

## 6.1 RegistrationState

Representa o ciclo de solicitação de cadastro.

### Estados possíveis

* `IDLE`
* `EDITANDO`
* `VALIDANDO`
* `ENVIANDO`
* `SUCESSO`
* `ERRO_VALIDACAO`
* `CPF_DUPLICADO`
* `ERRO_SUBMISSAO`

### Estrutura sugerida

```ts
interface RegistrationState {
  status:
    | "IDLE"
    | "EDITANDO"
    | "VALIDANDO"
    | "ENVIANDO"
    | "SUCESSO"
    | "ERRO_VALIDACAO"
    | "CPF_DUPLICADO"
    | "ERRO_SUBMISSAO";
  formData: {
    nomeCompleto: string;
    cpf: string;
    senha: string;
    papel: "ALUNO" | "PROFESSOR" | "FUNCIONARIO" | "";
    serie?: string;
    turma?: string;
    departamento?: string;
    setor?: string;
  };
  errors: Record<string, string>;
  errorMessage: string | null;
}
```

### Eventos principais

* `REGISTRATION_STARTED`
* `REGISTRATION_FIELD_CHANGED`
* `REGISTRATION_SUBMIT_REQUESTED`
* `REGISTRATION_VALIDATION_FAILED`
* `REGISTRATION_DUPLICATE_CPF`
* `REGISTRATION_SUBMIT_SUCCEEDED`
* `REGISTRATION_SUBMIT_FAILED`

### Transições principais

* `IDLE -> EDITANDO`
* `EDITANDO -> VALIDANDO`
* `VALIDANDO -> ENVIANDO`
* `VALIDANDO -> ERRO_VALIDACAO`
* `ENVIANDO -> SUCESSO`
* `ENVIANDO -> CPF_DUPLICADO`
* `ENVIANDO -> ERRO_SUBMISSAO`

### Regras de UI

* campos condicionais dependem do papel
* em `SUCESSO`, a UI deve informar que o cadastro ficou pendente
* em erro, o formulário deve permanecer preenchido

---

## 7. Estado da listagem de salas

## 7.1 RoomsListState

Representa o carregamento e exibição das salas visíveis ao usuário autenticado.

### Estados possíveis

* `IDLE`
* `LOADING`
* `SUCCESS`
* `EMPTY`
* `ERROR`

### Estrutura sugerida

```ts
interface RoomsListState {
  status: "IDLE" | "LOADING" | "SUCCESS" | "EMPTY" | "ERROR";
  rooms: Array<{
    id: string;
    nome: string;
    descricao?: string;
    status: "ATIVA" | "SILENCIADA" | "EXCLUIDA";
    createdBy: string;
    updatedAt?: string;
  }>;
  errorMessage: string | null;
}
```

### Eventos principais

* `ROOMS_FETCH_REQUESTED`
* `ROOMS_FETCH_SUCCEEDED`
* `ROOMS_FETCH_EMPTY`
* `ROOMS_FETCH_FAILED`
* `ROOMS_REFRESH_REQUESTED`

### Transições principais

* `IDLE -> LOADING`
* `LOADING -> SUCCESS`
* `LOADING -> EMPTY`
* `LOADING -> ERROR`
* `SUCCESS -> LOADING`

### Regras de UI

* salas `EXCLUIDA` não aparecem na listagem padrão
* salas `SILENCIADA` aparecem com restrição visual
* salas `ATIVA` exibem CTA normal de entrada

---

## 8. Estado da sala ativa

## 8.1 ActiveRoomState

Representa o ciclo de carregamento e disponibilidade da sala atual.

### Estados possíveis

* `IDLE`
* `LOADING_ROOM`
* `ROOM_READY`
* `ROOM_UNAVAILABLE`
* `ROOM_NOT_FOUND`
* `ACCESS_DENIED`
* `ERROR`

### Estrutura sugerida

```ts
interface ActiveRoomState {
  status:
    | "IDLE"
    | "LOADING_ROOM"
    | "ROOM_READY"
    | "ROOM_UNAVAILABLE"
    | "ROOM_NOT_FOUND"
    | "ACCESS_DENIED"
    | "ERROR";
  room: {
    id: string;
    nome: string;
    descricao?: string;
    status: "ATIVA" | "SILENCIADA" | "EXCLUIDA";
    createdBy: string;
  } | null;
  errorMessage: string | null;
}
```

### Eventos principais

* `ROOM_OPEN_REQUESTED`
* `ROOM_FETCH_SUCCEEDED`
* `ROOM_FETCH_UNAVAILABLE`
* `ROOM_FETCH_NOT_FOUND`
* `ROOM_FETCH_ACCESS_DENIED`
* `ROOM_FETCH_FAILED`

### Transições principais

* `IDLE -> LOADING_ROOM`
* `LOADING_ROOM -> ROOM_READY`
* `LOADING_ROOM -> ROOM_UNAVAILABLE`
* `LOADING_ROOM -> ROOM_NOT_FOUND`
* `LOADING_ROOM -> ACCESS_DENIED`
* `LOADING_ROOM -> ERROR`

### Regras de UI

* somente sala `ATIVA` deve liberar experiência normal de chat
* `ROOM_UNAVAILABLE` deve bloquear envio
* `ROOM_NOT_FOUND` e `ACCESS_DENIED` devem exibir estados específicos

---

## 9. Estado do histórico de mensagens

## 9.1 MessagesState

Representa o carregamento e a manutenção do histórico da sala.

### Estados possíveis

* `IDLE`
* `LOADING_HISTORY`
* `READY`
* `EMPTY`
* `ERROR`

### Estrutura sugerida

```ts
interface MessagesState {
  status: "IDLE" | "LOADING_HISTORY" | "READY" | "EMPTY" | "ERROR";
  items: Array<{
    id: string;
    roomId: string;
    authorId: string;
    content: string;
    isCodeSnippet: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  }>;
  errorMessage: string | null;
}
```

### Eventos principais

* `MESSAGE_HISTORY_REQUESTED`
* `MESSAGE_HISTORY_SUCCEEDED`
* `MESSAGE_HISTORY_EMPTY`
* `MESSAGE_HISTORY_FAILED`
* `MESSAGE_RECEIVED_REALTIME`
* `MESSAGE_UPDATED_REALTIME`
* `MESSAGE_REMOVED_REALTIME`

### Transições principais

* `IDLE -> LOADING_HISTORY`
* `LOADING_HISTORY -> READY`
* `LOADING_HISTORY -> EMPTY`
* `LOADING_HISTORY -> ERROR`

### Regras de UI

* mensagens seguem ordem cronológica
* eventos em tempo real atualizam a lista sem recarga total
* remoção deve refletir o retorno persistido pelo backend

---

## 10. Estado do compositor de mensagem

## 10.1 MessageComposerState

Representa o campo de envio de mensagem.

### Estados possíveis

* `IDLE`
* `TYPING`
* `VALIDATING`
* `SENDING`
* `SUCCESS`
* `EMPTY_MESSAGE_ERROR`
* `SEND_ERROR`

### Estrutura sugerida

```ts
interface MessageComposerState {
  status:
    | "IDLE"
    | "TYPING"
    | "VALIDATING"
    | "SENDING"
    | "SUCCESS"
    | "EMPTY_MESSAGE_ERROR"
    | "SEND_ERROR";
  draft: string;
  isCodeSnippet: boolean;
  errorMessage: string | null;
}
```

### Eventos principais

* `MESSAGE_DRAFT_CHANGED`
* `MESSAGE_SEND_REQUESTED`
* `MESSAGE_VALIDATION_FAILED_EMPTY`
* `MESSAGE_SEND_SUCCEEDED`
* `MESSAGE_SEND_FAILED`
* `MESSAGE_DRAFT_CLEARED`

### Transições principais

* `IDLE -> TYPING`
* `TYPING -> VALIDATING`
* `VALIDATING -> SENDING`
* `VALIDATING -> EMPTY_MESSAGE_ERROR`
* `SENDING -> SUCCESS`
* `SENDING -> SEND_ERROR`
* `SUCCESS -> IDLE`

### Regras de UI

* mensagem vazia ou só com espaços deve falhar
* após sucesso, limpar rascunho
* em erro, preservar o texto digitado

---

## 11. Estado de ação sobre mensagens

## 11.1 MessageActionState

Representa edição e remoção de mensagens.

### Estados possíveis

* `IDLE`
* `EDITING`
* `UPDATING`
* `REMOVING`
* `SUCCESS`
* `ERROR`
* `FORBIDDEN`

### Estrutura sugerida

```ts
interface MessageActionState {
  status:
    | "IDLE"
    | "EDITING"
    | "UPDATING"
    | "REMOVING"
    | "SUCCESS"
    | "ERROR"
    | "FORBIDDEN";
  targetMessageId: string | null;
  errorMessage: string | null;
}
```

### Regras de UI

* ações só aparecem ao autor ou `ADMIN`
* `FORBIDDEN` representa negativa do backend
* operações destrutivas podem exigir confirmação

---

## 12. Estado do formulário de sala

## 12.1 RoomFormState

Representa criação e edição de sala.

### Estados possíveis

* `IDLE`
* `EDITANDO`
* `VALIDANDO`
* `SALVANDO`
* `SUCCESS`
* `ERROR_VALIDACAO`
* `ERROR_SUBMISSAO`
* `FORBIDDEN`

### Estrutura sugerida

```ts
interface RoomFormState {
  status:
    | "IDLE"
    | "EDITANDO"
    | "VALIDANDO"
    | "SALVANDO"
    | "SUCCESS"
    | "ERROR_VALIDACAO"
    | "ERROR_SUBMISSAO"
    | "FORBIDDEN";
  formData: {
    nome: string;
    descricao: string;
  };
  errors: Record<string, string>;
  errorMessage: string | null;
}
```

### Eventos principais

* `ROOM_FORM_OPENED`
* `ROOM_FIELD_CHANGED`
* `ROOM_SUBMIT_REQUESTED`
* `ROOM_VALIDATION_FAILED`
* `ROOM_SUBMIT_SUCCEEDED`
* `ROOM_SUBMIT_FAILED`
* `ROOM_FORBIDDEN`

---

## 13. Estado de ciclo de vida da sala

## 13.1 RoomLifecycleState

Representa ações como silenciar e excluir logicamente.

### Estados possíveis

* `IDLE`
* `CONFIRMING`
* `PROCESSING`
* `SUCCESS`
* `ERROR`
* `FORBIDDEN`

### Estrutura sugerida

```ts
interface RoomLifecycleState {
  status:
    | "IDLE"
    | "CONFIRMING"
    | "PROCESSING"
    | "SUCCESS"
    | "ERROR"
    | "FORBIDDEN";
  targetRoomId: string | null;
  action: "SILENCIAR" | "EXCLUIR" | null;
  errorMessage: string | null;
}
```

### Regras de UI

* ações destrutivas precisam de confirmação
* autor pode agir sobre a própria sala
* `ADMIN` pode agir sobre qualquer sala

---

## 14. Estado administrativo

## 14.1 AdminModuleState

Representa o estado geral de cada módulo do painel administrativo.

### Estados possíveis

* `IDLE`
* `LOADING`
* `SUCCESS`
* `EMPTY`
* `ERROR`
* `ACTION_PROCESSING`
* `ACTION_SUCCESS`
* `ACTION_ERROR`

### Subdomínios recomendados

* `adminRegistrationRequestsState`
* `adminUsersState`
* `adminRoomsState`
* `adminModerationState`

### Estrutura sugerida

```ts
interface AdminModuleState<T> {
  status:
    | "IDLE"
    | "LOADING"
    | "SUCCESS"
    | "EMPTY"
    | "ERROR"
    | "ACTION_PROCESSING"
    | "ACTION_SUCCESS"
    | "ACTION_ERROR";
  items: T[];
  errorMessage: string | null;
}
```

### Regras de UI

* cada módulo carrega independentemente
* erro em um módulo não derruba o painel inteiro
* ações administrativas devem refletir o retorno do backend

---

## 15. Estado da conexão em tempo real

## 15.1 RealtimeState

Representa o estado do canal WebSocket.

### Estados possíveis

* `DISCONNECTED`
* `CONNECTING`
* `CONNECTED`
* `RECONNECTING`
* `CONNECTION_ERROR`

Esse conjunto já foi previsto no `frontend-spec.md`. 

### Estrutura sugerida

```ts
interface RealtimeState {
  status:
    | "DISCONNECTED"
    | "CONNECTING"
    | "CONNECTED"
    | "RECONNECTING"
    | "CONNECTION_ERROR";
  connectedAt: string | null;
  lastError: string | null;
}
```

### Eventos principais

* `REALTIME_CONNECT_REQUESTED`
* `REALTIME_CONNECTED`
* `REALTIME_DISCONNECTED`
* `REALTIME_RECONNECT_STARTED`
* `REALTIME_RECONNECT_FAILED`
* `REALTIME_ERROR_RECEIVED`

### Transições principais

* `DISCONNECTED -> CONNECTING`
* `CONNECTING -> CONNECTED`
* `CONNECTED -> RECONNECTING`
* `RECONNECTING -> CONNECTED`
* `RECONNECTING -> CONNECTION_ERROR`
* `CONNECTED -> DISCONNECTED`

### Regras de UI

* o estado de conexão deve ser visível na sala
* reconexão não deve apagar histórico já carregado
* eventos fora de contexto devem ser descartados com segurança

---

## 16. Estado de feedback global

## 16.1 FeedbackState

Representa feedback transversal da aplicação.

### Tipos sugeridos

* `SUCCESS_TOAST`
* `ERROR_TOAST`
* `INFO_TOAST`
* `WARNING_TOAST`
* `CONFIRM_DIALOG`

### Estrutura sugerida

```ts
interface FeedbackState {
  queue: Array<{
    type:
      | "SUCCESS_TOAST"
      | "ERROR_TOAST"
      | "INFO_TOAST"
      | "WARNING_TOAST"
      | "CONFIRM_DIALOG";
    message: string;
    visible: boolean;
  }>;
}
```

### Uso

* sucesso de ação
* erro operacional
* aviso de sessão expirada
* aviso de reconexão
* confirmação de ação destrutiva

---

## 17. Dependências entre estados

### 17.1 `AuthState` é base para áreas protegidas

Dependem de `AUTENTICADO`:

* `RoomsListState`
* `ActiveRoomState`
* `MessagesState`
* `MessageComposerState`
* `AdminModuleState`
* `RealtimeState`

### 17.2 `ActiveRoomState` governa a experiência de chat

Dependem de `ROOM_READY`:

* `MessagesState`
* `MessageComposerState`
* `RealtimeState`

### 17.3 WebSocket complementa HTTP

Mesmo com `RealtimeState` desconectado:

* o histórico carregado pode continuar visível
* a sala pode continuar aberta
* a interface deve tentar reconectar sem quebrar a experiência

---

## 18. Stores recomendadas

```text
stores/
  appStore
  authStore
  registrationStore
  roomsStore
  activeRoomStore
  messagesStore
  roomFormStore
  adminStore
  realtimeStore
  feedbackStore
```

---

## 19. Tipos base recomendados

```ts
type LoadState = "IDLE" | "LOADING" | "SUCCESS" | "EMPTY" | "ERROR";

type AuthStatus =
  | "NAO_AUTENTICADO"
  | "AUTENTICANDO"
  | "AUTENTICADO"
  | "PENDENTE_APROVACAO"
  | "REJEITADO"
  | "BLOQUEADO"
  | "SESSAO_EXPIRADA"
  | "ERRO_AUTENTICACAO";

type RoomStatus = "ATIVA" | "SILENCIADA" | "EXCLUIDA";

type RealtimeStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "CONNECTION_ERROR";
```

---

## 20. Critério de pronto

Este documento estará pronto quando:

* cada área principal do frontend tiver estado explícito
* as transições estiverem previstas
* a UI puder ser modelada sem ambiguidade
* as stores puderem ser implementadas com base neste artefato
* o documento estiver coerente com `frontend-spec.md` 


