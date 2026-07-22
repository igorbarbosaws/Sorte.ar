# Design Document — User Profiles and Social

## Overview

Esta feature transforma o Sorte.ar de uma aplicação frontend-only em uma plataforma social completa. O objetivo é adicionar um backend com autenticação JWT, perfis de usuário com avatar, sistema de amigos, persistência de campeonatos no servidor e vinculação de jogadores a usuários registrados — substituindo gradualmente o uso de `localStorage`.

A arquitetura proposta é um **monolito modular** server-side (Node.js + Express ou equivalente) com banco de dados relacional (PostgreSQL), expondo uma API REST consumida pelo frontend vanilla JS existente. O frontend mantém sua estrutura atual (HTML/CSS/JS) e recebe incrementalmente a integração com a API.

### Pilha Tecnológica Recomendada

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Backend | Node.js 20 + Express 5 | Ecosistema maduro, sem necessidade de reescrever o frontend |
| Banco de dados | PostgreSQL 16 | ACID, suporte a JSON para dados de campeonato, amplamente suportado |
| ORM | Drizzle ORM | Type-safe, migrações declarativas, leve |
| Autenticação | JWT (access + refresh) + bcrypt | Stateless, padrão de mercado |
| Armazenamento de avatares | Cloudinary ou S3-compatível | Upload direto, transformações de imagem |
| Rate limiting | express-rate-limit + Redis | Bloqueio por IP e por e-mail conforme requisitos |
| Validação | Zod | Schemas reutilizáveis frontend/backend |
| Deploy | Railway / Render (PaaS) | Simplicidade para projeto em fase inicial |

---

## Architecture

O sistema é dividido em três camadas:

```
┌─────────────────────────────────────┐
│           FRONTEND (SPA)            │
│  index.html + js/script.js existente│
│  + api.js (novo módulo de chamadas) │
└──────────────┬──────────────────────┘
               │ HTTPS REST/JSON
┌──────────────▼──────────────────────┐
│           API BACKEND               │
│  Express + módulos de serviço       │
│  Auth │ Profile │ Championship      │
│  Friend │ PlayerLink │ Migration    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         PERSISTÊNCIA                │
│  PostgreSQL (dados relacionais)     │
│  Redis (rate limit, refresh tokens) │
│  Cloudinary/S3 (avatares)           │
└─────────────────────────────────────┘
```

### Fluxo de Autenticação

```
Frontend                    Backend                     Redis / DB
   │                            │                            │
   │── POST /auth/register ────>│                            │
   │                            │── hash(password) ─────────>│
   │                            │── INSERT users ────────────>│
   │<── { access_token, refresh_token } ──────────────────────│
   │                            │                            │
   │── POST /auth/login ───────>│                            │
   │                            │── check rate-limit ───────>│
   │                            │── verify password ─────────│
   │<── { access_token, refresh_token }                      │
   │                            │                            │
   │── POST /auth/refresh ─────>│                            │
   │                            │── validate refresh token ─>│
   │<── { access_token }        │                            │
```

### Módulos Backend

```
src/
├── app.ts                  # Configuração Express
├── modules/
│   ├── auth/               # Registro, login, logout, refresh
│   ├── profile/            # Perfil público e edição
│   ├── championship/       # CRUD de campeonatos
│   ├── friend/             # Amizades e solicitações
│   ├── player-link/        # Vinculação jogador ↔ usuário
│   └── migration/          # Migração localStorage → DB
├── middleware/
│   ├── authenticate.ts     # Valida JWT
│   ├── authorize.ts        # Verifica ownership
│   └── rate-limit.ts       # Limits por IP e e-mail
├── db/
│   ├── schema.ts           # Tabelas Drizzle
│   └── migrations/         # Arquivos de migração gerados
└── lib/
    ├── jwt.ts              # Criação/validação de tokens
    ├── storage.ts          # Upload de avatares
    └── validation.ts       # Schemas Zod compartilhados
```

---

## Components and Interfaces

### API REST — Rotas Principais

#### Auth (`/api/auth`)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/register` | ❌ | Cria conta |
| POST | `/login` | ❌ | Retorna access + refresh token |
| POST | `/logout` | ✅ | Invalida refresh token no Redis |
| POST | `/refresh` | ❌ | Troca refresh por novo access token |

#### Perfil (`/api/profile`)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/:userId` | ❌ | Perfil público |
| PATCH | `/me` | ✅ | Editar nome de exibição |
| POST | `/me/avatar` | ✅ | Upload de avatar (multipart) |

#### Campeonatos (`/api/championships`)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | ✅ | Lista campeonatos do usuário (paginada, max 100) |
| POST | `/` | ✅ | Cria campeonato |
| GET | `/:id` | ✅ | Detalhe do campeonato |
| PATCH | `/:id` | ✅ | Atualiza placar/fase |
| DELETE | `/:id` | ✅ | Remove campeonato |
| POST | `/migrate` | ✅ | Migra lote do localStorage |

#### Amigos (`/api/friends`)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | ✅ | Lista amigos (ACCEPTED) |
| POST | `/requests` | ✅ | Envia solicitação por e-mail |
| GET | `/requests/pending` | ✅ | Lista solicitações recebidas pendentes |
| POST | `/requests/:id/accept` | ✅ | Aceita solicitação |
| POST | `/requests/:id/reject` | ✅ | Recusa solicitação |
| DELETE | `/:friendId` | ✅ | Remove amigo |

#### Vínculos (`/api/championships/:id/links`)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/` | ✅ | Cria Player_Link |
| PATCH | `/:linkId` | ✅ | Altera vínculo (novo e-mail) |
| DELETE | `/:linkId` | ✅ | Remove vínculo |

### Módulo de Autenticação — Interface Interna

```typescript
interface AuthService {
  register(input: RegisterInput): Promise<SessionPair>;
  login(input: LoginInput, ipAddress: string): Promise<SessionPair>;
  logout(refreshToken: string): Promise<void>;
  refreshSession(refreshToken: string): Promise<AccessToken>;
}

interface RegisterInput {
  email: string;        // formato válido
  password: string;     // mín. 8 chars
  displayName: string;  // 1–50 chars
}

interface SessionPair {
  accessToken: string;  // JWT, exp: 60 min
  refreshToken: string; // opaque token, exp: 7 dias
}
```

### Módulo de Campeonatos — Interface Interna

```typescript
interface ChampionshipService {
  create(userId: string, data: ChampionshipInput): Promise<Championship>;
  list(userId: string, cursor?: string): Promise<PaginatedResult<Championship>>;
  get(id: string, requestingUserId: string): Promise<ChampionshipDetail>;
  updateScore(id: string, matchId: string, score: MatchScore, userId: string): Promise<void>;
  finalize(id: string, champion: string, userId: string): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
  migrateBatch(userId: string, championships: LocalChampionship[]): Promise<MigrationResult>;
}
```

### Módulo de Amigos — Interface Interna

```typescript
interface FriendService {
  sendRequest(fromUserId: string, toEmail: string): Promise<FriendRequest>;
  acceptRequest(requestId: string, userId: string): Promise<void>;
  rejectRequest(requestId: string, userId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  listFriends(userId: string): Promise<Friend[]>;
}
```

### Frontend — Novo Módulo `api.js`

```javascript
// js/api.js — chamadas ao backend
const API_BASE = '/api';

async function apiCall(method, path, body, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = getAccessToken(); // localStorage: 'sortear_access_token'
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) { await tryRefresh(); /* retry once */ }
  if (!res.ok) throw await res.json();
  return res.json();
}
```

---

## Data Models

### Diagrama Entidade-Relacionamento

```
users
  id          UUID PK
  email       VARCHAR(255) UNIQUE NOT NULL
  password_hash TEXT NOT NULL
  display_name VARCHAR(50) NOT NULL
  avatar_url  TEXT
  created_at  TIMESTAMPTZ DEFAULT now()
  updated_at  TIMESTAMPTZ DEFAULT now()

refresh_tokens
  id          UUID PK
  user_id     UUID FK → users.id ON DELETE CASCADE
  token_hash  TEXT NOT NULL
  expires_at  TIMESTAMPTZ NOT NULL
  created_at  TIMESTAMPTZ DEFAULT now()
  revoked_at  TIMESTAMPTZ  -- preenchido no logout

championships
  id          UUID PK
  creator_id  UUID FK → users.id ON DELETE SET NULL
  local_id    VARCHAR(128)  -- id original do localStorage (para dedup migração)
  title       VARCHAR(255) NOT NULL
  format      VARCHAR(50) NOT NULL  -- 'groups-knockout'|'groups'|'knockout'|'league'
  status      VARCHAR(20) NOT NULL DEFAULT 'ongoing'  -- 'ongoing'|'finished'
  champion    VARCHAR(255)  -- nome do time vencedor
  data        JSONB NOT NULL  -- estado completo (jogadores, grupos, bracket, partidas)
  created_at  TIMESTAMPTZ DEFAULT now()
  updated_at  TIMESTAMPTZ DEFAULT now()
  finished_at TIMESTAMPTZ

  INDEX (creator_id, created_at DESC)
  INDEX (creator_id, local_id) -- dedup migração
  UNIQUE (creator_id, local_id) WHERE local_id IS NOT NULL

friend_requests
  id          UUID PK
  from_user   UUID FK → users.id ON DELETE CASCADE
  to_user     UUID FK → users.id ON DELETE CASCADE
  status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'  -- 'PENDING'|'ACCEPTED'
  created_at  TIMESTAMPTZ DEFAULT now()
  updated_at  TIMESTAMPTZ DEFAULT now()

  UNIQUE (from_user, to_user)  -- impede duplicatas
  CHECK (from_user <> to_user)  -- impede auto-amizade

friendships
  user_a      UUID FK → users.id ON DELETE CASCADE
  user_b      UUID FK → users.id ON DELETE CASCADE
  created_at  TIMESTAMPTZ DEFAULT now()

  PRIMARY KEY (user_a, user_b)
  CHECK (user_a < user_b)  -- user_a sempre é o menor UUID (evita duplicata reversa)
  INDEX (user_a)
  INDEX (user_b)

player_links
  id              UUID PK
  championship_id UUID FK → championships.id ON DELETE CASCADE
  player_name     VARCHAR(255) NOT NULL
  linked_user_id  UUID FK → users.id ON DELETE SET NULL
  created_at      TIMESTAMPTZ DEFAULT now()

  UNIQUE (championship_id, player_name)   -- um jogador por vínculo
  UNIQUE (championship_id, linked_user_id) -- um usuário por campeonato
```

### Modelo JSONB para `championships.data`

```typescript
interface ChampionshipData {
  players: Array<{ name: string; pot?: string }>;
  teams: string[];
  draw: Array<{ player: string; team: string }>;
  format: FormatConfig;
  groups?: GroupsState;
  bracket?: BracketState;
  league?: LeagueState;
  scorers?: Record<string, number>;
}
```

### Convenções

- Todos os IDs são UUID v4 gerados pelo banco (gen_random_uuid()).
- Timestamps em UTC, tipo `TIMESTAMPTZ`.
- Senhas nunca persistidas; somente `password_hash` gerado via `bcrypt` (cost factor 12).
- `refresh_tokens.token_hash` é o SHA-256 do token opaco enviado ao cliente; o token bruto fica apenas no cookie HttpOnly.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Validação de registro é consistente

*Para qualquer* combinação de `(email, password, displayName)`, o Auth_Service SHALL rejeitar o registro se e somente se pelo menos uma das seguintes condições for verdadeira: (a) o e-mail não contém "@" e domínio válido; (b) a senha tem menos de 8 caracteres; (c) o displayName está vazio ou tem mais de 50 caracteres. Caso contrário, SHALL criar o usuário com sucesso.

**Validates: Requirements 1.1, 1.3, 1.4, 1.5**

---

### Property 2: Unicidade de e-mail é preservada

*Para qualquer* sequência de N registros com o mesmo e-mail, o Auth_Service SHALL aceitar somente o primeiro e rejeitar todos os subsequentes com erro de e-mail duplicado, independentemente da ordem ou conteúdo dos demais campos.

**Validates: Requirements 1.2**

---

### Property 3: Rate limiting por e-mail bloqueia após 10 tentativas

*Para qualquer* endereço de e-mail, após exatamente 10 tentativas de login malsucedidas consecutivas em um intervalo de 60 segundos, toda tentativa adicional SHALL ser bloqueada por 15 minutos, independentemente da senha fornecida.

**Validates: Requirements 2.3**

---

### Property 4: Rate limiting por IP bloqueia após 10 tentativas

*Para qualquer* endereço IP, após exatamente 10 tentativas de login malsucedidas em um intervalo de 60 segundos (de qualquer e-mail), toda tentativa adicional SHALL ser rejeitada com erro de limite excedido por 15 minutos.

**Validates: Requirements 9.5**

---

### Property 5: Session inválida ou expirada é sempre rejeitada

*Para qualquer* token de acesso que esteja expirado, revogado ou malformado, toda requisição autenticada SHALL retornar erro de autenticação sem executar a operação solicitada, independentemente do recurso ou método HTTP.

**Validates: Requirements 2.5, 9.4**

---

### Property 6: Validação de perfil é consistente

*Para qualquer* valor de `displayName` submetido para edição, o sistema SHALL rejeitar o valor se e somente se ele for vazio (comprimento 0 após trim) ou exceder 50 caracteres; valores válidos SHALL sempre ser persistidos com sucesso.

**Validates: Requirements 3.2, 3.3**

---

### Property 7: Amizade é simétrica e sem duplicatas

*Para qualquer* par de usuários (A, B), se A envia solicitação para B e B aceita, então tanto A.friends SHALL conter B quanto B.friends SHALL conter A. Além disso, não pode existir mais de uma amizade entre o mesmo par, independentemente da ordem de criação.

**Validates: Requirements 5.5, 5.8, 5.9**

---

### Property 8: Player_Link é exclusivo por jogador e por usuário no campeonato

*Para qualquer* campeonato, não pode existir mais de um Player_Link com o mesmo `player_name`, e não pode existir mais de um Player_Link com o mesmo `linked_user_id`. Qualquer tentativa de criar um segundo vínculo violando uma dessas restrições SHALL retornar erro de conflito.

**Validates: Requirements 6.2, 6.4**

---

### Property 9: Migração é idempotente por identificador local

*Para qualquer* campeonato do localStorage com um `local_id` único, chamadas repetidas de migração com o mesmo `local_id` SHALL inserir o campeonato somente uma vez no DB; chamadas subsequentes SHALL ignorar o campeonato sem erro e sem duplicação.

**Validates: Requirements 8.7**

---

### Property 10: Autorização de campeonato rejeita não-criadores

*Para qualquer* operação de edição ou exclusão de um campeonato, o sistema SHALL processar a operação se e somente se a Session pertencer ao `creator_id` daquele campeonato; qualquer outra Session SHALL receber erro de autorização sem modificação do estado.

**Validates: Requirements 9.1, 9.2**

---

## Error Handling

### Estrutura Padrão de Erros da API

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Display name must be between 1 and 50 characters",
    "field": "displayName"
  }
}
```

### Catálogo de Códigos de Erro

| Código | HTTP | Situação |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Campo inválido (formato, tamanho) |
| `EMAIL_ALREADY_EXISTS` | 409 | E-mail duplicado no registro |
| `AUTHENTICATION_FAILED` | 401 | Credenciais incorretas ou token inválido |
| `TOKEN_EXPIRED` | 401 | Access ou refresh token expirado |
| `RATE_LIMIT_EMAIL` | 429 | 10 tentativas falharam para o e-mail |
| `RATE_LIMIT_IP` | 429 | 10 tentativas falhadas do endereço IP |
| `AUTHORIZATION_FAILED` | 403 | Usuário não possui permissão |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `CONFLICT` | 409 | Player_Link duplicado; amizade já existente |
| `FRIEND_NOT_FOUND` | 400 | E-mail informado não é amigo do criador |
| `CHAMPIONSHIP_FINISHED` | 422 | Operação inválida em campeonato finalizado |
| `DB_LOAD_ERROR` | 503 | Falha ao carregar dados do DB |
| `DB_SAVE_ERROR` | 503 | Falha ao persistir atualização |
| `MIGRATION_PARTIAL` | 207 | Alguns campeonatos não migraram |

### Estratégias de Tratamento

**Falha na persistência de placar** (Req 4.5): O backend retorna `DB_SAVE_ERROR`. O frontend exibe toast de erro, mantém o estado visual anterior e oferece botão de retentar. O DB não é modificado.

**Falha no carregamento de campeonatos** (Req 4.3): O backend retorna `DB_LOAD_ERROR`. O frontend exibe mensagem de erro; não exibe dados do localStorage como fallback (evita inconsistência).

**Migração parcial** (Req 8.5): O endpoint `/migrate` usa uma transação por campeonato individual (não uma única transação para o lote). Campeonatos com dados inválidos são ignorados e retornados na lista `skipped` da resposta `207 Multi-Status`.

**Avatar inválido** (Req 3.7, 3.8): Validação feita no middleware antes do upload; tamanho verificado via `Content-Length` header + limite no multer (2 MB). Tipo verificado por magic bytes, não pela extensão.

**Erros de rede no frontend**: Todos os métodos do `api.js` têm try/catch; erros não-401 são expostos como notificações visuais sem quebrar o estado da aplicação.

---

## Testing Strategy

### Abordagem Dual

O projeto adotará dois tipos de teste complementares:

1. **Testes unitários / de exemplo**: cobrem comportamentos específicos, casos de borda e integrações entre módulos.
2. **Testes baseados em propriedades (PBT)**: cobrem as propriedades formais listadas acima, gerando centenas de inputs variados.

A biblioteca escolhida para PBT é **[fast-check](https://fast-check.dev/)** (JavaScript/TypeScript), com execução mínima de **100 iterações por propriedade**.

### Estrutura de Testes

```
tests/
├── unit/
│   ├── auth.test.ts           # Registro, login, logout, refresh
│   ├── profile.test.ts        # Edição de perfil, avatar
│   ├── championship.test.ts   # CRUD, placar, finalização
│   ├── friend.test.ts         # Solicitações, aceitar, recusar, remover
│   ├── player-link.test.ts    # Criação, remoção, troca de vínculo
│   └── migration.test.ts      # Migração do localStorage
├── property/
│   ├── auth.property.test.ts
│   ├── profile.property.test.ts
│   ├── championship.property.test.ts
│   ├── friend.property.test.ts
│   └── player-link.property.test.ts
└── integration/
    ├── auth.integration.test.ts
    └── championship.integration.test.ts
```

### Configuração dos Testes de Propriedade

Cada teste de propriedade deve:
- Usar `fc.assert(fc.property(...))` com `{ numRuns: 100 }` mínimo.
- Incluir comentário de rastreabilidade no formato:
  ```
  // Feature: user-profiles-and-social, Property N: <texto da propriedade>
  ```
- Usar mocks para chamadas externas (DB, Redis, Cloudinary).

### Exemplos de Testes de Propriedade

```typescript
// Feature: user-profiles-and-social, Property 1: Validação de registro é consistente
it('rejeita registro se e somente se algum campo for inválido', () => {
  fc.assert(fc.property(
    fc.record({
      email: fc.string(),
      password: fc.string(),
      displayName: fc.string(),
    }),
    ({ email, password, displayName }) => {
      const result = validateRegisterInput({ email, password, displayName });
      const shouldFail =
        !isValidEmail(email) ||
        password.length < 8 ||
        displayName.trim().length === 0 ||
        displayName.length > 50;
      expect(result.success).toBe(!shouldFail);
    }
  ), { numRuns: 500 });
});
```

```typescript
// Feature: user-profiles-and-social, Property 9: Migração é idempotente
it('migração com mesmo local_id não duplica campeonato', async () => {
  fc.assert(fc.asyncProperty(
    fc.array(fc.record({
      localId: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 255 }),
      data: fc.constant({ players: [], teams: [], draw: [], format: {} }),
    }), { minLength: 1, maxLength: 10 }),
    async (championships) => {
      const userId = 'test-user';
      await migrateChampionships(userId, championships);
      await migrateChampionships(userId, championships); // segunda chamada
      const stored = await db.query.championships.findMany({ where: eq(championships.creatorId, userId) });
      expect(stored).toHaveLength(championships.length); // sem duplicatas
    }
  ), { numRuns: 100 });
});
```

### Testes Unitários Essenciais

- **Auth**: login com credenciais corretas retorna token; login errado retorna erro genérico; hash de senha nunca iguala texto plano; refresh expirado é rejeitado.
- **Rate limiting**: contador por e-mail reseta após 60 s; bloqueio por IP dura 15 min.
- **Perfil**: 404 quando userId não existe; avatar com tipo inválido é rejeitado antes do upload.
- **Amizades**: solicitação para próprio e-mail retorna erro; solicitação duplicada retorna estado atual.
- **Migração**: campeonato com `local_id` existente no DB é ignorado sem erro; dados inválidos no lote não interrompem migração dos demais.

### Testes de Integração

- **Auth flow completo**: register → login → acesso a rota protegida → logout → acesso rejeitado.
- **Championship persistence**: criar campeonato → atualizar placar → recarregar → placar persiste.
- **Friend + PlayerLink**: A adiciona B → B aceita → A vincula B a jogador → campeonato aparece no Feed de B.

### Cobertura Mínima Esperada

| Módulo | Cobertura de statements |
|---|---|
| auth | 90% |
| championship | 85% |
| friend | 85% |
| player-link | 85% |
| migration | 90% |
