# frontend-screens.md

## Frontend Screens — Free Chat Maker

**Versão:** 0.1.0  
**Status:** Draft  
**Derivado de:** `specs.md`, `frontend-spec.md`, `frontend-use-case.md`

---

## 1. Objetivo do documento

Este documento define as telas do frontend da versão 1 do **Free Chat Maker** como ponte entre os artefatos de especificação e a implementação em Vue.js + Vuetify.

Cada tela deve explicitar:

* objetivo funcional
* perfil de acesso
* rota sugerida
* dados exibidos
* ações disponíveis
* estados de interface
* regras de permissão
* componentes principais

---

## 2. Regra de precedência entre artefatos

Em caso de conflito entre documentos, a precedência obrigatória é:

1. `specs.md`
2. `frontend-spec.md`
3. `frontend-use-case.md`
4. `frontend-screens.md`

Este documento não cria regra de negócio nova. Ele apenas organiza visualmente e estruturalmente as telas derivadas dos artefatos superiores.

---

## 3. Convenções

### 3.1 Perfis de acesso de tela

* `VISITANTE`
* `ALUNO`
* `PROFESSOR`
* `FUNCIONARIO`
* `ADMIN`

### 3.2 Estados gerais de carregamento

* `idle`
* `loading`
* `success`
* `empty`
* `error`

### 3.3 Estados de autenticação

* `NAO_AUTENTICADO`
* `AUTENTICANDO`
* `AUTENTICADO`
* `PENDENTE_APROVACAO`
* `REJEITADO`
* `BLOQUEADO`
* `SESSAO_EXPIRADA`

### 3.4 Estados de sala

* `ATIVA`
* `SILENCIADA`
* `EXCLUIDA`

---

## 4. Tela: Entrada

### 4.1 Identificação

* **Nome canônico:** `EntryScreen`
* **Rota sugerida:** `/`
* **Perfis:** `VISITANTE`
* **Derivada de:** mapa de telas do `frontend-spec.md`

### 4.2 Objetivo

Servir como ponto inicial para o visitante e encaminhá-lo para login ou solicitação de cadastro.

### 4.3 Dados exibidos

* nome do sistema
* descrição curta da plataforma
* ações principais de navegação

### 4.4 Ações disponíveis

* ir para login
* ir para cadastro

### 4.5 Estados da tela

* `idle`
* `loading`, se houver checagem de sessão
* `error`, quando aplicável

### 4.6 Regras

* se existir sessão válida, redirecionar para `/salas`
* visitante não deve visualizar elementos protegidos

### 4.7 Componentes principais

* `AppWelcomeHero`
* `PrimaryActionCard`
* `EntryNavigationButtons`

---

## 5. Tela: Solicitação de Cadastro

### 5.1 Identificação

* **Nome canônico:** `RegistrationRequestScreen`
* **Rota sugerida:** `/cadastro`
* **Perfis:** `VISITANTE`
* **Derivada de:** `UC-01`

### 5.2 Objetivo

Permitir que um visitante envie uma solicitação de cadastro para análise administrativa.

### 5.3 Campos exibidos

Campos comuns:

* `nomeCompleto`
* `cpf`
* `senha`
* `papel`

Campos condicionais:

* `ALUNO`: `serie`, `turma`
* `PROFESSOR`: `departamento`
* `FUNCIONARIO`: `setor`

### 5.4 Ações disponíveis

* preencher formulário
* alterar papel
* enviar solicitação
* voltar para entrada
* ir para login

### 5.5 Estados da tela

* formulário inicial
* validando
* enviado com sucesso
* erro de validação
* cpf já existente
* erro interno

### 5.6 Regras

* campos condicionais devem aparecer conforme o papel escolhido
* envio deve ser bloqueado se faltarem campos obrigatórios
* após sucesso, exibir confirmação de solicitação pendente
* o frontend não aprova cadastro, apenas solicita

### 5.7 Componentes principais

* `RegistrationForm`
* `RoleSelector`
* `ConditionalFieldsBlock`
* `FormStatusAlert`

---

## 6. Tela: Login

### 6.1 Identificação

* **Nome canônico:** `LoginScreen`
* **Rota sugerida:** `/login`
* **Perfis:** `VISITANTE`
* **Derivada de:** `UC-02`

### 6.2 Objetivo

Permitir que um usuário aprovado se autentique com CPF e senha.

### 6.3 Campos exibidos

* `cpf`
* `senha`

### 6.4 Ações disponíveis

* autenticar
* voltar para entrada
* ir para cadastro

### 6.5 Estados da tela

* formulário inicial
* autenticando
* erro de credenciais
* acesso pendente
* acesso rejeitado
* acesso bloqueado
* login concluído

### 6.6 Regras

* ao autenticar com sucesso, redirecionar para `/salas`
* deve tratar corretamente respostas de usuário pendente, rejeitado ou bloqueado
* não permitir acesso visual à área protegida sem sessão válida

### 6.7 Componentes principais

* `LoginForm`
* `AuthStatusAlert`
* `SessionGuardRedirect`

---

## 7. Tela: Listagem de Salas

### 7.1 Identificação

* **Nome canônico:** `RoomsListScreen`
* **Rota sugerida:** `/salas`
* **Perfis:** `ALUNO`, `PROFESSOR`, `FUNCIONARIO`, `ADMIN`
* **Derivada de:** `UC-03`

### 7.2 Objetivo

Exibir as salas públicas disponíveis ao usuário autenticado.

### 7.3 Dados exibidos por item

* nome da sala
* descrição resumida
* status
* criador ou indicador equivalente
* data de atualização, quando útil
* ação principal

### 7.4 Ações disponíveis

* entrar em sala
* criar nova sala
* abrir edição de sala própria
* acessar painel administrativo, se `ADMIN`
* sair da sessão

### 7.5 Estados da tela

* carregando
* lista preenchida
* lista vazia
* erro

### 7.6 Regras

* salas `ATIVA`: botão de entrar habilitado
* salas `SILENCIADA`: indicar restrição de interação
* salas `EXCLUIDA`: não exibir
* botão de edição de sala só aparece ao autor ou `ADMIN`

### 7.7 Componentes principais

* `AppTopBar`
* `RoomList`
* `RoomCard`
* `CreateRoomFab`
* `RoomsEmptyState`
* `RoomsErrorState`

---

## 8. Tela: Criação de Sala

### 8.1 Identificação

* **Nome canônico:** `CreateRoomScreen`
* **Rota sugerida:** `/salas/nova`
* **Perfis:** `ALUNO`, `PROFESSOR`, `FUNCIONARIO`, `ADMIN`
* **Derivada de:** mapa de telas do `frontend-spec.md`

### 8.2 Objetivo

Permitir que o usuário autenticado crie uma nova sala pública.

### 8.3 Campos exibidos

* `nome`
* `descricao`

### 8.4 Ações disponíveis

* salvar sala
* cancelar
* voltar para listagem

### 8.5 Estados da tela

* formulário inicial
* validando
* salvando
* sucesso
* erro

### 8.6 Regras

* apenas usuários autenticados podem criar sala
* após sucesso, redirecionar para a sala criada ou para `/salas`
* o estado inicial da sala deve seguir o contrato do backend

### 8.7 Componentes principais

* `RoomForm`
* `RoomFormActions`
* `FormStatusAlert`

---

## 9. Tela: Edição de Sala

### 9.1 Identificação

* **Nome canônico:** `EditRoomScreen`
* **Rota sugerida:** `/salas/:id/editar`
* **Perfis:** `ALUNO`, `PROFESSOR`, `FUNCIONARIO`, `ADMIN`
* **Derivada de:** mapa de telas do `frontend-spec.md`

### 9.2 Objetivo

Permitir que o autor da sala, ou o administrador quando permitido, edite os dados disponíveis da sala.

### 9.3 Dados exibidos

* nome atual
* descrição atual
* status atual, quando aplicável

### 9.4 Ações disponíveis

* salvar alterações
* excluir logicamente sala, quando permitido
* cancelar edição

### 9.5 Estados da tela

* carregando sala
* formulário pronto
* validando
* salvando
* sucesso
* erro

### 9.6 Regras

* apenas autor ou `ADMIN` podem editar
* sala `EXCLUIDA` não deve permitir edição normal
* a exclusão lógica deve depender do backend

### 9.7 Componentes principais

* `RoomForm`
* `RoomDangerZone`
* `FormStatusAlert`

---

## 10. Tela: Sala / Chat

### 10.1 Identificação

* **Nome canônico:** `ChatRoomScreen`
* **Rota sugerida:** `/salas/:id`
* **Perfis:** `ALUNO`, `PROFESSOR`, `FUNCIONARIO`, `ADMIN`
* **Derivada de:** `UC-04`, `UC-05`, `UC-06`, `UC-07`, `UC-08`

### 10.2 Objetivo

Permitir entrada em sala, visualização de histórico, envio de mensagens e reação visual a eventos em tempo real.

### 10.3 Áreas principais

* cabeçalho da sala
* histórico de mensagens
* eventos de participação
* campo de envio
* ações por mensagem

### 10.4 Ações disponíveis

* entrar em sala
* sair da sala
* enviar mensagem
* editar mensagem própria, quando permitido
* remover mensagem própria, quando permitido

### 10.5 Estados da tela

* carregando histórico
* entrando na sala
* pronta para uso
* indisponível
* reconectando tempo real
* erro operacional

### 10.6 Regras

* deve carregar histórico em ordem cronológica
* deve registrar entrada e saída conforme o fluxo definido
* deve refletir `PARTICIPANTE_ENTROU` e `PARTICIPANTE_SAIU`
* deve reagir a `MENSAGEM_CRIADA`, `MENSAGEM_ATUALIZADA` e `MENSAGEM_REMOVIDA`
* deve impedir envio de mensagem vazia
* deve indicar restrição quando a sala estiver `SILENCIADA`

### 10.7 Componentes principais

* `RoomHeader`
* `ChatMessageList`
* `ChatMessageComposer`
* `ChatParticipantEvents`
* `ChatConnectionBanner`
* `MessageActionsMenu`

---

## 11. Tela: Painel Administrativo

### 11.1 Identificação

* **Nome canônico:** `AdminPanelScreen`
* **Rota sugerida:** `/admin`
* **Perfis:** `ADMIN`
* **Derivada de:** `UC-09`

### 11.2 Objetivo

Permitir que o administrador opere os fluxos administrativos simplificados previstos para a versão 1.

### 11.3 Módulos exibidos

* solicitações de cadastro pendentes
* ações de aprovação e rejeição
* usuários e seus estados
* ações administrativas básicas sobre salas e mensagens, quando disponíveis no backend

### 11.4 Ações disponíveis

* listar solicitações pendentes
* aprovar solicitação
* rejeitar solicitação
* acessar módulos administrativos disponíveis

### 11.5 Estados da tela

* carregando
* lista preenchida
* vazio
* erro
* operação em andamento

### 11.6 Regras

* acesso restrito a `ADMIN`
* o frontend deve refletir permissões e negações vindas do backend
* a tela deve tratar estados vazios de forma explícita

### 11.7 Componentes principais

* `AdminTopBar`
* `PendingRequestsList`
* `ApprovalActionPanel`
* `AdminStatusAlert`

---

## 12. Critério de qualidade do documento

Uma tela descrita neste documento deve:

* existir por necessidade funcional derivada dos artefatos superiores
* respeitar perfis e permissões já definidos
* refletir estados relevantes do domínio e da interface
* não introduzir regra de negócio nova
* permanecer coerente com as rotas, estados e use cases do frontend
