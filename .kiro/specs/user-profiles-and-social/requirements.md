# Requirements Document

## Introduction

O Sorte.ar é atualmente uma aplicação web frontend-only que utiliza `localStorage` para persistência. Esta feature adiciona um backend completo com banco de dados, sistema de autenticação, perfis de usuário, lista de amigos e compartilhamento de campeonatos. O objetivo é transformar o Sorte.ar em uma plataforma social onde cada usuário possui um perfil com histórico de campeonatos, pode adicionar amigos por e-mail e vincular participantes de um campeonato a amigos cadastrados — fazendo com que o campeonato apareça automaticamente no perfil de cada jogador vinculado.

---

## Glossary

- **System**: O Sorte.ar, incluindo frontend e backend.
- **User**: Pessoa registrada na plataforma com e-mail e senha.
- **Profile**: Página pública de um usuário, exibindo avatar, nome, estatísticas e histórico de campeonatos.
- **Auth_Service**: Módulo responsável por registro, login, logout e gestão de sessões.
- **Friend_Service**: Módulo responsável por gerenciar relacionamentos de amizade entre usuários.
- **Championship**: Um campeonato criado pelo System com formato, grupos, resultados e campeão.
- **Championship_Service**: Módulo responsável por persistir e recuperar campeonatos no banco de dados.
- **Player_Link**: Associação entre um jogador de um campeonato e um usuário registrado (identificado pelo e-mail).
- **Participant_View**: Visão personalizada de um campeonato que aparece no perfil de um usuário vinculado como jogador.
- **Avatar**: Imagem de perfil do usuário, podendo ser uma URL ou upload direto.
- **Session**: Token de autenticação (JWT ou equivalente) que identifica um usuário autenticado.
- **Feed**: Lista cronológica de campeonatos relevantes para um usuário (criados ou em que participou).
- **DB**: Banco de dados relacional (ex: PostgreSQL) ou equivalente usado pelo backend.
- **API**: Interface HTTP (REST) fornecida pelo backend para o frontend consumir.

---

## Requirements

### Requirement 1: Registro de Usuário

**User Story:** Como visitante, quero criar uma conta com e-mail e senha, para que eu possa salvar meus campeonatos e ter um perfil.

#### Acceptance Criteria

1. WHEN um visitante submete um formulário de registro com e-mail no formato válido (contendo "@" e domínio), senha com no mínimo 8 caracteres e nome de exibição com no mínimo 1 e no máximo 50 caracteres, THE Auth_Service SHALL criar uma nova conta de usuário no DB e retornar uma Session.
2. WHEN um visitante tenta registrar com um e-mail já cadastrado, THE Auth_Service SHALL retornar um erro indicando que o e-mail já está em uso, sem criar nova conta.
3. WHEN um formulário de registro é submetido com senha contendo menos de 8 caracteres, THE Auth_Service SHALL retornar um erro de validação antes de qualquer operação no DB.
4. WHEN um formulário de registro é submetido com nome de exibição vazio ou com mais de 50 caracteres, THE Auth_Service SHALL retornar um erro de validação antes de qualquer operação no DB.
5. WHEN um formulário de registro é submetido com e-mail em formato inválido (ausência de "@" ou domínio), THE Auth_Service SHALL retornar um erro de validação antes de qualquer operação no DB.
6. THE Auth_Service SHALL armazenar senhas usando hash seguro com salt, nunca em texto plano.
7. WHEN o registro é concluído com sucesso, THE System SHALL redirecionar o usuário para seu perfil recém-criado.

---

### Requirement 2: Autenticação de Usuário

**User Story:** Como usuário registrado, quero fazer login e logout, para que eu possa acessar minha conta de forma segura.

#### Acceptance Criteria

1. WHEN um usuário submete e-mail e senha corretos, THE Auth_Service SHALL retornar uma Session válida com prazo de expiração de 60 minutos.
2. WHEN um usuário submete credenciais incorretas, THE Auth_Service SHALL retornar um erro genérico de autenticação sem indicar qual campo está errado.
3. WHEN um usuário acumula 10 tentativas de login malsucedidas consecutivas para o mesmo e-mail em um intervalo de 60 segundos, THE Auth_Service SHALL bloquear novas tentativas de login para aquele e-mail por 15 minutos.
4. WHEN um usuário faz logout, THE Auth_Service SHALL invalidar a Session ativa no servidor, de modo que requisições subsequentes com aquela Session sejam rejeitadas.
5. IF uma Session estiver expirada ou invalidada, THEN THE Auth_Service SHALL rejeitar a requisição autenticada com um erro de autenticação.
6. WHEN um usuário autenticado solicita renovação com um refresh token válido e não expirado, THE Auth_Service SHALL retornar uma nova Session válida por mais 60 minutos sem exigir novo login.
7. IF o refresh token estiver expirado (após 7 dias) ou inválido, THEN THE Auth_Service SHALL rejeitar a renovação com um erro de autenticação, exigindo novo login.

---

### Requirement 3: Perfil de Usuário

**User Story:** Como usuário, quero visualizar e editar meu perfil, para que eu possa personalizar minha identidade na plataforma.

#### Acceptance Criteria

1. THE System SHALL exibir uma página de perfil contendo: nome de exibição, avatar (ou imagem padrão se não definido), data de ingresso, número de campeonatos criados e número de campeonatos em que o usuário possui um Player_Link.
2. WHEN um usuário autenticado submete edição de nome de exibição com valor válido (1–50 caracteres), THE System SHALL persistir a alteração no DB e refletir o novo nome na página de perfil na próxima requisição de carregamento do perfil.
3. IF o nome de exibição submetido for vazio ou exceder 50 caracteres, THEN THE System SHALL retornar um erro de validação sem persistir a alteração.
4. WHEN um usuário (autenticado ou não) acessa a URL de perfil de outro usuário usando o identificador único daquele usuário, THE System SHALL exibir o perfil público desse usuário contendo nome de exibição, avatar, data de ingresso e estatísticas de campeonatos.
5. IF o identificador de perfil solicitado não existir no DB, THEN THE System SHALL retornar uma resposta de erro 404 sem revelar se o identificador existe ou não.
6. WHEN um usuário autenticado faz upload de arquivo de avatar no formato JPEG, PNG ou WebP com tamanho menor ou igual a 2 MB, THE System SHALL armazenar o arquivo e associar a URL resultante ao perfil do usuário.
7. IF o arquivo de avatar exceder 2 MB, THEN THE System SHALL retornar um erro de validação sem armazenar o arquivo.
8. IF o arquivo de avatar não estiver no formato JPEG, PNG ou WebP, THEN THE System SHALL retornar um erro de validação sem armazenar o arquivo.

---

### Requirement 4: Persistência de Campeonatos no Backend

**User Story:** Como usuário autenticado, quero que meus campeonatos sejam salvos no servidor, para que eu possa acessá-los em qualquer dispositivo.

#### Acceptance Criteria

1. WHEN um usuário autenticado finaliza a configuração de um campeonato no Sorte.ar, THE Championship_Service SHALL persistir no DB, associado ao usuário criador, todos os dados do campeonato incluindo jogadores, times, formato, grupos e resultados parciais existentes até aquele momento.
2. WHEN um usuário autenticado acessa o Sorte.ar, THE Championship_Service SHALL carregar do DB todos os campeonatos em andamento associados ao usuário, substituindo o comportamento atual de localStorage.
3. IF o Championship_Service falhar ao carregar os dados do DB durante o acesso do usuário, THEN THE Championship_Service SHALL exibir uma mensagem de erro indicando que os campeonatos não puderam ser carregados e não exibirá dados desatualizados ou inconsistentes.
4. WHEN um usuário atualiza o placar de uma partida, THE Championship_Service SHALL persistir a atualização no DB em até 2 segundos após a confirmação da ação pelo usuário.
5. IF o Championship_Service falhar ao persistir a atualização de placar no DB, THEN THE Championship_Service SHALL notificar o usuário com uma mensagem de erro indicando que a atualização não foi salva e preservará o estado anterior do placar no DB sem alteração.
6. WHEN um usuário autenticado realiza login em um dispositivo que possui campeonatos no localStorage e não há registro de recusa de migração naquele dispositivo, THE Championship_Service SHALL exibir uma notificação oferecendo ao usuário a opção de migrar esses campeonatos para o DB, sem executar a migração automaticamente.
7. WHEN o usuário confirma a migração de campeonatos do localStorage para o DB, THE Championship_Service SHALL transferir todos os campeonatos do localStorage para o DB e, somente após a confirmação de persistência de cada campeonato, removerá o respectivo campeonato do localStorage.
8. WHEN um campeonato é concluído (campeão definido), THE Championship_Service SHALL marcar o campeonato com status "finalizado" no DB independentemente do resultado do registro da data de conclusão, e registrará a data de conclusão somente se a operação for bem-sucedida.
9. WHEN um usuário requisita a listagem de seus campeonatos, THE Championship_Service SHALL retornar todos os campeonatos do usuário (finalizados e em andamento), ordenados por data de criação decrescente, retornando no máximo 100 campeonatos por requisição.

---

### Requirement 5: Sistema de Amigos

**User Story:** Como usuário, quero adicionar outros usuários como amigos pelo e-mail, para que eu possa vinculá-los como jogadores nos meus campeonatos.

#### Acceptance Criteria

1. WHEN um usuário autenticado envia uma solicitação de amizade para um e-mail cadastrado na plataforma que não é o seu próprio e com quem não possui amizade estabelecida nem solicitação pendente, THE Friend_Service SHALL criar uma solicitação com status PENDING e exibir uma notificação in-platform para o destinatário.
2. IF o usuário tentar enviar uma solicitação de amizade para seu próprio e-mail, THEN THE Friend_Service SHALL retornar um erro indicando que não é possível enviar solicitação para si mesmo.
3. IF o usuário tentar enviar uma solicitação de amizade para um e-mail com o qual já possui uma solicitação com status PENDING ou uma amizade estabelecida, THEN THE Friend_Service SHALL retornar um erro indicando o estado atual do relacionamento.
4. IF o e-mail informado não estiver cadastrado na plataforma, THEN THE Friend_Service SHALL retornar um erro informando ao solicitante que o e-mail não foi encontrado.
5. WHEN o destinatário aceita uma solicitação de amizade com status PENDING, THE Friend_Service SHALL alterar o status da solicitação para ACCEPTED e registrar o relacionamento bidirecional entre os dois usuários no DB.
6. WHEN o destinatário recusa uma solicitação de amizade com status PENDING, THE Friend_Service SHALL remover a solicitação do DB sem estabelecer o relacionamento.
7. IF a solicitação não estiver mais com status PENDING no momento da recusa, THEN THE Friend_Service SHALL ignorar a ação sem retornar erro.
8. WHEN um usuário autenticado solicita a remoção de um amigo, THE Friend_Service SHALL remover o relacionamento bidirecional entre os dois usuários no DB.
9. WHEN um usuário autenticado acessa sua lista de amigos, THE System SHALL exibir todos os seus amigos com relacionamento ACCEPTED, mostrando nome de exibição, avatar e um controle de remoção para cada um, ordenados alfabeticamente pelo nome de exibição.

---

### Requirement 6: Vinculação de Jogadores a Usuários

**User Story:** Como criador de um campeonato, quero vincular cada jogador a um amigo cadastrado pelo e-mail, para que o campeonato apareça automaticamente no perfil desse amigo.

#### Acceptance Criteria

1. WHEN um usuário autenticado está configurando os jogadores de um campeonato, THE System SHALL exibir, para cada jogador adicionado, um campo opcional que aceita digitação de e-mail ou seleção da lista de amigos do criador.
2. WHEN um jogador é vinculado a um e-mail que pertence a um amigo do criador, THE Championship_Service SHALL criar um Player_Link associando aquele jogador ao usuário correspondente, desde que não exista já um Player_Link para aquele jogador ou para aquele usuário naquele campeonato.
3. IF o e-mail informado no vínculo não pertencer a um amigo do criador (seja porque não está cadastrado ou porque não é amigo), THEN THE System SHALL exibir um aviso ao criador e não criará o Player_Link.
4. IF já existir um Player_Link para aquele jogador ou para aquele usuário naquele campeonato, THEN THE Championship_Service SHALL retornar um erro de conflito e não criará um segundo Player_Link.
5. WHEN um Player_Link é criado, THE Championship_Service SHALL adicionar uma Participant_View do campeonato ao perfil do usuário vinculado, desde que aquele usuário ainda não possua uma Participant_View daquele campeonato.
6. WHILE o campeonato não estiver finalizado, THE System SHALL permitir que o criador remova o vínculo de um jogador.
7. IF o criador tentar remover o vínculo de um jogador após o campeonato ter sido finalizado, THEN THE System SHALL retornar um erro indicando que o vínculo não pode ser alterado em campeonatos finalizados.
8. WHEN um vínculo é removido pelo criador, THE Championship_Service SHALL remover o Player_Link correspondente e remover a Participant_View associada do perfil do usuário vinculado.
9. WHEN o criador altera o vínculo de um jogador para um novo e-mail, THE Championship_Service SHALL remover o Player_Link e a Participant_View do usuário anterior e criar novo Player_Link e Participant_View para o novo usuário.

---

### Requirement 7: Feed de Campeonatos no Perfil

**User Story:** Como usuário, quero ver no meu perfil todos os campeonatos que criei ou em que participei como jogador vinculado, para que eu possa acompanhar meu histórico.

#### Acceptance Criteria

1. THE System SHALL exibir no perfil do usuário um Feed contendo todos os campeonatos em que o usuário é criador ou possui um Player_Link, ordenados por data de atualização decrescente. Cada item do Feed SHALL exibir o nome do campeonato, o status (em andamento ou finalizado) e a data de atualização.
2. WHILE um campeonato do Feed está em andamento, THE System SHALL exibir a fase atual do campeonato (ex: "Fase de Grupos", "Mata-mata") como parte das informações do item no Feed.
3. WHEN um campeonato do Feed é finalizado, THE System SHALL exibir o nome do campeão no item do Feed correspondente.
4. WHEN um campeonato do Feed é clicado, THE System SHALL exibir uma página de detalhe contendo: nome do campeonato, formato, lista de jogadores e times, resultado do usuário como jogador vinculado (time sorteado e posição final se o campeonato estiver finalizado) e o placar de todas as partidas registradas.
5. IF o usuário visualizando o detalhe for o criador e não possuir Player_Link no campeonato, THEN THE System SHALL exibir os detalhes completos do campeonato sem destacar resultado de jogador vinculado.
6. WHEN um campeonato do Feed é finalizado e o usuário possui Player_Link naquele campeonato, THE System SHALL exibir no item do Feed o resultado do usuário (ex: "Campeão", "Vice-campeão", "3º lugar").
7. THE System SHALL exibir no topo do perfil do usuário o total de campeonatos em que possui Player_Link, o número de vezes em que terminou em 1º lugar via Player_Link e o número de vezes em que terminou em 2º lugar via Player_Link.

---

### Requirement 8: Migração do localStorage para o Backend

**User Story:** Como usuário existente que já usa o Sorte.ar, quero que meus dados salvos localmente sejam preservados ao criar minha conta, para que eu não perca meu histórico.

#### Acceptance Criteria

1. WHEN um usuário autenticado realiza login em um dispositivo que contém dados no localStorage sob a chave do Sorte.ar e não existe no localStorage daquele dispositivo um flag indicando recusa prévia de migração, THE System SHALL detectar os dados locais e exibir uma oferta de migração antes de navegar para a tela principal.
2. WHEN o usuário confirma a migração, THE Championship_Service SHALL iniciar uma transação no DB que inclui tanto a inserção dos campeonatos quanto o registro do status de migração concluída; se qualquer etapa da transação falhar, toda a operação será revertida, deixando o DB no estado anterior e o localStorage intacto.
3. WHEN a migração é concluída com sucesso (transação confirmada no DB), THE System SHALL remover do localStorage todos os dados relacionados ao Sorte.ar naquele dispositivo.
4. IF a migração falhar por qualquer motivo (falha de rede, erro no DB ou dado inválido), THEN THE Championship_Service SHALL preservar todos os dados no localStorage intactos, exibirá uma mensagem de erro com instrução para tentar novamente e não registrará o status de migração como concluída.
5. IF algum campeonato no localStorage contiver dados inválidos ou malformados durante a migração, THEN THE Championship_Service SHALL ignorar aquele campeonato específico, continuará tentando migrar os demais campeonatos válidos e exibirá ao usuário a lista de campeonatos que não puderam ser migrados.
6. WHEN o usuário recusa a migração, THE System SHALL armazenar no localStorage daquele dispositivo um flag indicando a recusa, manterá os dados existentes sem alteração e não exibirá a oferta de migração novamente naquele dispositivo.
7. IF um campeonato do localStorage já existir no DB com o mesmo identificador único, THEN THE Championship_Service SHALL ignorar aquele campeonato durante a migração sem gerar erro, evitando duplicação.

---

### Requirement 9: Segurança e Autorização

**User Story:** Como usuário, quero que meus dados sejam protegidos, para que apenas eu possa editar meu perfil e meus campeonatos.

#### Acceptance Criteria

1. WHEN uma requisição de edição ou exclusão de campeonato é recebida pela API, THE Championship_Service SHALL verificar se a Session pertence ao usuário criador do campeonato antes de processar a operação.
2. IF a Session não pertencer ao criador do campeonato, THEN THE API SHALL retornar um erro de autorização sem executar a modificação.
3. WHEN uma requisição de edição de perfil é recebida, THE Auth_Service SHALL verificar se a Session pertence ao proprietário do perfil antes de processar a operação; IF a Session não pertencer ao proprietário, THE API SHALL retornar um erro de autorização sem executar a modificação.
4. WHEN uma requisição de criação, edição ou exclusão de recurso é recebida pela API sem uma Session válida, THE API SHALL rejeitar a requisição com um erro de autenticação sem processar a operação.
5. WHEN um endereço IP acumula mais de 10 tentativas de login malsucedidas em um intervalo de 60 segundos, THE Auth_Service SHALL bloquear novas tentativas de login originadas daquele endereço IP por 15 minutos, retornando um erro de limite excedido para qualquer tentativa durante o período de bloqueio.
6. THE API SHALL transmitir todas as comunicações entre frontend e backend por meio de um canal cifrado em ambiente de produção.
