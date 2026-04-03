# frontend-spec.md

## Frontend Spec — Free Chat Maker

**Versão:** 0.1.0  
**Status:** Draft  
**Derivado de:** `specs.md`  
**Stack obrigatória:** Vue.js + Vuetify.js

---

## 1. Objetivo do frontend

O frontend do **Free Chat Maker** deve permitir que visitantes, usuários aprovados e administradores interajam com o sistema de forma clara, previsível e coerente com a spec principal.

O frontend:

* expressa visualmente as regras do domínio
* consome contratos do backend HTTP e WebSocket
* controla navegação, estado de interface e sessão do usuário
* não substitui validações de negócio do backend

---

## 2. Princípios de construção

### 2.1 Interface orientada por casos de uso

Cada tela deve existir para atender um fluxo funcional definido nos artefatos do projeto.

### 2.2 UI como expressão de estado

A interface deve refletir, no mínimo:

* estado de autenticação
* estado da sessão
* estado de carregamento
* estado da sala
* estado da mensagem
* estado da conexão WebSocket

### 2.3 Contrato antes de implementação

O frontend deve seguir os contratos e conceitos já definidos na spec principal, especialmente os domínios de:

* usuário
* solicitação de cadastro
* sala
* mensagem
* evento de participação
* log de moderação

### 2.4 Segurança visual e operacional

O frontend deve esconder ou desabilitar ações indisponíveis para o usuário atual, sem assumir responsabilidade pela autorização final.

### 2.5 Tempo real como parte nativa da experiência

O frontend deve reagir a eventos WebSocket relacionados a:

* conexão autenticada
* entrada em sala
* saída de sala
* criação de mensagem
* edição de mensagem
* remoção de mensagem
* erro operacional

---

## 3. Escopo do frontend v1

### 3.1 Em escopo

* solicitação de cadastro
* login
* listagem de salas públicas disponíveis
* entrada em sala
* visualização de histórico de mensagens
* envio de mensagens
* edição de mensagens próprias
* remoção lógica de mensagens próprias
* criação e edição de salas próprias
* painel administrativo simplificado
* aprovação e rejeição de solicitações de cadastro
* ações administrativas básicas previstas na spec principal
* atualização em tempo real via WebSocket

### 3.2 Fora de escopo

* mensagens privadas
* salas privadas
* reações
* anexos
* videochamadas
* agenda
* mural
* mídia educacional embutida
* hierarquia complexa de permissões além dos papéis definidos

---

## 4. Perfis de usuário no frontend

### 4.1 Visitante

Pode:

* acessar tela de login
* acessar tela de solicitação de cadastro

Não pode:

* listar salas
* entrar em salas
* enviar mensagens
* acessar painel administrativo

### 4.2 Usuário autenticado aprovado

Papéis:

* `ALUNO`
* `PROFESSOR`
* `FUNCIONARIO`

Pode:

* listar salas acessíveis
* entrar em salas ativas
* criar salas próprias
* editar ou excluir recursos próprios conforme regra
* enviar, editar e remover mensagens próprias

### 4.3 Administrador

Papel:

* `ADMIN`

Pode:

* tudo que usuário autenticado aprovado pode
* acessar painel administrativo
* aprovar ou rejeitar solicitações de cadastro
* bloquear usuários
* moderar mensagens
* gerenciar salas conforme a spec principal

---

## 5. Estados globais do frontend

### 5.1 Estado de autenticação

O frontend deve prever, no mínimo:

* `NAO_AUTENTICADO`
* `AUTENTICANDO`
* `AUTENTICADO`
* `PENDENTE_APROVACAO`
* `REJEITADO`
* `BLOQUEADO`
* `SESSAO_EXPIRADA`

### 5.2 Estado de carregamento

Cada módulo deve prever:

* `idle`
* `loading`
* `success`
* `empty`
* `error`

### 5.3 Estado de conexão em tempo real

O frontend deve prever:

* `disconnected`
* `connecting`
* `connected`
* `reconnecting`
* `connection_error`

---

## 6. Mapa de telas

### 6.1 Tela de entrada

Objetivo:

* servir como ponto inicial para visitantes

Ações principais:

* ir para login
* ir para solicitação de cadastro

### 6.2 Tela de solicitação de cadastro

Campos obrigatórios comuns:

* `nomeCompleto`
* `cpf`
* `senha`
* `papel`

Campos condicionais:

* `ALUNO`: `serie`, `turma`
* `PROFESSOR`: `departamento` opcional
* `FUNCIONARIO`: `setor` opcional

Estados mínimos:

* formulário inicial
* validando
* enviado com sucesso
* erro de validação
* cpf já existente
* erro interno

### 6.3 Tela de login

Campos mínimos:

* `cpf`
* `senha`

Estados mínimos:

* formulário inicial
* autenticando
* erro de credenciais
* acesso pendente
* acesso rejeitado
* acesso bloqueado
* login concluído

### 6.4 Tela de listagem de salas

Objetivo:

* mostrar as salas públicas visíveis ao usuário autenticado

Elementos mínimos por sala:

* nome
* descrição resumida
* status
* proprietário ou indicador equivalente
* ação de entrar

Regras visuais:

* sala `ATIVA`: ação de entrar habilitada
* sala `SILENCIADA`: indicar restrição de interação
* sala `EXCLUIDA`: não exibir na listagem padrão

### 6.5 Tela de sala / chat

Objetivo:

* permitir visualização do histórico e interação em tempo real

Áreas mínimas:

* cabeçalho da sala
* histórico de mensagens
* eventos de participação
* campo de envio
* ações por mensagem

Comportamentos mínimos:

* carregar histórico em ordem cronológica
* registrar entrada do usuário na sala
* refletir eventos de entrada e saída
* permitir envio de mensagem textual
* permitir envio de trecho de código em formato textual
* impedir mensagem vazia
* reagir a criação, edição e remoção de mensagens

### 6.6 Tela de criação e edição de sala

Campos mínimos:

* `nome`
* `descricao`

Ações possíveis:

* criar sala
* editar sala própria
* excluir logicamente sala própria
* ações administrativas equivalentes quando permitido

### 6.7 Painel administrativo

Módulos mínimos:

* solicitações de cadastro pendentes
* ações de aprovação e rejeição
* usuários e seus estados
* ações administrativas básicas sobre salas e mensagens, quando disponibilizadas pelo backend

---

## 7. Regras de alinhamento com o backend

O frontend deve adotar a nomenclatura funcional já consolidada pelo sistema:

### 7.1 Papéis

* `ADMIN`
* `ALUNO`
* `PROFESSOR`
* `FUNCIONARIO`

### 7.2 Status de usuário

* `PENDENTE`
* `APROVADO`
* `BLOQUEADO`
* `REJEITADO`

### 7.3 Status de sala

* `ATIVA`
* `SILENCIADA`
* `EXCLUIDA`

### 7.4 Eventos WebSocket

* `CONEXAO_AUTENTICADA`
* `ENTRADA_SALA_CONFIRMADA`
* `SAIDA_SALA_CONFIRMADA`
* `PARTICIPANTE_ENTROU`
* `PARTICIPANTE_SAIU`
* `MENSAGEM_CRIADA`
* `MENSAGEM_ATUALIZADA`
* `MENSAGEM_REMOVIDA`
* `ERRO`

Todos os eventos em tempo real devem seguir o contrato:

* `tipo`
* `dados`

---

## 8. Critério de precedência entre artefatos

Este documento é subordinado a `specs.md`.

Se houver conflito entre:

* `specs.md`
* `frontend-spec.md`
* `frontend-use-case.md`

a precedência correta é:

1. `specs.md`
2. `frontend-spec.md`
3. `frontend-use-case.md`

O `frontend-use-case.md` deve sempre ser derivado deste documento e do artefato canônico.
