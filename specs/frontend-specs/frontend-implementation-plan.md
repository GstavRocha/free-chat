# frontend-implementation-plan.md

## Frontend Implementation Plan — Free Chat Maker

**Versão:** 0.1.0  
**Status:** Draft  
**Derivado de:** `specs.md`, `frontend-spec.md`, `frontend-use-case.md`, `frontend-screens.md`, `frontend-routes.md`, `frontend-state-model.md`, `frontend-components.md`, `tasks.md`

---

## 1. Objetivo

Este documento define a ordem de implementação do frontend do **Free Chat Maker** para a versão 1.

Ele existe para:

* transformar os artefatos de frontend em sequência executável
* reduzir retrabalho entre infraestrutura, navegação, estado e telas
* explicitar dependências entre fases
* fornecer critério de pronto incremental
* alinhar implementação com a FASE 7 do `tasks.md`

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
8. `tasks.md`
9. `frontend-implementation-plan.md`

Este documento não define requisito novo. Ele apenas organiza a implementação do que já foi definido pelos artefatos superiores.

---

## 3. Estratégia geral

A implementação do frontend deve seguir a seguinte lógica:

1. preparar fundação técnica do cliente
2. habilitar navegação e guardas
3. estabilizar autenticação e sessão
4. entregar área autenticada básica
5. entregar experiência de chat em sala
6. entregar painel administrativo simplificado
7. refinar estados de erro, feedback e previsibilidade operacional

A ordem deve priorizar capacidade operacional mínima, e não acabamento visual isolado.

---

## 4. Critérios gerais de execução

Cada fase deve buscar entregar, no mínimo:

* rotas funcionais da fase
* estado coerente para os fluxos atendidos
* componentes mínimos derivados dos artefatos canônicos
* integração HTTP ou WebSocket estritamente necessária
* feedback de carregamento e erro
* critério claro de validação

---

## 5. Fase 0 — Fundação do projeto

### 5.1 Objetivo

Preparar a base técnica do frontend.

### 5.2 Entregas

* projeto Vue inicializado
* Vuetify configurado
* estrutura de pastas inicial criada
* roteador configurado
* gerenciador de estado configurado
* camada base de serviços HTTP criada
* serviço de autenticação criado
* serviço de solicitações de cadastro criado
* serviço de salas criado
* serviço de mensagens criado
* tema visual mínimo definido
* layouts base criados

### 5.3 Estrutura mínima esperada

```text
src/
  app/
  router/
  layouts/
  pages/
  components/
  stores/
  services/
  composables/
  utils/
  types/
```

### 5.4 Componentes e layouts relacionados

* `PublicLayout`
* `AppLayout`
* `AdminLayout`
* `MinimalLayout`

### 5.5 Dependências principais

* FASE 1 do `tasks.md`
* `frontend-routes.md`
* `frontend-components.md`

### 5.6 Critério de pronto

* a aplicação sobe localmente
* o router responde
* os layouts renderizam
* a estrutura está pronta para receber páginas e stores

---

## 6. Fase 1 — Navegação pública, autenticação e sessão

### 6.1 Objetivo

Entregar o fluxo do visitante até a autenticação.

### 6.2 Telas incluídas

* `EntryScreen`
* `LoginScreen`
* `RegistrationRequestScreen`

### 6.3 Rotas incluídas

* `/`
* `/login`
* `/cadastro`

### 6.4 Estados envolvidos

* `ApplicationBootState`
* `AuthState`
* `RegistrationRequestState`
* `RouteAccessState`
* `GlobalFeedbackState`

### 6.5 Componentes principais

* `AppWelcomeHero`
* `ScreenSection`
* `LoginForm`
* `AuthStatusAlert`
* `SessionGuardRedirect`
* `RegistrationForm`
* `RoleSelector`
* `ConditionalFieldsBlock`
* `FormStatusAlert`

### 6.6 Integrações mínimas

* endpoint de login
* endpoint de perfil atual da sessão
* endpoint de solicitação de cadastro
* persistência controlada de sessão
* redirecionamento pós-login

### 6.7 Regras críticas

* visitante autenticado não deve permanecer em rotas públicas
* usuário `PENDENTE`, `REJEITADO` e `BLOQUEADO` deve receber feedback correto
* cadastro deve tratar erro de validação e `cpf` duplicado
* sessão expirada deve limpar contexto e redirecionar corretamente
* restauração de sessão deve usar o endpoint de perfil atual

### 6.8 Critério de pronto

* visitante acessa a entrada
* visitante solicita cadastro
* usuário aprovado faz login
* sessão é restaurável de forma controlada
* redirecionamento para `/salas` funciona

---

## 7. Fase 2 — Rotas protegidas e área autenticada básica

### 7.1 Objetivo

Entregar a estrutura autenticada principal e os fluxos básicos de salas.

### 7.2 Telas incluídas

* `RoomsListScreen`
* `CreateRoomScreen`
* `EditRoomScreen`

### 7.3 Rotas incluídas

* `/salas`
* `/salas/nova`
* `/salas/:id/editar`

### 7.4 Estados envolvidos

* `AuthState`
* `RouteAccessState`
* `RoomsListState`
* `GlobalFeedbackState`

### 7.5 Componentes principais

* `AppTopBar`
* `RoomList`
* `RoomCard`
* `RoomForm`
* `RoomFormActions`
* `RoomDangerZone`
* `FormStatusAlert`
* `LoadingState`
* `EmptyState`
* `ErrorState`

### 7.6 Integrações mínimas

* endpoint de listagem de salas
* endpoint de criação de sala
* endpoint de edição de sala
* endpoint de alteração de estado da sala, se já exposto ao frontend
* adaptação dos payloads HTTP de sala na camada de serviços

### 7.7 Regras críticas

* apenas autenticado acessa essas rotas
* salas `EXCLUIDA` não devem aparecer na listagem padrão
* salas `SILENCIADA` devem aparecer com restrição visual
* edição de sala depende de permissão compatível com o backend

### 7.8 Critério de pronto

* usuário autenticado visualiza as salas
* usuário cria sala
* usuário com permissão edita sala
* ações sensíveis exigem confirmação visual
* guardas impedem acesso indevido

---

## 8. Fase 3 — Sala ativa e experiência de chat

### 8.1 Objetivo

Entregar o núcleo do produto: entrada em sala, histórico e mensagens em tempo real.

### 8.2 Telas incluídas

* `ChatRoomScreen`

### 8.3 Rotas incluídas

* `/salas/:id`

### 8.4 Estados envolvidos

* `ActiveRoomState`
* `MessageListState`
* `MessageComposerState`
* `RealtimeConnectionState`
* `ParticipantEventsState`
* `GlobalFeedbackState`

### 8.5 Componentes principais

* `RoomHeader`
* `ChatMessageList`
* `ChatMessageItem`
* `ChatMessageComposer`
* `MessageActionsMenu`
* `ChatParticipantEvents`
* `ChatConnectionBanner`
* `LoadingState`
* `EmptyState`
* `ErrorState`

### 8.6 Integrações mínimas

* endpoint de detalhes da sala, quando aplicável
* endpoint de histórico de mensagens
* endpoint de envio de mensagem
* endpoint de edição de mensagem
* endpoint de remoção lógica de mensagem
* canal WebSocket autenticado para eventos da sala
* adaptação dos payloads HTTP e WebSocket de mensagens na camada de serviços

### 8.7 Regras críticas

* só entrar em sala acessível
* mensagem vazia deve ser impedida
* sala `SILENCIADA` deve bloquear composição e envio
* histórico deve carregar em ordem cronológica
* a UI deve reagir a criação, edição e remoção de mensagens
* erro de conexão não deve destruir a experiência de leitura

### 8.8 Critério de pronto

* usuário entra em sala ativa
* histórico carrega corretamente
* usuário envia mensagem
* eventos em tempo real atualizam a interface
* edição e remoção de mensagem seguem permissão

---

## 9. Fase 4 — Painel administrativo simplificado

### 9.1 Objetivo

Entregar a área administrativa prevista para a versão 1.

### 9.2 Telas incluídas

* `AdminPanelScreen`

### 9.3 Rotas incluídas

* `/admin`

### 9.4 Estados envolvidos

* `RouteAccessState`
* `AdminPanelState`
* `GlobalFeedbackState`

### 9.5 Componentes principais

* `PendingRequestsList`
* `RegistrationRequestCard`
* `ApprovalActionPanel`
* `AdminStatusAlert`
* `LoadingState`
* `EmptyState`
* `ErrorState`

### 9.6 Integrações mínimas

* endpoint de listagem de solicitações pendentes
* endpoint de aprovação de solicitação
* endpoint de rejeição de solicitação
* adaptação dos payloads administrativos consumidos pelo painel

### 9.7 Regras críticas

* apenas `ADMIN` acessa a rota administrativa
* erro administrativo não deve derrubar toda a tela
* ações críticas devem pedir confirmação de UI
* interface deve refletir claramente o resultado das ações

### 9.8 Critério de pronto

* admin acessa o painel
* visualiza solicitações pendentes
* aprova ou rejeita solicitações
* feedback operacional aparece corretamente

---

## 10. Fase 5 — Robustez operacional e acabamento funcional

### 10.1 Objetivo

Dar previsibilidade, robustez e consistência visual aos fluxos já implementados.

### 10.2 Rotas e estados relacionados

* fallback de rota não encontrada
* tratamento de acesso negado, quando adotado
* tratamento de sessão expirada
* estados vazios e estados de erro

### 10.3 Componentes principais

* `GlobalSnackbar`
* `InlineErrorMessage`
* `LoadingState`
* `EmptyState`
* `ErrorState`
* `ChatConnectionBanner`

### 10.4 Melhorias esperadas

* feedback global consistente
* padronização de loading
* padronização de erro
* tratamento claro de sessão expirada
* tratamento claro de recurso inexistente
* mensagens visuais de reconexão WebSocket

### 10.5 Critério de pronto

* UX continua previsível em erro comum
* o usuário entende o que aconteceu
* a navegação se mantém estável mesmo em falha parcial

---

## 11. Ordem recomendada de implementação por camada

### 11.1 Primeiro

* router
* layouts
* stores base
* services HTTP
* services de autenticação
* services por recurso

### 11.2 Depois

* páginas principais
* componentes de domínio maiores

### 11.3 Depois

* componentes reutilizáveis
* feedback compartilhado
* ajustes de guardas e reconexão
* adaptação final de payloads por recurso

### 11.4 Por último

* refinamentos visuais
* polimento de UX
* otimizações

---

## 12. Dependências entre fases

### 12.1 Fase 1 depende de

* Fase 0 completa

### 12.2 Fase 2 depende de

* autenticação funcional da Fase 1

### 12.3 Fase 3 depende de

* listagem de salas funcional da Fase 2
* infraestrutura de tempo real preparada

### 12.4 Fase 4 depende de

* sessão autenticada estável
* guardas administrativas funcionando

### 12.5 Fase 5 depende de

* fluxos principais já operacionais

---

## 13. Estratégia de validação por fase

### 13.1 Validação da Fase 1

* login funciona
* cadastro funciona
* guardas públicos funcionam

### 13.2 Validação da Fase 2

* listagem de salas funciona
* criação e edição de sala funcionam
* guardas autenticados funcionam

### 13.3 Validação da Fase 3

* sala abre corretamente
* histórico carrega
* envio funciona
* WebSocket reage aos eventos principais

### 13.4 Validação da Fase 4

* rota admin é protegida
* ações administrativas funcionam
* feedback de ação aparece

### 13.5 Validação da Fase 5

* erros são compreensíveis
* estados vazios não quebram navegação
* sessão expirada é tratada corretamente

---

## 14. Riscos principais de implementação

### 14.1 Misturar regra de negócio em componente

Mitigação:

* mover lógica para store, composable ou guarda

### 14.2 Acoplar UI ao retorno bruto da API cedo demais

Mitigação:

* criar camada de adaptação de dados no frontend

### 14.3 Implementar tempo real antes do fluxo HTTP básico

Mitigação:

* estabilizar a experiência base da sala antes de depender do WebSocket

### 14.4 Tentar construir tudo de uma vez

Mitigação:

* seguir estritamente as fases deste plano e da FASE 7 do `tasks.md`

### 14.5 Não tratar erro e loading desde o início

Mitigação:

* incluir feedback operacional em toda fase

---

## 15. Entregável mínimo viável do frontend

O frontend pode ser considerado **MVP funcional** quando cumprir:

* login
* solicitação de cadastro
* listagem de salas
* criação de sala
* entrada em sala ativa
* histórico de mensagens
* envio de mensagem
* atualização em tempo real básica

O painel administrativo simplificado pode ser a entrega seguinte da versão 1.

---

## 16. Critério de pronto do plano

Este plano estará adequado quando:

* a ordem de construção estiver clara
* as dependências entre fases estiverem explícitas
* cada fase tiver critério de pronto
* os nomes usados forem coerentes com os artefatos superiores
* a equipe puder executar sem inventar uma sequência paralela
