# Frontend Use Cases

Este documento deriva de:

1. `specs.md`
2. `frontend-spec.md`

Em caso de conflito, a precedência obrigatória é:

1. `specs.md`
2. `frontend-spec.md`
3. `frontend-use-case.md`

---

## UC-01 — Solicitar cadastro

**Objetivo:** permitir que um visitante envie uma solicitação de cadastro para análise administrativa.

**Ator principal:** visitante

**Pré-condições:**

* o usuário não está autenticado
* a tela de cadastro está acessível

**Fluxo principal:**

1. o visitante acessa a tela de cadastro
2. o sistema exibe o formulário de solicitação
3. o visitante informa `nomeCompleto`, `cpf`, `senha` e `papel`
4. se o papel for `ALUNO`, o sistema exige também `serie` e `turma`
5. se o papel for `PROFESSOR`, o sistema permite informar `departamento`
6. se o papel for `FUNCIONARIO`, o sistema permite informar `setor`
7. o visitante envia a solicitação
8. o sistema valida os campos obrigatórios
9. o sistema registra a solicitação com status `PENDENTE`
10. o sistema informa que a solicitação foi enviada com sucesso e está pendente de aprovação

**Fluxos alternativos:**

* 8a. se houver campos obrigatórios ausentes, o sistema exibe erros de validação e impede o envio
* 8b. se o CPF já existir em solicitação ou cadastro aprovado, o sistema informa que o CPF já está em uso
* 8c. se ocorrer erro interno, o sistema exibe mensagem de falha no envio

**Resultado esperado:**

* a solicitação de cadastro fica registrada como `PENDENTE`

---

## UC-02 — Fazer login

**Objetivo:** permitir que um usuário aprovado entre no sistema.

**Ator principal:** usuário aprovado

**Pré-condições:**

* o usuário possui cadastro aprovado
* o usuário não está bloqueado
* a tela de login está acessível

**Fluxo principal:**

1. o usuário acessa a tela de login
2. o sistema exibe os campos de `cpf` e `senha`
3. o usuário informa os dados
4. o usuário envia o formulário
5. o sistema valida os dados informados
6. o sistema autentica o usuário
7. o sistema recebe o token de sessão
8. o sistema armazena a sessão autenticada
9. o sistema redireciona o usuário para a listagem de salas

**Fluxos alternativos:**

* 5a. se `cpf` ou `senha` estiverem vazios, o sistema exibe erro de validação
* 6a. se as credenciais forem inválidas, o sistema informa falha de autenticação
* 6b. se o usuário estiver com status `PENDENTE`, o sistema informa que o cadastro ainda aguarda aprovação
* 6c. se o usuário estiver com status `REJEITADO`, o sistema informa que o acesso foi rejeitado
* 6d. se o usuário estiver com status `BLOQUEADO`, o sistema informa que o acesso está bloqueado

**Resultado esperado:**

* o usuário autenticado acessa a área protegida do sistema

---

## UC-03 — Listar salas

**Objetivo:** permitir que o usuário autenticado visualize as salas públicas disponíveis.

**Ator principal:** usuário autenticado

**Pré-condições:**

* o usuário está autenticado com sessão válida

**Fluxo principal:**

1. o usuário acessa a área autenticada do sistema
2. o sistema solicita a lista de salas disponíveis
3. o sistema recupera apenas salas visíveis ao usuário
4. o sistema exibe a listagem de salas
5. o usuário visualiza nome, descrição e status operacional das salas disponíveis

**Fluxos alternativos:**

* 3a. se não houver salas disponíveis, o sistema exibe estado vazio
* 3b. se ocorrer erro ao carregar as salas, o sistema exibe mensagem de erro e opção de tentar novamente

**Regras observadas na interface:**

* salas `ATIVA` podem ser acessadas normalmente
* salas `SILENCIADA` devem indicar restrição de interação
* salas `EXCLUIDA` não devem aparecer na listagem padrão

**Resultado esperado:**

* o usuário consegue visualizar as salas disponíveis para interação

---

## UC-04 — Entrar em sala

**Objetivo:** permitir que o usuário autenticado entre em uma sala ativa e visualize o histórico.

**Ator principal:** usuário autenticado

**Pré-condições:**

* o usuário está autenticado
* a sala existe
* a sala está com status `ATIVA`

**Fluxo principal:**

1. o usuário seleciona uma sala ativa na listagem
2. o sistema carrega os dados da sala
3. o sistema recupera o histórico de mensagens em ordem cronológica
4. o sistema registra a entrada do usuário na sala
5. o sistema abre ou reutiliza a conexão WebSocket autenticada
6. o sistema exibe a interface do chat
7. o sistema pode refletir visualmente o evento de entrada para os demais participantes

**Fluxos alternativos:**

* 3a. se o histórico não puder ser carregado, o sistema exibe erro e opção de recarregar
* 4a. se a sala não estiver mais acessível, o sistema impede a entrada e informa indisponibilidade
* 5a. se houver falha no canal WebSocket, o sistema informa instabilidade de tempo real e mantém a interface coerente

**Resultado esperado:**

* o usuário entra na sala e visualiza o histórico disponível

---

## UC-05 — Enviar mensagem

**Objetivo:** permitir que o usuário envie mensagem em tempo real dentro de uma sala em que já entrou.

**Ator principal:** usuário autenticado

**Pré-condições:**

* o usuário está autenticado
* o usuário já entrou na sala
* a sala aceita novas mensagens

**Fluxo principal:**

1. o usuário digita uma mensagem
2. o usuário envia a mensagem
3. o sistema valida que a mensagem não está vazia
4. o sistema envia a mensagem pelo canal WebSocket
5. o backend persiste a mensagem
6. o sistema recebe o evento de criação da mensagem em tempo real
7. a nova mensagem aparece na interface da sala

**Fluxos alternativos:**

* 3a. se a mensagem estiver vazia ou contiver apenas espaços, o sistema impede o envio
* 5a. se a sala estiver `SILENCIADA` ou indisponível, o sistema informa que novas mensagens não são permitidas
* 5b. se ocorrer erro no envio, o sistema informa falha e preserva o texto digitado
* 6a. se houver instabilidade no canal em tempo real, o sistema deve refletir o erro e tentar manter a interface coerente

**Resultado esperado:**

* o usuário consegue enviar mensagens válidas em tempo real

---

## UC-06 — Editar mensagem própria

**Objetivo:** permitir que o usuário edite mensagem própria quando a ação estiver disponível.

**Ator principal:** usuário autenticado

**Pré-condições:**

* o usuário está autenticado
* a mensagem pertence ao usuário ou a edição é permitida pelo papel atual
* a mensagem não está removida logicamente

**Fluxo principal:**

1. o usuário aciona a edição de uma mensagem permitida
2. o sistema exibe o conteúdo atual em modo de edição
3. o usuário altera o texto
4. o sistema valida o novo conteúdo
5. o sistema envia a edição ao backend
6. o sistema recebe a confirmação e o evento `MENSAGEM_ATUALIZADA`
7. a interface substitui o conteúdo anterior pelo novo conteúdo

**Fluxos alternativos:**

* 4a. se o novo conteúdo estiver vazio, o sistema impede a confirmação
* 5a. se ocorrer erro na edição, o sistema informa falha e mantém o conteúdo em edição

**Resultado esperado:**

* a mensagem é atualizada na interface de forma consistente

---

## UC-07 — Remover mensagem própria

**Objetivo:** permitir que o usuário remova logicamente uma mensagem permitida.

**Ator principal:** usuário autenticado

**Pré-condições:**

* o usuário está autenticado
* a mensagem pertence ao usuário ou a remoção é permitida pelo papel atual
* a mensagem ainda não foi removida logicamente

**Fluxo principal:**

1. o usuário aciona a remoção de uma mensagem permitida
2. o sistema solicita confirmação, quando aplicável
3. o sistema envia a solicitação ao backend
4. o sistema recebe a confirmação e o evento `MENSAGEM_REMOVIDA`
5. a interface atualiza a mensagem conforme a política visual adotada

**Fluxos alternativos:**

* 3a. se ocorrer erro na remoção, o sistema informa falha e mantém o estado anterior

**Resultado esperado:**

* a remoção lógica é refletida corretamente na interface

---

## UC-08 — Acompanhar eventos de participação

**Objetivo:** permitir que o usuário perceba entradas e saídas de participantes na sala.

**Ator principal:** usuário autenticado

**Pré-condições:**

* o usuário está autenticado
* o usuário está com a sala aberta
* a conexão WebSocket está ativa

**Fluxo principal:**

1. o sistema recebe `PARTICIPANTE_ENTROU` ou `PARTICIPANTE_SAIU`
2. o sistema interpreta o payload do evento
3. o sistema atualiza a interface da sala com o evento visual correspondente

**Fluxos alternativos:**

* 1a. se o evento chegar com inconsistência, o sistema ignora o evento e mantém o estado da tela estável

**Resultado esperado:**

* a interface reflete eventos de participação em tempo real

---

## UC-09 — Operar painel administrativo simplificado

**Objetivo:** permitir que o administrador execute os fluxos administrativos previstos para a versão 1.

**Ator principal:** administrador

**Pré-condições:**

* o usuário está autenticado
* o usuário possui papel `ADMIN`

**Fluxo principal:**

1. o administrador acessa o painel administrativo
2. o sistema exibe os módulos administrativos disponíveis
3. o administrador lista solicitações pendentes
4. o administrador aprova ou rejeita solicitações
5. o administrador executa ações administrativas disponíveis sobre usuários, salas ou mensagens

**Fluxos alternativos:**

* 2a. se não houver dados para o módulo atual, o sistema exibe estado vazio
* 4a. se ocorrer erro ao executar uma ação, o sistema informa falha e mantém a consistência visual
* 5a. se o backend negar a ação por permissão ou regra de negócio, o sistema exibe a resposta correspondente

**Resultado esperado:**

* o administrador consegue operar os fluxos administrativos básicos previstos na versão 1
