# domain-model.md

## Objetivo

Este documento descreve o modelo de domínio do sistema Free Chat Maker.
Seu propósito é definir as entidades centrais, seus atributos, relacionamentos,
estados e regras de negócio, servindo como base para o banco de dados,
API e implementação do sistema.

---

## Visão geral do domínio

O Free Chat Maker é um sistema de comunicação institucional escolar.
Nele, usuários de diferentes perfis solicitam cadastro, passam por aprovação
administrativa e, quando autenticados, podem acessar salas públicas, participar
de conversas em tempo real e trocar mensagens.
O sistema também contempla moderação, rastreabilidade de ações e governança
administrativa sobre usuários, salas e mensagens.

---

## Entidades do domínio

### 1. Usuário

**Descrição**  
Representa uma pessoa que pode acessar ou tentar acessar o sistema.

**Atributos**
- id
- full_name
- cpf
- password_hash
- role
- status
- grade
- class_group
- department
- sector
- created_at
- updated_at

**Observações**
- `grade` e `class_group` são aplicáveis principalmente a alunos
- `department` pode ser usado para professores
- `sector` pode ser usado para funcionários

**Papéis possíveis**
- ADMIN
- STUDENT
- TEACHER
- STAFF

**Estados possíveis**
- PENDING
- APPROVED
- BLOCKED
- REJECTED

**Regras**
- CPF deve ser único
- senha nunca é armazenada em texto puro
- apenas usuários APPROVED podem autenticar e usar o sistema
- usuários BLOCKED não podem acessar o sistema

---

### 2. Solicitação de Cadastro

**Descrição**  
Representa a solicitação inicial de cadastro feita por um usuário ainda não aprovado.

**Atributos**
- id
- requested_name
- requested_cpf
- requested_role
- requested_grade
- requested_class_group
- requested_department
- requested_sector
- request_status
- created_at
- reviewed_at
- reviewed_by
- review_reason

**Estados possíveis**
- PENDING
- APPROVED
- REJECTED

**Regras**
- toda solicitação começa em estado PENDING
- apenas administradores podem aprovar ou rejeitar
- uma solicitação aprovada deve resultar na criação ou ativação de um Usuário
- o CPF da solicitação não pode conflitar com um CPF já aceito

---

### 3. Sala

**Descrição**  
Representa uma sala pública de conversa.

**Atributos**
- id
- name
- description
- owner_id
- status
- created_at
- updated_at

**Estados possíveis**
- ACTIVE
- SILENCED
- DELETED

**Regras**
- toda sala deve possuir um criador identificado
- apenas salas ACTIVE podem ser acessadas normalmente
- salas SILENCED não devem aceitar novas interações
- exclusão pode ser lógica em vez de física

---

### 4. Mensagem

**Descrição**  
Representa uma mensagem enviada por um usuário dentro de uma sala.

**Atributos**
- id
- room_id
- author_id
- content
- message_type
- created_at
- updated_at
- deleted_at

**Tipos possíveis**
- TEXT
- CODE_SNIPPET
- SYSTEM_EVENT
- MODERATION_NOTICE

**Regras**
- toda mensagem pertence a uma sala
- toda mensagem pertence a um autor
- não pode existir mensagem vazia
- mensagens devem ser recuperadas em ordem cronológica
- mensagens do tipo CODE_SNIPPET devem manter integridade do conteúdo enviado
- exclusão preferencialmente deve preservar rastreabilidade administrativa

---

### 5. Evento de Participação em Sala

**Descrição**  
Representa eventos de entrada, saída ou presença do usuário em uma sala.

**Atributos**
- id
- room_id
- user_id
- event_type
- created_at

**Tipos possíveis**
- ENTER
- LEAVE

**Regras**
- entrada em sala pode gerar evento visível aos participantes
- eventos de participação podem ser usados para rastreabilidade e presença contextual

---

### 6. Log de Moderação

**Descrição**  
Representa o registro de ações administrativas e de moderação.

**Atributos**
- id
- admin_id
- target_user_id
- target_room_id
- target_message_id
- action_type
- reason
- created_at

**Tipos de ação possíveis**
- APPROVE_USER
- REJECT_USER
- BLOCK_USER
- DELETE_MESSAGE
- SILENCE_ROOM
- DELETE_ROOM
- SEND_MODERATION_NOTICE

**Regras**
- toda ação de moderação deve ficar registrada
- ações administrativas precisam guardar autor, alvo, motivo e data/hora

---

## Relacionamentos do domínio

### Usuário → Sala
Um usuário pode criar muitas salas.  
Uma sala possui um único criador.

**Cardinalidade**
- Usuário 1:N Sala

---

### Usuário → Mensagem
Um usuário pode enviar muitas mensagens.  
Uma mensagem possui um único autor.

**Cardinalidade**
- Usuário 1:N Mensagem

---

### Sala → Mensagem
Uma sala pode conter muitas mensagens.  
Uma mensagem pertence a uma única sala.

**Cardinalidade**
- Sala 1:N Mensagem

---

### Usuário → Solicitação de Cadastro
Um usuário aprovado pode ter se originado de uma solicitação de cadastro.  
Uma solicitação pode originar um único usuário aprovado.

**Cardinalidade**
- Solicitação de Cadastro 1:0..1 Usuário

---

### Usuário → Evento de Participação em Sala
Um usuário pode gerar muitos eventos de participação.  
Cada evento pertence a um único usuário.

**Cardinalidade**
- Usuário 1:N Evento de Participação em Sala

---

### Sala → Evento de Participação em Sala
Uma sala pode possuir muitos eventos de participação.  
Cada evento pertence a uma única sala.

**Cardinalidade**
- Sala 1:N Evento de Participação em Sala

---

### Usuário → Log de Moderação
Um administrador pode gerar muitos registros de moderação.  
Cada registro possui um administrador responsável.

**Cardinalidade**
- Usuário 1:N Log de Moderação

---

## Regras transversais do domínio

- somente usuários aprovados podem autenticar
- somente usuários autenticados podem criar salas, entrar em salas e enviar mensagens
- administradores possuem poderes de aprovação, bloqueio, moderação e governança
- toda mensagem, sala e ação administrativa deve ser rastreável
- o sistema deve distinguir papéis de usuário por RBAC
- o domínio deve suportar comunicação em tempo real via WebSocket
- o domínio deve permitir futura expansão sem quebrar as entidades centrais

---

## Eventos importantes do domínio

### UserRegistered
Ocorre quando uma solicitação de cadastro é criada.

### UserApproved
Ocorre quando o administrador aprova um cadastro.

### UserBlocked
Ocorre quando o administrador bloqueia um usuário.

### RoomCreated
Ocorre quando uma nova sala é criada.

### UserEnteredRoom
Ocorre quando um usuário entra em uma sala.

### MessageSent
Ocorre quando uma mensagem é enviada.

### MessageModerated
Ocorre quando uma mensagem sofre ação administrativa.
