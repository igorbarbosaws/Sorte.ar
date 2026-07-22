# Implementation Plan: User Profiles and Social

## Overview

This plan incrementally transforms Sorte.ar from a frontend-only app into a full social platform. The implementation follows the modular monolith architecture defined in the design: a Node.js/Express backend with PostgreSQL, Drizzle ORM, JWT authentication, and a vanilla-JS frontend integration layer. Each task builds on the previous, ending with all components wired together.

## Tasks

- [ ] 1. Set up backend project structure and shared infrastructure
  - Initialize Node.js/TypeScript project under `server/` with Express 5, Drizzle ORM, Zod, bcrypt, and fast-check as dev dependency
  - Create `src/app.ts`, `src/db/schema.ts`, and directory skeleton matching the design (`modules/`, `middleware/`, `lib/`)
  - Configure TypeScript (`tsconfig.json`), ESLint, and a test runner (Vitest)
  - Set up environment variable loading (`dotenv`) for `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `CLOUDINARY_*`
  - Write `src/db/schema.ts` defining all Drizzle tables: `users`, `refresh_tokens`, `championships`, `friend_requests`, `friendships`, `player_links` with all constraints from the data model
  - Generate and apply the initial migration
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1_

- [ ] 2. Implement shared library utilities
  - [ ] 2.1 Implement `lib/validation.ts` with all Zod schemas (RegisterInput, LoginInput, ChampionshipInput, DisplayName, Avatar constraints, PlayerLink, MigrateInput)
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 3.2, 3.3, 6.2_

  - [ ]* 2.2 Write property test for registration validation (Property 1)
    - **Property 1: Validação de registro é consistente**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5**

  - [ ]* 2.3 Write property test for profile display name validation (Property 6)
    - **Property 6: Validação de perfil é consistente**
    - **Validates: Requirements 3.2, 3.3**

  - [ ] 2.4 Implement `lib/jwt.ts` for access token creation/validation (60 min expiry) and opaque refresh token generation with SHA-256 hashing
    - _Requirements: 2.1, 2.6, 2.7_

- [ ] 3. Implement Auth module
  - [ ] 3.1 Implement `modules/auth/auth.service.ts` — `register`, `login`, `logout`, `refreshSession` methods matching the `AuthService` interface
    - Hash passwords with bcrypt cost factor 12
    - On `register`: validate input, check email uniqueness, persist user, issue access + refresh token pair
    - On `login`: validate credentials, issue token pair, store `token_hash` in `refresh_tokens`
    - On `logout`: set `revoked_at` on the refresh token row
    - On `refreshSession`: validate token hash, check expiry (7 days), issue new access token
    - _Requirements: 1.1, 1.2, 1.6, 1.7, 2.1, 2.2, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.2 Write unit tests for auth service
    - Test: login with correct credentials returns token pair; wrong credentials return generic error; hashed password is never equal to plaintext; expired refresh token is rejected; logout invalidates token
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [ ]* 3.3 Write property test for email uniqueness (Property 2)
    - **Property 2: Unicidade de e-mail é preservada**
    - **Validates: Requirements 1.2**

  - [ ] 3.4 Implement `middleware/rate-limit.ts` using `express-rate-limit` + Redis for per-email (10 failures / 60 s → 15 min block) and per-IP (10 failures / 60 s → 15 min block) limiters
    - _Requirements: 2.3, 9.5_

  - [ ]* 3.5 Write property test for per-email rate limiting (Property 3)
    - **Property 3: Rate limiting por e-mail bloqueia após 10 tentativas**
    - **Validates: Requirements 2.3**

  - [ ]* 3.6 Write property test for per-IP rate limiting (Property 4)
    - **Property 4: Rate limiting por IP bloqueia após 10 tentativas**
    - **Validates: Requirements 9.5**

  - [ ] 3.7 Implement `modules/auth/auth.router.ts` — `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`
    - Apply per-IP and per-email rate limit middleware on `/login`
    - _Requirements: 1.1, 1.2, 1.7, 2.1, 2.3, 2.4, 9.5_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement authentication middleware and Profile module
  - [ ] 5.1 Implement `middleware/authenticate.ts` that validates the Bearer JWT and attaches `req.userId`; returns `AUTHENTICATION_FAILED` (401) for missing, expired, or invalid tokens
    - _Requirements: 2.5, 9.4_

  - [ ]* 5.2 Write property test for session rejection (Property 5)
    - **Property 5: Session inválida ou expirada é sempre rejeitada**
    - **Validates: Requirements 2.5, 9.4**

  - [ ] 5.3 Implement `middleware/authorize.ts` for ownership checks (championship creator, profile owner); returns `AUTHORIZATION_FAILED` (403) for mismatches
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 5.4 Implement `modules/profile/profile.service.ts` — `getPublicProfile` (with stats), `updateDisplayName`, `uploadAvatar`
    - `getPublicProfile`: aggregate stats (total championships as creator, total as Player_Link)
    - `uploadAvatar`: validate magic bytes for JPEG/PNG/WebP, enforce 2 MB limit, upload to Cloudinary/S3, persist URL
    - Return 404 (`NOT_FOUND`) when userId does not exist
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 5.5 Write unit tests for profile service
    - Test: 404 when userId not found; avatar with wrong MIME type rejected before upload; avatar over 2 MB rejected; display name update persisted correctly
    - _Requirements: 3.3, 3.5, 3.7, 3.8_

  - [ ] 5.6 Implement `modules/profile/profile.router.ts` — `GET /api/profile/:userId`, `PATCH /api/profile/me`, `POST /api/profile/me/avatar`
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

- [ ] 6. Implement Championship module
  - [ ] 6.1 Implement `modules/championship/championship.service.ts` with `create`, `list` (max 100, ordered by `created_at DESC`), `get`, `updateScore`, `finalize`, `delete`
    - `finalize`: mark status `finished`, set `champion`, attempt to record `finished_at` independently
    - `updateScore`: persist in ≤ 2 s; on DB failure return `DB_SAVE_ERROR` without modifying DB state
    - `list`: cursor-based pagination, max 100 results
    - All mutating methods verify `creator_id` match (authorization)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 9.1, 9.2_

  - [ ]* 6.2 Write unit tests for championship service
    - Test: create persists all championship fields; list returns at most 100 results ordered correctly; finalize marks status `finished`; updateScore failure preserves previous DB state; unauthorized update returns 403
    - _Requirements: 4.1, 4.2, 4.8, 4.9, 9.1, 9.2_

  - [ ]* 6.3 Write property test for championship authorization (Property 10)
    - **Property 10: Autorização de campeonato rejeita não-criadores**
    - **Validates: Requirements 9.1, 9.2**

  - [ ] 6.4 Implement `modules/championship/championship.router.ts` — `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` under `/api/championships`
    - Apply `authenticate` middleware on all routes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9_

- [ ] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Friend module
  - [ ] 8.1 Implement `modules/friend/friend.service.ts` — `sendRequest`, `acceptRequest`, `rejectRequest`, `removeFriend`, `listFriends`
    - `sendRequest`: validate target email exists; check not self; check no existing PENDING request or ACCEPTED friendship; create `friend_requests` row; notify in-platform (notification record or event)
    - `acceptRequest`: set status `ACCEPTED` on request; insert bidirectional row in `friendships` (user_a = min UUID)
    - `rejectRequest`: delete request row; if not PENDING, silently ignore
    - `removeFriend`: delete row from `friendships` (handle both (a,b) and (b,a) orderings)
    - `listFriends`: return ACCEPTED friends ordered alphabetically by `display_name`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ]* 8.2 Write unit tests for friend service
    - Test: request to own email returns error; duplicate request returns current state; accept creates bidirectional friendship; reject on non-PENDING silently succeeds; remove friend removes both directions
    - _Requirements: 5.2, 5.3, 5.6, 5.7, 5.8_

  - [ ]* 8.3 Write property test for friendship symmetry and uniqueness (Property 7)
    - **Property 7: Amizade é simétrica e sem duplicatas**
    - **Validates: Requirements 5.5, 5.8, 5.9**

  - [ ] 8.4 Implement `modules/friend/friend.router.ts` — `GET /api/friends`, `POST /api/friends/requests`, `GET /api/friends/requests/pending`, `POST /api/friends/requests/:id/accept`, `POST /api/friends/requests/:id/reject`, `DELETE /api/friends/:friendId`
    - _Requirements: 5.1, 5.5, 5.6, 5.8, 5.9_

- [ ] 9. Implement Player Link module
  - [ ] 9.1 Implement `modules/player-link/player-link.service.ts` — `createLink`, `updateLink`, `removeLink`
    - `createLink`: verify championship not finished; verify email belongs to a friend of the creator; check no existing link for `player_name` or `linked_user_id` in that championship; insert `player_links` row; create `Participant_View` entry (e.g., tag in JSONB or junction table)
    - `updateLink`: remove old link + Participant_View; create new link + Participant_View
    - `removeLink`: reject if championship is `finished` (`CHAMPIONSHIP_FINISHED` 422); remove `player_links` row and associated Participant_View
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ]* 9.2 Write unit tests for player-link service
    - Test: link to non-friend email returns error; link to already-linked player returns CONFLICT; remove on finished championship returns 422; update swaps Participant_View correctly
    - _Requirements: 6.3, 6.4, 6.7, 6.9_

  - [ ]* 9.3 Write property test for Player_Link exclusivity (Property 8)
    - **Property 8: Player_Link é exclusivo por jogador e por usuário no campeonato**
    - **Validates: Requirements 6.2, 6.4**

  - [ ] 9.4 Implement `modules/player-link/player-link.router.ts` — `POST /api/championships/:id/links`, `PATCH /api/championships/:id/links/:linkId`, `DELETE /api/championships/:id/links/:linkId`
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 6.7, 6.8, 6.9_

- [ ] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Migration module
  - [ ] 11.1 Implement `modules/migration/migration.service.ts` — `migrateBatch`
    - Process each championship in a per-item transaction (not a single batch transaction)
    - Skip championships whose `local_id` already exists in DB for the user (idempotency)
    - Skip and collect championships with invalid/malformed data; continue migrating the rest
    - Return `MigrationResult` with counts of migrated, skipped (duplicate), and failed (invalid) items
    - On complete success: respond 200; on partial: respond 207 with `skipped` list
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_

  - [ ]* 11.2 Write unit tests for migration service
    - Test: batch with all valid items migrates all; batch with a duplicate `local_id` skips without error; batch with invalid item skips it and migrates the rest; DB failure rolls back individual item, others unaffected
    - _Requirements: 8.4, 8.5, 8.7_

  - [ ]* 11.3 Write property test for migration idempotency (Property 9)
    - **Property 9: Migração é idempotente por identificador local**
    - **Validates: Requirements 8.7**

  - [ ] 11.4 Implement `POST /api/championships/migrate` route in championship router using `migration.service.ts`
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 12. Implement Feed and Profile statistics
  - [ ] 12.1 Implement feed query in `championship.service.ts` — fetch all championships where user is `creator_id` OR has a `player_links` row, ordered by `updated_at DESC`; include current phase (from JSONB `data`), champion name if finished, and user's linked team and final position
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 12.2 Update `profile.service.ts` `getPublicProfile` to include top-level stats: total championships with Player_Link, wins (1st place via Player_Link), runner-up finishes (2nd place via Player_Link)
    - _Requirements: 7.7_

  - [ ]* 12.3 Write unit tests for feed and profile stats
    - Test: feed returns championships as creator and as linked player; finished championship shows champion; in-progress championship shows current phase; profile stats correctly count wins and runner-up finishes
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7_

- [ ] 13. Create frontend API integration module
  - [ ] 13.1 Create `js/api.js` implementing `apiCall` with Bearer token injection, automatic 401 retry via refresh token, and generic error handling as specified in the design
    - _Requirements: 2.5, 2.6, 4.3, 4.5_

  - [ ] 13.2 Add auth UI to `index.html`/`js/script.js`: registration form, login form, logout button, redirect to profile on success
    - _Requirements: 1.7, 2.1, 2.2_

  - [ ] 13.3 Integrate championship persistence: replace `localStorage` read/write calls with `api.js` calls to `GET /api/championships`, `POST /api/championships`, `PATCH /api/championships/:id`; display `DB_LOAD_ERROR` and `DB_SAVE_ERROR` messages to the user
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ] 13.4 Implement localStorage migration prompt: detect Sorte.ar data in `localStorage` on login; display migration offer; on confirm call `POST /api/championships/migrate`; on decline store refusal flag; on success clear localStorage keys; on failure show retry message
    - _Requirements: 4.6, 4.7, 8.1, 8.3, 8.4, 8.6_

  - [ ] 13.5 Add player-link UI to championship configuration: display optional email field per player; show friend autocomplete list; call link/unlink API endpoints; display conflict and permission errors inline
    - _Requirements: 6.1, 6.3, 6.6, 6.7_

  - [ ] 13.6 Add profile page rendering: display public profile with stats, Feed (with phase/champion info per item), friend list with remove control, pending friend requests with accept/reject controls, and friend-request-by-email form
    - _Requirements: 3.1, 3.4, 5.1, 5.9, 7.1, 7.2, 7.3, 7.4, 7.7_

- [ ] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Integration tests and final wiring
  - [ ]* 15.1 Write integration test: full auth flow (register → login → authenticated request → logout → rejected request)
    - _Requirements: 1.1, 1.7, 2.1, 2.4, 9.4_

  - [ ]* 15.2 Write integration test: championship persistence flow (create → update score → reload → score persists)
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ]* 15.3 Write integration test: social flow (user A adds user B as friend → B accepts → A links B to player → championship appears in B's Feed)
    - _Requirements: 5.1, 5.5, 6.2, 6.5, 7.1_

- [ ] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the build
- Property tests use **fast-check** with `numRuns: 100` minimum and a traceability comment (`// Feature: user-profiles-and-social, Property N: ...`)
- Unit tests and property tests are complementary — both should be present for full coverage

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.4"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["3.5", "3.6", "3.7", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["5.5", "5.6", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.4", "11.1"] },
    { "id": 9, "tasks": ["11.2", "11.3", "11.4", "12.1"] },
    { "id": 10, "tasks": ["12.2"] },
    { "id": 11, "tasks": ["12.3", "13.1"] },
    { "id": 12, "tasks": ["13.2", "13.3"] },
    { "id": 13, "tasks": ["13.4", "13.5"] },
    { "id": 14, "tasks": ["13.6"] },
    { "id": 15, "tasks": ["15.1", "15.2", "15.3"] }
  ]
}
```
