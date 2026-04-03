# tasks.md

## Objetivo

Este documento organiza as tarefas necessárias para implementar o sistema **Free Chat Maker** a partir da arquitetura definida e dos artefatos de especificação disponíveis.

Seu propósito é transformar requisitos, regras de negócio, modelo de domínio, desenho de banco e decisões arquiteturais em um plano de desenvolvimento executável, incremental e tecnicamente consistente com a stack adotada.

O foco deste plano é:

* orientar a implementação em ordem de dependências
* reduzir retrabalho estrutural
* permitir entregas incrementais
* acelerar a construção de um MVP funcional
* preparar a base para evolução futura com menor acoplamento

---

## Estratégia de desenvolvimento

A estratégia de desenvolvimento do Free Chat Maker será incremental, priorizando primeiro a fundação técnica e depois os fluxos de maior valor funcional.

A ordem principal será:

* backend primeiro
* depois tempo real
* depois frontend
* depois moderação
* depois refinamento

Essa ordem foi escolhida porque:

* o backend define contratos, regras e persistência
* o chat em tempo real depende de autenticação, salas e mensagens já implementadas
* o frontend fica mais estável quando consome contratos já definidos
* a moderação depende do domínio principal já funcional
* o refinamento deve ocorrer sobre uma base integrada e testável

O objetivo inicial é atingir um **MVP funcional**, com fluxo completo de autenticação, criação de sala, entrada em sala, envio de mensagem e broadcast em tempo real.

---

## Fases do desenvolvimento

### FASE 1 — Infraestrutura

**objetivo**

Preparar a base do projeto, ambiente de execução, estrutura inicial dos serviços e padronização de desenvolvimento.

**resultado esperado**

Projeto com backend, frontend e banco executando via Docker Compose, com estrutura mínima organizada e ambiente pronto para desenvolvimento.

### FASE 2 — Banco de dados

**objetivo**

Implementar a base relacional do sistema conforme o desenho de banco e o modelo de domínio.

**resultado esperado**

Banco PostgreSQL estruturado com migrations, models Sequelize, enums, índices e associações validados.

### FASE 3 — Backend Core

**objetivo**

Criar a fundação do backend em Express com organização modular, tratamento de erros e camadas internas definidas.

**resultado esperado**

Servidor backend funcional com estrutura de módulos, middlewares, rotas base e tratamento consistente de erros.

### FASE 4 — Autenticação

**objetivo**

Implementar autenticação segura, emissão de JWT, proteção de rotas e validação de status e papel do usuário.

**resultado esperado**

Sistema autenticado com login por CPF e senha, controle de acesso e autorização básica por papel.

### FASE 5 — Domínio do chat

**objetivo**

Implementar os fluxos centrais do domínio: usuários, solicitações, salas, mensagens, participação e rastreabilidade mínima.

**resultado esperado**

API funcional para os recursos principais do sistema, incluindo histórico de mensagens e persistência dos eventos centrais.

### FASE 6 — Tempo real

**objetivo**

Adicionar comunicação em tempo real ao domínio já persistente e autenticado.

**resultado esperado**

Mensageria via WebSocket funcionando com autenticação, entrada em sala, broadcast e eventos de participação.

### FASE 7 — Frontend

**objetivo**

Construir a interface web do sistema sobre contratos backend já estabilizados.

**resultado esperado**

Frontend navegável e funcional com login, cadastro, dashboard, salas, chat e área administrativa básica.

### FASE 8 — Moderação

**objetivo**

Implementar os fluxos administrativos de controle e rastreabilidade sobre usuários, salas e mensagens.

**resultado esperado**

Painel e APIs de moderação funcionando com bloqueio, silenciamento, remoção e logs administrativos.

### FASE 9 — Integração

**objetivo**

Garantir a integração consistente entre frontend, backend, banco e WebSocket.

**resultado esperado**

Fluxos ponta a ponta estáveis, com autenticação compartilhada, tratamento de erros e contratos coerentes.

### FASE 10 — Qualidade

**objetivo**

Melhorar confiabilidade, robustez e manutenção do sistema.

**resultado esperado**

Validações reforçadas, tratamento técnico de erros, observabilidade mínima e cobertura inicial de testes.

### FASE 11 — Deploy

**objetivo**

Preparar o sistema para execução padronizada em ambiente de entrega.

**resultado esperado**

Aplicação empacotada com configuração de produção, scripts operacionais e base pronta para publicação.

---

## FASE 1 — Infraestrutura

1. Criar repositório do projeto com estrutura raiz para `backend`, `frontend` e arquivos de infraestrutura.
2. Criar estrutura inicial do backend em Node.js.
3. Criar estrutura inicial do frontend em Vue.js com Vuetify.
4. Configurar `Dockerfile` do backend.
5. Configurar `Dockerfile` do frontend.
6. Configurar `docker-compose.yml` com serviços de frontend, backend e PostgreSQL.
7. Configurar container PostgreSQL com volume persistente.
8. Configurar arquivo `.env.example` com variáveis de ambiente do sistema.
9. Configurar carregamento de variáveis de ambiente no backend com `dotenv`.
10. Configurar ESLint no backend.
11. Configurar ESLint no frontend.
12. Configurar Prettier no projeto.
13. Definir scripts de execução local para backend e frontend.
14. Validar subida completa do ambiente com Docker Compose.

---

## FASE 2 — Banco de dados

1. Configurar conexão Sequelize com PostgreSQL.
2. Criar model Sequelize `Usuario`.
3. Criar model Sequelize `SolicitacaoCadastro`.
4. Criar model Sequelize `Sala`.
5. Criar model Sequelize `Mensagem`.
6. Criar model Sequelize `EventoParticipacao`.
7. Criar model Sequelize `LogModeracao`.
8. Criar enums de papel de usuário.
9. Criar enums de status de usuário.
10. Criar enums de status de sala.
11. Criar enums de tipo de mensagem.
12. Criar enums de tipo de evento de participação.
13. Criar enums de tipo de ação de moderação.
14. Criar migration da tabela `usuarios`.
15. Criar migration da tabela `solicitacoes_cadastro`.
16. Criar migration da tabela `salas`.
17. Criar migration da tabela `mensagens`.
18. Criar migration da tabela `eventos_participacao`.
19. Criar migration da tabela `logs_moderacao`.
20. Criar índice único para `usuarios.cpf`.
21. Criar índice de busca para `mensagens.sala_id` e `mensagens.criado_em`.
22. Criar índice para `salas.proprietario_id`.
23. Criar índice para `eventos_participacao.sala_id`.
24. Criar índice para `logs_moderacao.administrador_id`.
25. Configurar associações Sequelize entre usuários e salas.
26. Configurar associações Sequelize entre usuários e mensagens.
27. Configurar associações Sequelize entre salas e mensagens.
28. Configurar associações Sequelize entre usuários e eventos de participação.
29. Configurar associações Sequelize entre salas e eventos de participação.
30. Configurar associações Sequelize entre logs de moderação e seus alvos possíveis.
31. Validar execução das migrations em ambiente local.
32. Testar conexão do backend com o banco.

---

## FASE 3 — Backend Core

1. Criar estrutura base de pastas `controllers`, `services`, `repositories`, `middlewares`, `validators` e `config`.
2. Organizar backend por módulos de domínio: `auth`, `usuarios`, `solicitacoes_cadastro`, `salas`, `mensagens`, `participacao`, `moderacao` e `websocket`.
3. Criar servidor Express principal.
4. Configurar carregamento central de ambiente e config.
5. Configurar parser JSON e middlewares globais.
6. Configurar rota de health check.
7. Configurar roteador principal da API.
8. Criar estrutura base de controllers por módulo.
9. Criar estrutura base de services por módulo.
10. Criar estrutura base de repositories por módulo.
11. Criar middleware global de tratamento de erro.
12. Criar classe ou padrão de erro de aplicação.
13. Criar camada base de validação de payload.
14. Configurar logging técnico básico no backend.
15. Padronizar formato de resposta de erro da API.

---

## FASE 4 — Autenticação

1. Implementar serviço de hash de senha com `bcrypt`.
2. Implementar comparação segura de senha.
3. Criar endpoint de login com CPF e senha.
4. Validar existência do usuário no login.
5. Validar status do usuário no login.
6. Bloquear autenticação de usuários `PENDENTE`, `REJEITADO` e `BLOQUEADO`.
7. Implementar geração de JWT.
8. Definir payload mínimo do token com `id` e `papel`.
9. Criar middleware de autenticação por JWT.
10. Criar middleware RBAC por papel.
11. Criar middleware de verificação de status do usuário autenticado.
12. Aplicar proteção nas rotas privadas.
13. Criar teste manual de login válido e inválido.

---

## FASE 5 — Domínio do chat

1. Implementar CRUD de usuários com foco administrativo.
2. Implementar criação de solicitação de cadastro.
3. Implementar listagem de solicitações de cadastro para administrador.
4. Implementar aprovação de solicitação de cadastro.
5. Implementar rejeição de solicitação de cadastro.
6. Implementar atualização de status do usuário após revisão administrativa.
7. Implementar criação de sala pública.
8. Implementar edição de sala pública pelo proprietário.
9. Implementar exclusão lógica de sala pública.
10. Implementar listagem de salas ativas.
11. Implementar recuperação de sala por identificador.
12. Implementar criação de mensagem.
13. Implementar edição de mensagem própria.
14. Implementar remoção lógica de mensagem própria.
15. Implementar recuperação de histórico de mensagens por sala em ordem cronológica.
16. Implementar registro de entrada em sala em `eventos_participacao`.
17. Implementar registro de saída em sala em `eventos_participacao`.
18. Implementar criação de log de moderação reutilizável por outros fluxos.
19. Garantir filtros de status de sala no envio de mensagens.
20. Garantir que mensagens vazias sejam rejeitadas.

---

## FASE 6 — Tempo real

1. Criar servidor WebSocket integrado ao backend.
2. Definir estratégia de autenticação WebSocket com JWT.
3. Validar token na conexão WebSocket.
4. Validar status do usuário na conexão WebSocket.
5. Implementar entrada do usuário em uma sala no canal WebSocket.
6. Associar conexões aos identificadores de sala.
7. Integrar envio de mensagem do WebSocket ao service de mensagens já existente.
8. Persistir mensagem antes do broadcast.
9. Implementar broadcast de nova mensagem para clientes conectados na sala.
10. Implementar broadcast de edição de mensagem quando aplicável.
11. Implementar broadcast de remoção de mensagem quando aplicável.
12. Implementar evento de entrada na sala.
13. Implementar evento de saída da sala.
14. Persistir `EventoParticipacao` para entrada e saída quando definido pelo fluxo.
15. Garantir que salas silenciadas não aceitem novas mensagens via WebSocket.
16. Padronizar payloads de eventos em tempo real.

---

## FASE 7 — Frontend

1. Criar layout base da aplicação.
2. Configurar tema base com Vuetify.
3. Configurar roteamento principal do frontend.
4. Configurar guardas de navegação para rotas públicas do frontend.
5. Configurar guardas de navegação para rotas autenticadas do frontend.
6. Configurar guardas de navegação para rotas administrativas do frontend.
7. Configurar rota de fallback para páginas não encontradas.
8. Criar serviço de API HTTP.
9. Criar serviço de autenticação no frontend.
10. Criar serviço de solicitações de cadastro no frontend.
11. Criar serviço de salas no frontend.
12. Criar serviço de mensagens no frontend.
13. Criar serviço de WebSocket no frontend.
14. Criar gerenciamento de estado para usuário autenticado.
15. Criar gerenciamento de estado para salas.
16. Criar gerenciamento de estado para mensagens.
17. Criar página de login.
18. Criar página de cadastro.
19. Criar dashboard principal.
20. Criar tela de listagem de salas.
21. Criar tela de criação de sala.
22. Criar tela de edição de sala.
23. Criar tela de sala de chat.
24. Criar painel administrativo.
25. Implementar fluxo de login com armazenamento controlado do token.
26. Implementar restauração de sessão autenticada via endpoint de perfil atual.
27. Implementar tratamento dos estados de autenticação no frontend.
28. Implementar fluxo de solicitação de cadastro.
29. Implementar listagem de salas consumindo backend.
30. Implementar fluxo de criação de sala.
31. Implementar fluxo de edição de sala.
32. Implementar entrada em sala com abertura de canal WebSocket.
33. Implementar carregamento do histórico de mensagens na sala.
34. Implementar envio de mensagem no chat.
35. Implementar atualização visual do chat por broadcast.
36. Implementar exibição de eventos de participação em tempo real na sala.
37. Implementar edição de mensagem própria no frontend.
38. Implementar remoção lógica de mensagem própria no frontend.
39. Implementar tratamento do estado de conexão e reconexão WebSocket.
40. Implementar listagem de solicitações pendentes no painel administrativo.
41. Implementar ações de aprovação e rejeição no painel administrativo.
42. Implementar adaptação dos payloads HTTP por recurso na camada de serviços do frontend.

---

## FASE 8 — Moderação

1. Implementar bloqueio de usuário por administrador.
2. Implementar silenciamento de sala por administrador.
3. Implementar exclusão lógica de sala por administrador.
4. Implementar remoção administrativa de mensagem.
5. Implementar criação de aviso de moderação quando aplicável.
6. Garantir geração obrigatória de `LogModeracao` para cada ação administrativa.
7. Criar endpoints administrativos específicos para moderação.
8. Integrar painel administrativo do frontend às ações de moderação.
9. Refletir silenciamento de sala no frontend e no WebSocket.
10. Impedir interação de usuário bloqueado após nova validação de sessão.

---

## FASE 9 — Integração

1. Validar integração entre frontend e backend em ambiente completo.
2. Validar integração entre REST e WebSocket no fluxo de chat.
3. Garantir compartilhamento da autenticação entre API e WebSocket.
4. Validar consistência entre criação de mensagem por API e distribuição via WebSocket quando aplicável.
5. Garantir tratamento uniforme de erros de autenticação no frontend.
6. Garantir tratamento uniforme de erros de permissão no frontend.
7. Validar fluxo completo: login, listagem de salas, entrada em sala, envio de mensagem e broadcast.
8. Validar fluxo administrativo: aprovação de cadastro, bloqueio e moderação.

---

## FASE 10 — Qualidade

1. Reforçar validações de entrada no backend.
2. Reforçar sanitização básica de dados textuais.
3. Melhorar tratamento de erros do frontend.
4. Melhorar tratamento de falhas do WebSocket.
5. Criar logs técnicos mínimos para autenticação, erro de integração e falha de persistência.
6. Revisar proteção de endpoints privados.
7. Revisar proteção de eventos WebSocket autenticados.
8. Revisar filtros de exclusão lógica nas consultas.
9. Criar testes unitários para serviços centrais de autenticação.
10. Criar testes unitários para serviços centrais de mensagens.
11. Criar testes de integração para login.
12. Criar testes de integração para criação de sala.
13. Criar testes de integração para envio de mensagem.
14. Criar testes de integração para moderação básica.

---

## FASE 11 — Deploy

1. Ajustar `Dockerfile` do backend para build de produção.
2. Ajustar `Dockerfile` do frontend para build de produção.
3. Criar configuração de `docker-compose` para ambiente de produção.
4. Definir variáveis de ambiente de produção.
5. Criar script de start do backend.
6. Criar script de build do frontend.
7. Criar script de execução de migrations.
8. Criar script de seed inicial do administrador, se aplicável.
9. Validar subida da aplicação completa em modo de produção local.
10. Preparar pipeline opcional de CI/CD.

---

## Dependências críticas

* Banco de dados deve estar estruturado antes da implementação real do backend de domínio.
* Backend core deve existir antes da autenticação.
* Autenticação deve estar pronta antes dos módulos protegidos de chat.
* Domínio do chat deve estar pronto antes da camada WebSocket.
* WebSocket deve estar funcional antes da experiência completa do chat no frontend.
* Moderação depende da existência de usuários, salas, mensagens e autenticação por papel.
* Integração só deve consolidar fluxos após backend, frontend e tempo real já estarem minimamente estáveis.

---

## MVP mínimo

O MVP mínimo do Free Chat Maker deve conter:

* solicitação de cadastro
* aprovação administrativa básica
* login
* criação de sala
* listagem de salas
* entrada em sala
* envio de mensagem
* persistência de mensagem
* broadcast em tempo real

Ficam fora do MVP inicial:

* moderação avançada
* painel administrativo completo
* refinamentos visuais extensivos
* testes mais amplos

---

## Tarefas futuras

* adicionar notificações em tempo real além do chat
* implementar salas privadas
* adicionar analytics e métricas de uso
* implementar presença online em tempo real
* evoluir moderação com mais tipos de ação
* adicionar paginação e busca em histórico
* melhorar observabilidade e monitoramento
* preparar escalabilidade do gateway WebSocket
