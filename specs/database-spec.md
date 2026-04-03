Crie o arquivo `database-design.md` completo, em português, para o sistema **Free Chat Maker**, seguindo exatamente esta estrutura:

# database-design.md

## Objetivo
## Premissas de modelagem
## Entidades e tabelas
## Relacionamentos
## Regras de integridade
## Diagrama ER
## Diagrama de classes (visão estrutural)
## Diagrama de fluxo de dados
## Observações para implementação

Contexto do sistema:
- O Free Chat Maker é um sistema de comunicação institucional escolar.
- Usuários podem ser: ADMIN, ALUNO, PROFESSOR, FUNCIONARIO.
- O sistema possui solicitação de cadastro com aprovação administrativa.
- Apenas usuários aprovados podem autenticar.
- Usuários autenticados podem criar salas públicas, entrar em salas e enviar mensagens.
- O sistema possui moderação, rastreabilidade e eventos de participação em sala.
- O sistema usa Node.js, Express, Vue.js, PostgreSQL, Sequelize, Docker e WebSocket.
- O documento deve ser técnico, claro, organizado e consistente com Spec-Driven Development.
- O texto deve estar todo em português.
- Não usar inglês nos nomes das entidades principais do banco e dos diagramas.
- Não resumir demais. Preencher bem cada seção.
- Usar Markdown.
- Incluir diagramas Mermaid válidos.

Entidades principais a considerar:
- usuarios
- solicitacoes_cadastro
- salas
- mensagens
- eventos_participacao
- logs_moderacao

Regras centrais que devem orientar o documento:
- `usuarios.cpf` deve ser único.
- senha deve ser armazenada como `senha_hash`.
- autenticação deve usar JWT, mas senha não pode ser JWT.
- usuários possuem status:
  - PENDENTE
  - APROVADO
  - BLOQUEADO
  - REJEITADO
- salas possuem status:
  - ATIVA
  - SILENCIADA
  - EXCLUIDA
- mensagens possuem tipos:
  - TEXTO
  - CODIGO
  - EVENTO_SISTEMA
  - AVISO_MODERACAO
- eventos de participação possuem tipos:
  - ENTRADA
  - SAIDA
- logs de moderação possuem ações como:
  - APROVAR_USUARIO
  - REJEITAR_USUARIO
  - BLOQUEAR_USUARIO
  - EXCLUIR_MENSAGEM
  - SILENCIAR_SALA
  - EXCLUIR_SALA
  - ENVIAR_AVISO_MODERACAO

Campos esperados por entidade:

usuarios:
- id
- nome_completo
- cpf
- senha_hash
- papel
- status
- serie
- turma
- departamento
- setor
- criado_em
- atualizado_em

solicitacoes_cadastro:
- id
- nome_solicitado
- cpf_solicitado
- papel_solicitado
- serie_solicitada
- turma_solicitada
- departamento_solicitado
- setor_solicitado
- status_solicitacao
- revisado_por
- motivo_revisao
- criado_em
- revisado_em

salas:
- id
- nome
- descricao
- proprietario_id
- status
- criado_em
- atualizado_em
- excluido_em

mensagens:
- id
- sala_id
- autor_id
- tipo_mensagem
- conteudo
- criado_em
- atualizado_em
- excluido_em

eventos_participacao:
- id
- sala_id
- usuario_id
- tipo_evento
- criado_em

logs_moderacao:
- id
- administrador_id
- usuario_alvo
- sala_alvo
- solicitacao_alvo
- mensagem_alvo
- tipo_acao
- motivo
- criado_em

Orientações para cada seção:

## Objetivo
Explique que o documento transforma o modelo de domínio em estrutura relacional persistente, servindo de base para migrations, models Sequelize, API e implementação.

## Premissas de modelagem
Explique decisões como:
- banco relacional PostgreSQL
- ORM Sequelize
- exclusão lógica quando aplicável
- rastreabilidade obrigatória para mensagens e moderação
- RBAC por papel de usuário
- suporte a tempo real sem abrir mão da persistência

## Entidades e tabelas
Descreva cada tabela em subtópicos, com explicação breve da responsabilidade de cada uma.

## Relacionamentos
Explique os relacionamentos textualmente com cardinalidade, por exemplo:
- um usuário pode criar muitas salas
- uma sala contém muitas mensagens
- um usuário pode gerar muitos eventos de participação
- um administrador pode gerar muitos logs de moderação
- uma solicitação de cadastro pode ser revisada por um administrador

## Regras de integridade
Liste regras de unicidade, obrigatoriedade, chaves estrangeiras, consistência de estado, restrições de uso e regras semânticas importantes.
Inclua também observações como:
- `revisado_por` deve referenciar um usuário com papel ADMIN
- `administrador_id` deve referenciar um usuário com papel ADMIN
- pelo menos um dos campos de alvo em `logs_moderacao` deve estar preenchido
  (`usuario_alvo`, `sala_alvo`, `solicitacao_alvo` ou `mensagem_alvo`)
- mensagens vazias não são permitidas
- salas silenciadas não devem aceitar novas mensagens
- usuários bloqueados não devem autenticar nem interagir

## Diagrama ER
Crie um diagrama Mermaid `erDiagram` em português, com:
- nomes das entidades em português
- atributos principais
- PK e FK indicadas
- relacionamentos coerentes
- rótulos em português, como:
  - cria
  - envia
  - contém
  - gera
  - registra
  - executa
  - revisa

## Diagrama de classes (visão estrutural)
Crie um diagrama Mermaid `classDiagram` em português, representando as entidades do domínio em visão estrutural, não em implementação final.
Use nomes como:
- Usuario
- SolicitacaoCadastro
- Sala
- Mensagem
- EventoParticipacao
- LogModeracao

Inclua atributos principais e relacionamentos centrais.

## Diagrama de fluxo de dados
Crie um diagrama Mermaid `flowchart TD` com aparência de fluxo de dados/processo, em português, separando:
- entidades externas:
  - Visitante
  - Usuário
  - Administrador
- processos:
  - Solicitar Cadastro
  - Aprovar Cadastro
  - Autenticar
  - Criar Sala
  - Entrar na Sala
  - Enviar Mensagem
  - Moderar Conteúdo
- depósitos de dados:
  - Solicitações de Cadastro
  - Usuários
  - Salas
  - Mensagens
  - Eventos de Participação
  - Logs de Moderação

## Observações para implementação
Escreva recomendações práticas para:
- índices importantes
- uso de exclusão lógica
- cuidados com WebSocket + persistência
- geração de models Sequelize
- uso de enums
- rastreabilidade
- separação entre evento de participação e mensagem exibida
- recomendação de bloquear usuário em vez de excluir
- recomendação de manter logs de moderação imutáveis

Estilo de saída:
- retornar apenas o conteúdo completo do arquivo `database-design.md`
- sem explicações fora do arquivo
- sem comentários sobre o prompt
- documento técnico, claro e bem escrito
