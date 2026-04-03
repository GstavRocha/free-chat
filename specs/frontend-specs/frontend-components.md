# frontend-components.md

## Frontend Components — Free Chat Maker

**Versão:** 0.1.0  
**Status:** Draft  
**Derivado de:** `specs.md`, `frontend-spec.md`, `frontend-use-case.md`, `frontend-screens.md`, `frontend-routes.md`, `frontend-state-model.md`

---

## 1. Objetivo

Este documento define os componentes do frontend do **Free Chat Maker**, organizando:

* componentes de layout
* componentes de tela
* componentes de domínio
* componentes compartilhados
* responsabilidades de cada componente
* entradas e saídas esperadas
* relação com estados e fluxos da aplicação

O objetivo é permitir que a implementação em Vue.js + Vuetify aconteça com menos ambiguidade e com separação clara de responsabilidades.

---

## 2. Regra de precedência entre artefatos

Em caso de conflito entre documentos, a precedência obrigatória é:

1. `specs.md`
2. `frontend-spec.md`
3. `frontend-use-case.md`
4. `frontend-screens.md`
5. `frontend-routes.md`
6. `frontend-state-model.md`
7. `frontend-components.md`

Este documento não define regra de negócio nova. Ele deriva componentes a partir das telas, rotas, estados e casos de uso já estabelecidos.

---

## 3. Princípios de componentização

### 3.1 Componente não é regra de negócio

A regra de negócio permanece no backend e, no frontend, a orquestração fica em stores, composables e guards.

O componente deve focar em:

* exibição
* interação
* emissão de eventos
* renderização condicional

### 3.2 Componentes orientados por domínio

A organização deve seguir os domínios principais:

* auth
* registration
* rooms
* messages
* admin
* realtime
* feedback

### 3.3 Separação entre página e bloco reutilizável

* **screen/page component**: compõe a tela
* **feature/domain component**: resolve uma parte funcional da tela
* **ui/shared component**: reutilizável e mais genérico

### 3.4 Props explícitas e eventos previsíveis

Todo componente reutilizável deve ter:

* props claras
* eventos bem nomeados
* comportamento previsível

---

## 4. Estrutura sugerida

```text
src/
  components/
    app/
    auth/
    registration/
    rooms/
    messages/
    admin/
    feedback/
    realtime/
    shared/
  pages/
  layouts/
```

---

## 5. Relação com telas canônicas

Os componentes deste documento existem para compor as telas canônicas já definidas em `frontend-screens.md`.

### 5.1 Mapa resumido

* `EntryScreen`: `PublicLayout`, `AppWelcomeHero`, `ScreenSection`
* `RegistrationRequestScreen`: `PublicLayout`, `RegistrationForm`, `RoleSelector`, `ConditionalFieldsBlock`, `FormStatusAlert`
* `LoginScreen`: `PublicLayout`, `LoginForm`, `AuthStatusAlert`, `SessionGuardRedirect`
* `RoomsListScreen`: `AppLayout`, `AppTopBar`, `RoomList`, `RoomCard`, `GlobalSnackbar`
* `CreateRoomScreen`: `AppLayout`, `RoomForm`, `RoomFormActions`, `FormStatusAlert`
* `EditRoomScreen`: `AppLayout`, `RoomForm`, `RoomFormActions`, `RoomDangerZone`, `FormStatusAlert`
* `ChatRoomScreen`: `AppLayout`, `RoomHeader`, `ChatMessageList`, `ChatMessageItem`, `ChatMessageComposer`, `MessageActionsMenu`, `ChatParticipantEvents`, `ChatConnectionBanner`
* `AdminPanelScreen`: `AdminLayout`, `PendingRequestsList`, `RegistrationRequestCard`, `ApprovalActionPanel`, `AdminStatusAlert`

---

## 6. Componentes de layout

### 6.1 `PublicLayout`

#### Objetivo

Estruturar telas públicas como entrada, login e cadastro.

#### Responsabilidades

* organizar cabeçalho simples
* centralizar conteúdo principal
* exibir navegação mínima entre login e cadastro

#### Usado em

* `EntryScreen`
* `LoginScreen`
* `RegistrationRequestScreen`

---

### 6.2 `AppLayout`

#### Objetivo

Estruturar a área autenticada comum.

#### Responsabilidades

* exibir barra superior
* conter navegação principal
* exibir área de conteúdo
* oferecer logout
* indicar perfil do usuário autenticado

#### Usado em

* `RoomsListScreen`
* `CreateRoomScreen`
* `EditRoomScreen`
* `ChatRoomScreen`

---

### 6.3 `AdminLayout`

#### Objetivo

Estruturar a área administrativa simplificada.

#### Responsabilidades

* destacar contexto administrativo
* compor o painel administrativo
* organizar módulos do painel simplificado

#### Usado em

* `AdminPanelScreen`

---

### 6.4 `MinimalLayout`

#### Objetivo

Estruturar telas auxiliares como erro, 403 e 404, quando existirem.

---

## 7. Componentes de aplicação

### 7.1 `AppTopBar`

#### Objetivo

Barra superior da área autenticada.

#### Responsabilidades

* exibir nome do sistema
* exibir nome do usuário
* exibir papel do usuário
* fornecer ação de logout
* oferecer atalho para administração, se `ADMIN`

#### Props sugeridas

```ts
interface AppTopBarProps {
  userName: string;
  userRole: "ADMIN" | "ALUNO" | "PROFESSOR" | "FUNCIONARIO";
  showAdminLink: boolean;
}
```

#### Eventos sugeridos

* `logout-clicked`
* `admin-clicked`

---

### 7.2 `AppWelcomeHero`

#### Objetivo

Apresentar a aplicação na tela de entrada.

#### Responsabilidades

* mostrar título
* mostrar subtítulo
* contextualizar a função do sistema

---

### 7.3 `ScreenSection`

#### Objetivo

Padronizar blocos visuais de seção em telas maiores.

#### Responsabilidades

* título
* descrição opcional
* área de conteúdo

---

## 8. Componentes de autenticação

### 8.1 `LoginForm`

#### Objetivo

Capturar CPF e senha do usuário.

#### Responsabilidades

* renderizar campos de login
* validar campos obrigatórios em nível de UI
* emitir submissão

#### Props sugeridas

```ts
interface LoginFormProps {
  cpf: string;
  senha: string;
  loading: boolean;
  errorMessage?: string | null;
}
```

#### Eventos sugeridos

* `update:cpf`
* `update:senha`
* `submit`

---

### 8.2 `AuthStatusAlert`

#### Objetivo

Exibir feedback de autenticação.

#### Casos de uso

* credenciais inválidas
* usuário pendente
* usuário rejeitado
* usuário bloqueado
* sessão expirada

#### Props sugeridas

```ts
interface AuthStatusAlertProps {
  type: "error" | "warning" | "info" | "success";
  message: string;
  visible: boolean;
}
```

---

### 8.3 `SessionGuardRedirect`

#### Objetivo

Executar comportamento visual/controlado quando a sessão é inválida, expirou ou já existe.

#### Responsabilidades

* renderizar fallback de carregamento rápido
* acionar redirecionamento conforme estado da sessão
* cooperar com as guardas definidas em `frontend-routes.md`

---

## 9. Componentes de cadastro

### 9.1 `RegistrationForm`

#### Objetivo

Capturar a solicitação de cadastro do visitante.

#### Responsabilidades

* exibir campos comuns
* renderizar campos condicionais
* emitir submissão
* exibir erros de validação

#### Props sugeridas

```ts
interface RegistrationFormProps {
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
  loading: boolean;
}
```

#### Eventos sugeridos

* `update:field`
* `submit`
* `papel-changed`

---

### 9.2 `RoleSelector`

#### Objetivo

Selecionar o papel do solicitante.

#### Props sugeridas

```ts
interface RoleSelectorProps {
  modelValue: "ALUNO" | "PROFESSOR" | "FUNCIONARIO" | "";
}
```

#### Eventos sugeridos

* `update:modelValue`

---

### 9.3 `ConditionalFieldsBlock`

#### Objetivo

Renderizar campos condicionais do cadastro conforme o papel escolhido.

#### Responsabilidades

* mostrar `serie` e `turma` para `ALUNO`
* mostrar `departamento` para `PROFESSOR`
* mostrar `setor` para `FUNCIONARIO`

---

### 9.4 `FormStatusAlert`

#### Objetivo

Exibir feedback contextual de formulário.

#### Usado em

* cadastro
* criação de sala
* edição de sala

---

## 10. Componentes de salas

### 10.1 `RoomList`

#### Objetivo

Renderizar a listagem de salas disponíveis.

#### Props sugeridas

```ts
interface RoomListProps {
  rooms: RoomSummary[];
  loading: boolean;
  errorMessage?: string | null;
}
```

#### Eventos sugeridos

* `room-selected`
* `room-edit-requested`

---

### 10.2 `RoomCard`

#### Objetivo

Representar visualmente uma sala da listagem.

#### Responsabilidades

* exibir nome
* exibir descrição
* exibir status
* exibir ação principal
* indicar permissão de edição

---

### 10.3 `RoomForm`

#### Objetivo

Capturar dados para criação e edição de sala.

#### Props sugeridas

```ts
interface RoomFormProps {
  formData: {
    nome: string;
    descricao: string;
    status?: "ATIVA" | "SILENCIADA";
  };
  loading: boolean;
  errors?: Record<string, string>;
}
```

#### Eventos sugeridos

* `update:field`
* `submit`
* `cancel`

---

### 10.4 `RoomFormActions`

#### Objetivo

Organizar as ações primárias e secundárias do formulário de sala.

---

### 10.5 `RoomDangerZone`

#### Objetivo

Concentrar ações destrutivas ou sensíveis da sala.

#### Responsabilidades

* solicitar confirmação de exclusão lógica
* destacar ação destrutiva
* nunca executar exclusão direta sem confirmação explícita de UI

---

## 11. Componentes de chat e mensagens

### 11.1 `RoomHeader`

#### Objetivo

Exibir informações principais da sala ativa.

#### Responsabilidades

* nome da sala
* descrição
* status
* ação de sair da sala
* indicação visual quando a sala estiver `SILENCIADA`

---

### 11.2 `ChatMessageList`

#### Objetivo

Renderizar o histórico e a lista reativa de mensagens.

#### Props sugeridas

```ts
interface ChatMessageListProps {
  messages: RoomMessage[];
  loading: boolean;
  emptyMessage?: string;
}
```

---

### 11.3 `ChatMessageItem`

#### Objetivo

Representar uma mensagem individual da sala.

#### Responsabilidades

* exibir autoria
* exibir conteúdo
* exibir horário
* exibir estado de edição ou remoção, quando aplicável
* renderizar ações permitidas
* respeitar autoria e permissões já refletidas no estado do frontend

---

### 11.4 `ChatMessageComposer`

#### Objetivo

Capturar e enviar nova mensagem.

#### Regras de interface

* deve bloquear envio quando a sala estiver `SILENCIADA`
* deve bloquear envio durante operação de submissão
* deve preservar o rascunho quando o backend rejeitar o envio

#### Props sugeridas

```ts
interface ChatMessageComposerProps {
  draft: string;
  disabled: boolean;
  loading: boolean;
  errorMessage?: string | null;
}
```

#### Eventos sugeridos

* `update:draft`
* `submit`

---

### 11.5 `MessageActionsMenu`

#### Objetivo

Exibir ações permitidas por mensagem.

#### Responsabilidades

* editar mensagem própria
* remover mensagem própria

---

### 11.6 `ChatParticipantEvents`

#### Objetivo

Renderizar eventos visuais de entrada e saída de participantes.

#### Props sugeridas

```ts
interface ChatParticipantEventsProps {
  events: RoomParticipantEvent[];
}
```

---

### 11.7 `ChatConnectionBanner`

#### Objetivo

Indicar estado da conexão em tempo real.

#### Responsabilidades

* informar conexão ativa
* informar reconexão
* informar erro de tempo real

---

## 12. Componentes administrativos

### 12.1 `PendingRequestsList`

#### Objetivo

Listar solicitações de cadastro pendentes no painel administrativo.

#### Props sugeridas

```ts
interface PendingRequestsListProps {
  requests: RegistrationRequestSummary[];
  loading: boolean;
  errorMessage?: string | null;
}
```

---

### 12.2 `RegistrationRequestCard`

#### Objetivo

Representar uma solicitação de cadastro individual.

#### Responsabilidades

* exibir dados essenciais da solicitação
* permitir aprovar
* permitir rejeitar

---

### 12.3 `ApprovalActionPanel`

#### Objetivo

Organizar ações de aprovação e rejeição com feedback de operação.

---

### 12.4 `AdminStatusAlert`

#### Objetivo

Exibir mensagens contextuais do painel administrativo.

---

## 13. Componentes de feedback compartilhado

### 13.1 `InlineErrorMessage`

#### Objetivo

Exibir erro localizado em formulário ou bloco específico.

### 13.2 `GlobalSnackbar`

#### Objetivo

Exibir feedback transversal da aplicação.

### 13.3 `LoadingState`

#### Objetivo

Padronizar carregamento visual.

### 13.4 `EmptyState`

#### Objetivo

Padronizar estados vazios.

### 13.5 `ErrorState`

#### Objetivo

Padronizar estados de erro.

---

## 14. Critérios de consistência

Um componente descrito neste documento deve:

* existir por necessidade funcional derivada dos artefatos superiores
* respeitar os nomes canônicos das telas já definidos
* não introduzir regra de negócio nova
* operar sobre estados previamente modelados
* usar props e eventos previsíveis
