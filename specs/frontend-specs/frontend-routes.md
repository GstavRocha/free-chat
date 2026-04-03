# frontend-routes.md

## Frontend Routes — Free Chat Maker

**Versão:** 0.1.0  
**Status:** Draft  
**Derivado de:** `specs.md`, `frontend-spec.md`, `frontend-use-case.md`, `frontend-screens.md`

---

## 1. Objetivo do documento

Este documento define a estrutura de rotas do frontend do **Free Chat Maker**, estabelecendo a relação entre:

* rota
* tela associada
* requisito de autenticação
* perfis permitidos
* regras de redirecionamento
* comportamento de guarda de navegação

Este artefato não cria regra de negócio nova. Ele apenas organiza a navegação derivada dos artefatos superiores.

---

## 2. Regra de precedência entre artefatos

Em caso de conflito entre documentos, a precedência obrigatória é:

1. `specs.md`
2. `frontend-spec.md`
3. `frontend-use-case.md`
4. `frontend-screens.md`
5. `frontend-routes.md`

---

## 3. Princípios de roteamento

### 3.1 Rotas públicas

Rotas públicas são acessíveis sem autenticação:

* entrada
* login
* solicitação de cadastro

### 3.2 Rotas autenticadas

Rotas autenticadas exigem sessão válida e usuário apto a acessar áreas protegidas.

### 3.3 Rotas restritas por papel

Rotas administrativas exigem papel `ADMIN`.

### 3.4 Redirecionamento por sessão

Se o usuário já possuir sessão válida:

* acessar `/`, `/login` ou `/cadastro` deve redirecionar para `/salas`

Se o usuário não possuir sessão válida:

* acessar rota autenticada deve redirecionar para `/login`

Se a sessão expirar:

* o frontend deve invalidar a navegação protegida e redirecionar para `/login`

---

## 4. Convenções de acesso

### 4.1 Perfis

* `VISITANTE`
* `ALUNO`
* `PROFESSOR`
* `FUNCIONARIO`
* `ADMIN`

### 4.2 Estados relevantes de autenticação

* `NAO_AUTENTICADO`
* `AUTENTICANDO`
* `AUTENTICADO`
* `PENDENTE_APROVACAO`
* `REJEITADO`
* `BLOQUEADO`
* `SESSAO_EXPIRADA`

### 4.3 Política de acesso

* rotas públicas: acessíveis por `VISITANTE`
* rotas protegidas: acessíveis por usuários autenticados aprovados
* rotas administrativas: acessíveis apenas por `ADMIN`

---

## 5. Tabela canônica de rotas

### 5.1 Rota: Entrada

* **Nome canônico:** `entry`
* **Path:** `/`
* **Tela:** `EntryScreen`
* **Tipo de acesso:** público
* **Perfis:** `VISITANTE`

**Regras de navegação:**

* se houver sessão válida, redirecionar para `/salas`

---

### 5.2 Rota: Login

* **Nome canônico:** `login`
* **Path:** `/login`
* **Tela:** `LoginScreen`
* **Tipo de acesso:** público
* **Perfis:** `VISITANTE`

**Regras de navegação:**

* se houver sessão válida, redirecionar para `/salas`

---

### 5.3 Rota: Solicitação de Cadastro

* **Nome canônico:** `registration-request`
* **Path:** `/cadastro`
* **Tela:** `RegistrationRequestScreen`
* **Tipo de acesso:** público
* **Perfis:** `VISITANTE`

**Regras de navegação:**

* se houver sessão válida, redirecionar para `/salas`

---

### 5.4 Rota: Listagem de Salas

* **Nome canônico:** `rooms-list`
* **Path:** `/salas`
* **Tela:** `RoomsListScreen`
* **Tipo de acesso:** protegido
* **Perfis:** `ALUNO`, `PROFESSOR`, `FUNCIONARIO`, `ADMIN`

**Regras de navegação:**

* exige autenticação
* se não houver sessão válida, redirecionar para `/login`

---

### 5.5 Rota: Criação de Sala

* **Nome canônico:** `room-create`
* **Path:** `/salas/nova`
* **Tela:** `CreateRoomScreen`
* **Tipo de acesso:** protegido
* **Perfis:** `ALUNO`, `PROFESSOR`, `FUNCIONARIO`, `ADMIN`

**Regras de navegação:**

* exige autenticação
* se não houver sessão válida, redirecionar para `/login`

---

### 5.6 Rota: Edição de Sala

* **Nome canônico:** `room-edit`
* **Path:** `/salas/:id/editar`
* **Tela:** `EditRoomScreen`
* **Tipo de acesso:** protegido
* **Perfis:** `ALUNO`, `PROFESSOR`, `FUNCIONARIO`, `ADMIN`

**Regras de navegação:**

* exige autenticação
* o backend continua responsável por validar permissão real de edição
* se não houver sessão válida, redirecionar para `/login`

---

### 5.7 Rota: Sala / Chat

* **Nome canônico:** `room-chat`
* **Path:** `/salas/:id`
* **Tela:** `ChatRoomScreen`
* **Tipo de acesso:** protegido
* **Perfis:** `ALUNO`, `PROFESSOR`, `FUNCIONARIO`, `ADMIN`

**Regras de navegação:**

* exige autenticação
* deve carregar a sala, o histórico e abrir o fluxo WebSocket correspondente
* se não houver sessão válida, redirecionar para `/login`

---

### 5.8 Rota: Painel Administrativo

* **Nome canônico:** `admin-panel`
* **Path:** `/admin`
* **Tela:** `AdminPanelScreen`
* **Tipo de acesso:** protegido e restrito por papel
* **Perfis:** `ADMIN`

**Regras de navegação:**

* exige autenticação
* exige papel `ADMIN`
* se o usuário autenticado não for `ADMIN`, redirecionar para `/salas`

---

## 6. Guardas de navegação

### 6.1 Guarda pública

Aplicada a:

* `/`
* `/login`
* `/cadastro`

Comportamento:

* se o usuário não estiver autenticado, permite acesso
* se o usuário estiver autenticado, redireciona para `/salas`

### 6.2 Guarda autenticada

Aplicada a:

* `/salas`
* `/salas/nova`
* `/salas/:id/editar`
* `/salas/:id`

Comportamento:

* se houver sessão válida, permite acesso
* se não houver sessão válida, redireciona para `/login`

### 6.3 Guarda administrativa

Aplicada a:

* `/admin`

Comportamento:

* se houver sessão válida com papel `ADMIN`, permite acesso
* se houver sessão válida sem papel `ADMIN`, redireciona para `/salas`
* se não houver sessão válida, redireciona para `/login`

---

## 7. Rotas de fallback

### 7.1 Rota não encontrada

Sugestão:

* `/:pathMatch(.*)*`

Comportamento:

* redirecionar para `/`
* opcionalmente exibir uma tela simples de página não encontrada antes do redirecionamento

---

## 8. Critérios de consistência

Uma rota descrita neste documento deve:

* apontar para uma tela descrita em `frontend-screens.md`
* respeitar os perfis e regras definidos em `frontend-spec.md`
* ser compatível com os fluxos de `frontend-use-case.md`
* não contradizer `specs.md`
