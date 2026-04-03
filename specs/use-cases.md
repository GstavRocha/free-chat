# use-cases.md

## Objetivo

Este documento descreve os principais casos de uso do sistema **Free Chat Maker**, detalhando como os atores interagem com a aplicação, quais pré-condições devem ser satisfeitas, quais fluxos principais e alternativos podem ocorrer e quais resultados são esperados ao final de cada interação.

Seu propósito é transformar os requisitos presentes na spec em fluxos operacionais implementáveis, servindo de base para:

* definição de endpoints e eventos
* implementação de controllers e services
* validação de regras de negócio
* elaboração de testes
* organização das tasks de desenvolvimento

Os casos de uso abaixo foram derivados da spec do sistema, que define cadastro com aprovação administrativa, autenticação, salas públicas, mensagens, eventos de participação, moderação, rastreabilidade e controle de acesso por papéis. 

---

## Atores do sistema

### Visitante

Pessoa que ainda não possui acesso autenticado ao sistema e deseja solicitar cadastro.

### Usuário autenticado

Pessoa aprovada no sistema, podendo atuar como:

* ALUNO
* PROFESSOR
* FUNCIONARIO
* ADMIN

### Administrador

Usuário com papel administrativo, responsável por:

* aprovar ou rejeitar solicitações de cadastro
* bloquear usuários
* moderar mensagens
* gerenciar salas
* registrar ações administrativas

---

## Convenções utilizadas

### Pré-condição

Condição que deve ser verdadeira antes do início do caso de uso.

### Pós-condição

Resultado esperado ao final do caso de uso, caso executado com sucesso.

### Fluxo principal

Sequência normal de execução do caso de uso.

### Fluxo alternativo

Variação do fluxo principal causada por erro, bloqueio, ausência de permissão ou outra condição especial.

---

## UC-01 — Solicitar cadastro

**Atores:** Visitante

**Descrição:**
Permite que uma pessoa solicite acesso ao sistema por meio do preenchimento do formulário de cadastro.

**Pré-condições:**

* o visitante não está autenticado
* o CPF ainda não pertence a um usuário já aprovado no sistema

**Pós-condições:**

* uma solicitação de cadastro é registrada com status `PENDENTE`

**Fluxo principal:**

1. O visitante acessa a tela de cadastro.
2. O sistema exibe o formulário de solicitação.
3. O visitante informa os dados obrigatórios.
4. O sistema valida os campos preenchidos.
5. O sistema verifica se o CPF informado não conflita com um usuário já aceito.
6. O sistema registra a solicitação de cadastro.
7. O sistema informa que a solicitação foi enviada para análise administrativa.

**Fluxos alternativos:**

* 4A. Dados obrigatórios ausentes ou inválidos:

  1. O sistema rejeita o envio.
  2. O sistema informa os campos que precisam ser corrigidos.
* 5A. CPF já cadastrado:

  1. O sistema rejeita a solicitação.
  2. O sistema informa que o CPF já possui vínculo no sistema.

---

## UC-02 — Aprovar solicitação de cadastro

**Atores:** Administrador

**Descrição:**
Permite que o administrador aprove uma solicitação de cadastro pendente, viabilizando o acesso do usuário ao sistema.

**Pré-condições:**

* o administrador está autenticado
* o administrador possui papel `ADMIN`
* existe uma solicitação de cadastro pendente

**Pós-condições:**

* a solicitação passa para status `APROVADA`
* o usuário correspondente fica apto a autenticar-se no sistema

**Fluxo principal:**

1. O administrador acessa o painel administrativo.
2. O sistema exibe a lista de solicitações pendentes.
3. O administrador seleciona uma solicitação.
4. O sistema exibe os dados da solicitação.
5. O administrador aprova a solicitação.
6. O sistema registra a revisão administrativa.
7. O sistema atualiza o status da solicitação para `APROVADA`.
8. O sistema cria ou habilita o usuário correspondente.
9. O sistema registra a ação para fins de auditoria.

**Fluxos alternativos:**

* 2A. Não existem solicitações pendentes:

  1. O sistema informa que não há solicitações para análise.
* 5A. Usuário sem permissão administrativa:

  1. O sistema bloqueia a ação.
  2. O sistema retorna erro de autorização.

---

## UC-03 — Rejeitar solicitação de cadastro

**Atores:** Administrador

**Descrição:**
Permite que o administrador rejeite uma solicitação de acesso.

**Pré-condições:**

* o administrador está autenticado
* o administrador possui papel `ADMIN`
* existe uma solicitação pendente

**Pós-condições:**

* a solicitação passa para status `REJEITADA`
* o motivo da rejeição fica registrado

**Fluxo principal:**

1. O administrador acessa a lista de solicitações.
2. Seleciona uma solicitação pendente.
3. Informa o motivo da rejeição.
4. O sistema atualiza o status da solicitação para `REJEITADA`.
5. O sistema registra quem realizou a revisão e o motivo.
6. O sistema armazena o evento para auditoria.

**Fluxos alternativos:**

* 3A. Motivo não informado:

  1. O sistema rejeita a operação.
  2. O sistema solicita o preenchimento do motivo.
* 2A. Solicitação já revisada:

  1. O sistema impede nova revisão.
  2. O sistema informa o status atual da solicitação.

---

## UC-04 — Autenticar usuário

**Atores:** Usuário autenticado

**Descrição:**
Permite que um usuário aprovado acesse o sistema com CPF e senha.

**Pré-condições:**

* o usuário existe no sistema
* o usuário possui status `APROVADO`
* a senha informada corresponde ao hash armazenado

**Pós-condições:**

* o usuário recebe autenticação válida
* o sistema libera acesso conforme seu papel

**Fluxo principal:**

1. O usuário acessa a tela de login.
2. O sistema exibe o formulário de autenticação.
3. O usuário informa CPF e senha.
4. O sistema localiza o usuário.
5. O sistema verifica o status do usuário.
6. O sistema compara a senha informada com `senha_hash`.
7. O sistema gera um token JWT.
8. O sistema retorna autenticação bem-sucedida.
9. O sistema redireciona o usuário para a área principal.

**Fluxos alternativos:**

* 4A. Usuário não encontrado:

  1. O sistema rejeita a autenticação.
  2. O sistema informa credenciais inválidas.
* 5A. Usuário com status `PENDENTE`:

  1. O sistema bloqueia o acesso.
  2. O sistema informa que o cadastro ainda não foi aprovado.
* 5B. Usuário com status `BLOQUEADO`:

  1. O sistema bloqueia o acesso.
  2. O sistema informa que a conta está bloqueada.
* 6A. Senha inválida:

  1. O sistema rejeita a autenticação.
  2. O sistema informa credenciais inválidas.

---

## UC-05 — Criar sala pública

**Atores:** Usuário autenticado

**Descrição:**
Permite que um usuário autenticado crie uma sala pública.

**Pré-condições:**

* o usuário está autenticado
* o usuário possui permissão para criar salas
* o usuário não está bloqueado

**Pós-condições:**

* uma nova sala é criada com status `ATIVA`
* a sala fica associada ao seu proprietário

**Fluxo principal:**

1. O usuário acessa a funcionalidade de criação de sala.
2. O sistema exibe o formulário da sala.
3. O usuário informa nome e descrição.
4. O sistema valida os dados.
5. O sistema cria a sala.
6. O sistema associa a sala ao usuário criador.
7. O sistema registra a data de criação.
8. O sistema exibe confirmação de sucesso.

**Fluxos alternativos:**

* 4A. Nome da sala não informado:

  1. O sistema rejeita a criação.
  2. O sistema solicita o preenchimento do nome.
* 1A. Usuário sem permissão:

  1. O sistema bloqueia o acesso à funcionalidade.
  2. O sistema retorna erro de autorização.

---

## UC-06 — Editar sala própria

**Atores:** Usuário autenticado, Administrador

**Descrição:**
Permite alterar dados de uma sala existente.

**Pré-condições:**

* o usuário está autenticado
* o usuário é proprietário da sala ou possui papel `ADMIN`
* a sala existe

**Pós-condições:**

* os dados da sala são atualizados

**Fluxo principal:**

1. O usuário acessa os detalhes de uma sala.
2. O sistema verifica se ele possui permissão de edição.
3. O sistema exibe o formulário de edição.
4. O usuário altera os dados permitidos.
5. O sistema valida as alterações.
6. O sistema atualiza a sala.
7. O sistema registra a atualização.

**Fluxos alternativos:**

* 2A. Usuário não é proprietário e não é administrador:

  1. O sistema bloqueia a edição.
  2. O sistema informa falta de permissão.
* 5A. Dados inválidos:

  1. O sistema rejeita a atualização.
  2. O sistema solicita correção.

---

## UC-07 — Silenciar sala

**Atores:** Administrador

**Descrição:**
Permite que o administrador altere o status de uma sala para `SILENCIADA`, impedindo novas interações comuns.

**Pré-condições:**

* o administrador está autenticado
* o administrador possui papel `ADMIN`
* a sala existe

**Pós-condições:**

* a sala passa para status `SILENCIADA`
* usuários comuns deixam de interagir normalmente nela

**Fluxo principal:**

1. O administrador acessa o painel de gerenciamento de salas.
2. O sistema exibe as salas disponíveis.
3. O administrador seleciona uma sala.
4. O administrador solicita silenciamento.
5. O sistema altera o status da sala para `SILENCIADA`.
6. O sistema registra o evento em log de moderação.
7. O sistema confirma a operação.

**Fluxos alternativos:**

* 3A. Sala inexistente:

  1. O sistema informa que a sala não foi encontrada.
* 4A. Usuário sem papel administrativo:

  1. O sistema nega a operação.

---

## UC-08 — Excluir logicamente sala

**Atores:** Administrador

**Descrição:**
Permite que o administrador realize a exclusão lógica de uma sala.

**Pré-condições:**

* o administrador está autenticado
* o administrador possui papel `ADMIN`
* a sala existe

**Pós-condições:**

* a sala fica com status `EXCLUIDA`
* a data de exclusão lógica é registrada

**Fluxo principal:**

1. O administrador acessa a gestão de salas.
2. Seleciona uma sala.
3. Solicita a exclusão.
4. O sistema aplica exclusão lógica.
5. O sistema altera o status da sala para `EXCLUIDA`.
6. O sistema registra `excluido_em`.
7. O sistema grava a ação em log de moderação.

**Fluxos alternativos:**

* 2A. Sala não encontrada:

  1. O sistema informa erro.
* 3A. Operação sem autorização:

  1. O sistema nega a exclusão.

---

## UC-09 — Listar salas disponíveis

**Atores:** Usuário autenticado

**Descrição:**
Permite consultar as salas públicas disponíveis ao uso normal.

**Pré-condições:**

* o usuário está autenticado
* o usuário possui status `APROVADO`

**Pós-condições:**

* o sistema retorna a lista de salas acessíveis

**Fluxo principal:**

1. O usuário acessa a área principal.
2. O sistema consulta as salas com status compatível com o uso normal.
3. O sistema exibe a listagem de salas.
4. O usuário pode selecionar uma sala para entrar.

**Fluxos alternativos:**

* 2A. Nenhuma sala disponível:

  1. O sistema informa que não há salas disponíveis.

---

## UC-10 — Entrar em sala

**Atores:** Usuário autenticado

**Descrição:**
Permite que o usuário entre em uma sala existente e passe a participar do contexto da conversa.

**Pré-condições:**

* o usuário está autenticado
* o usuário possui status `APROVADO`
* a sala existe
* a sala não está em status `EXCLUIDA`

**Pós-condições:**

* o sistema registra o evento de entrada
* o usuário passa a visualizar o histórico da sala
* o canal em tempo real pode ser aberto

**Fluxo principal:**

1. O usuário seleciona uma sala.
2. O sistema verifica se a sala existe e está acessível.
3. O sistema registra um evento de participação do tipo `ENTRADA`.
4. O sistema carrega o histórico da sala.
5. O sistema libera a interface de interação em sala.
6. O sistema pode exibir aos demais participantes um evento visual de entrada.

**Fluxos alternativos:**

* 2A. Sala com status `EXCLUIDA`:

  1. O sistema bloqueia o acesso.
  2. O sistema informa indisponibilidade.
* 2B. Sala com status `SILENCIADA`:

  1. O sistema permite apenas leitura, caso a política assim defina, ou bloqueia acesso conforme regra adotada.
* 3A. Falha no registro do evento:

  1. O sistema registra erro técnico.
  2. O sistema pode impedir ou continuar a entrada conforme política de resiliência.

---

## UC-11 — Sair da sala

**Atores:** Usuário autenticado

**Descrição:**
Permite registrar que o usuário deixou uma sala.

**Pré-condições:**

* o usuário está autenticado
* o usuário está vinculado à sessão ativa de uma sala

**Pós-condições:**

* o sistema registra um evento de saída
* a conexão em tempo real da sala é encerrada ou atualizada

**Fluxo principal:**

1. O usuário solicita saída da sala ou fecha a sessão correspondente.
2. O sistema registra um evento de participação do tipo `SAIDA`.
3. O sistema atualiza o estado da participação.
4. O sistema pode notificar visualmente os demais participantes.

**Fluxos alternativos:**

* 2A. Falha no registro do evento:

  1. O sistema registra erro técnico.
  2. O encerramento de interface pode prosseguir conforme política do sistema.

---

## UC-12 — Consultar histórico da sala

**Atores:** Usuário autenticado

**Descrição:**
Permite visualizar as mensagens persistidas de uma sala.

**Pré-condições:**

* o usuário está autenticado
* a sala existe
* o usuário possui permissão de acesso à sala

**Pós-condições:**

* o histórico da sala é exibido em ordem cronológica

**Fluxo principal:**

1. O usuário entra na sala.
2. O sistema consulta as mensagens da sala.
3. O sistema ordena as mensagens por data de criação.
4. O sistema exibe o histórico ao usuário.

**Fluxos alternativos:**

* 2A. Não existem mensagens:

  1. O sistema exibe histórico vazio.
* 2B. Sala inacessível:

  1. O sistema impede a consulta.

---

## UC-13 — Enviar mensagem textual

**Atores:** Usuário autenticado

**Descrição:**
Permite que o usuário envie uma mensagem textual em uma sala.

**Pré-condições:**

* o usuário está autenticado
* o usuário possui status `APROVADO`
* o usuário está em uma sala válida
* a sala aceita novas mensagens

**Pós-condições:**

* a mensagem é persistida
* a mensagem é distribuída em tempo real aos participantes da sala

**Fluxo principal:**

1. O usuário digita uma mensagem textual.
2. O sistema recebe o conteúdo.
3. O sistema valida se a mensagem não está vazia.
4. O sistema verifica se a sala aceita novas mensagens.
5. O sistema cria o registro da mensagem com tipo `TEXTO`.
6. O sistema persiste a mensagem no banco.
7. O sistema distribui a mensagem aos clientes conectados à sala.
8. O sistema atualiza a interface do remetente e dos demais participantes.

**Fluxos alternativos:**

* 3A. Mensagem vazia:

  1. O sistema rejeita o envio.
  2. O sistema informa erro de validação.
* 4A. Sala silenciada:

  1. O sistema bloqueia o envio.
  2. O sistema informa que a sala não aceita novas mensagens.
* 4B. Usuário bloqueado:

  1. O sistema nega a interação.

---

## UC-14 — Enviar mensagem de código

**Atores:** Usuário autenticado

**Descrição:**
Permite enviar um trecho de código ou script em uma sala.

**Pré-condições:**

* o usuário está autenticado
* o usuário está em uma sala válida
* a sala aceita novas mensagens

**Pós-condições:**

* uma mensagem do tipo `CODIGO` é persistida
* o conteúdo é distribuído em tempo real

**Fluxo principal:**

1. O usuário acessa a funcionalidade de envio de código.
2. O usuário informa o conteúdo do trecho de código.
3. O sistema valida o conteúdo.
4. O sistema cria a mensagem com tipo `CODIGO`.
5. O sistema persiste a mensagem.
6. O sistema distribui a mensagem aos participantes da sala.

**Fluxos alternativos:**

* 3A. Conteúdo vazio:

  1. O sistema rejeita o envio.
* 4A. Sala silenciada:

  1. O sistema bloqueia o envio.

---

## UC-15 — Editar mensagem própria

**Atores:** Usuário autenticado, Administrador

**Descrição:**
Permite alterar o conteúdo de uma mensagem já enviada.

**Pré-condições:**

* a mensagem existe
* o usuário é o autor da mensagem ou possui papel `ADMIN`

**Pós-condições:**

* o conteúdo da mensagem é atualizado
* a alteração é persistida

**Fluxo principal:**

1. O usuário seleciona uma mensagem.
2. O sistema verifica se ele pode editar a mensagem.
3. O usuário informa o novo conteúdo.
4. O sistema valida o conteúdo.
5. O sistema atualiza a mensagem.
6. O sistema registra `atualizado_em`.
7. O sistema atualiza a exibição para os participantes.

**Fluxos alternativos:**

* 2A. Usuário sem permissão:

  1. O sistema nega a edição.
* 4A. Conteúdo inválido:

  1. O sistema rejeita a alteração.

---

## UC-16 — Excluir logicamente mensagem própria

**Atores:** Usuário autenticado, Administrador

**Descrição:**
Permite realizar exclusão lógica de uma mensagem.

**Pré-condições:**

* a mensagem existe
* o usuário é o autor ou possui papel `ADMIN`

**Pós-condições:**

* a mensagem deixa de aparecer normalmente no fluxo
* o registro continua preservado para rastreabilidade

**Fluxo principal:**

1. O usuário seleciona uma mensagem.
2. Solicita exclusão.
3. O sistema verifica permissão.
4. O sistema aplica exclusão lógica.
5. O sistema registra `excluido_em`.
6. O sistema atualiza a interface da sala.

**Fluxos alternativos:**

* 3A. Usuário sem permissão:

  1. O sistema nega a exclusão.
* 1A. Mensagem inexistente:

  1. O sistema retorna erro.

---

## UC-17 — Bloquear usuário

**Atores:** Administrador

**Descrição:**
Permite que o administrador bloqueie um usuário, impedindo novas autenticações e interações.

**Pré-condições:**

* o administrador está autenticado
* o administrador possui papel `ADMIN`
* o usuário alvo existe

**Pós-condições:**

* o usuário alvo passa a ter status `BLOQUEADO`
* a ação fica registrada em log de moderação

**Fluxo principal:**

1. O administrador acessa a gestão de usuários.
2. Seleciona um usuário alvo.
3. Solicita bloqueio.
4. O sistema atualiza o status do usuário para `BLOQUEADO`.
5. O sistema registra a ação em log de moderação.
6. O sistema confirma a operação.

**Fluxos alternativos:**

* 2A. Usuário não encontrado:

  1. O sistema retorna erro.
* 3A. Operação inválida sobre administrador protegido, se a política prever:

  1. O sistema nega a operação.

---

## UC-18 — Moderar mensagem

**Atores:** Administrador

**Descrição:**
Permite que o administrador atue sobre uma mensagem inadequada.

**Pré-condições:**

* o administrador está autenticado
* o administrador possui papel `ADMIN`
* a mensagem existe

**Pós-condições:**

* a mensagem sofre a ação administrativa definida
* a operação é registrada em log de moderação

**Fluxo principal:**

1. O administrador localiza uma mensagem.
2. Analisa o conteúdo.
3. Seleciona a ação de moderação.
4. O sistema executa a ação correspondente.
5. O sistema registra o motivo.
6. O sistema grava o log de moderação.
7. O sistema atualiza o estado visível da sala.

**Fluxos alternativos:**

* 1A. Mensagem não encontrada:

  1. O sistema informa erro.
* 3A. Ação não permitida:

  1. O sistema bloqueia a operação.

---

## UC-19 — Enviar aviso de moderação para a sala

**Atores:** Administrador

**Descrição:**
Permite que o administrador envie um aviso de moderação visível aos participantes da sala.

**Pré-condições:**

* o administrador está autenticado
* o administrador possui papel `ADMIN`
* a sala existe

**Pós-condições:**

* uma mensagem do tipo `AVISO_MODERACAO` é registrada na sala
* o evento fica disponível no histórico

**Fluxo principal:**

1. O administrador acessa uma sala.
2. Seleciona a opção de aviso de moderação.
3. Informa o conteúdo do aviso.
4. O sistema valida o conteúdo.
5. O sistema cria uma mensagem do tipo `AVISO_MODERACAO`.
6. O sistema persiste a mensagem.
7. O sistema distribui o aviso em tempo real aos participantes.
8. O sistema registra a ação em log de moderação.

**Fluxos alternativos:**

* 4A. Aviso vazio:

  1. O sistema rejeita a operação.
* 1A. Sala inexistente:

  1. O sistema retorna erro.

---

## UC-20 — Consultar logs de moderação

**Atores:** Administrador

**Descrição:**
Permite consultar o histórico de ações administrativas e de moderação.

**Pré-condições:**

* o administrador está autenticado
* o administrador possui papel `ADMIN`

**Pós-condições:**

* o sistema exibe registros administrativos persistidos

**Fluxo principal:**

1. O administrador acessa a funcionalidade de auditoria.
2. O sistema consulta os logs de moderação.
3. O sistema exibe os registros com:

   * administrador executor
   * alvo
   * tipo de ação
   * motivo
   * data e hora
4. O administrador analisa os registros.

**Fluxos alternativos:**

* 2A. Não existem logs:

  1. O sistema informa ausência de registros.

