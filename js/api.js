/**
 * js/api.js — Módulo de chamadas à API do Sorte.ar
 *
 * Fornece a função principal `apiCall` para o frontend vanilla JS.
 * Responsável por:
 *   - Injetar o Bearer token de acesso (localStorage) em cada requisição
 *   - Tentar renovar a sessão automaticamente (uma vez) em caso de 401
 *   - Tratamento genérico de erros da API
 *
 * Uso (via script tag, sem bundler):
 *   <script src="js/api.js"></script>
 *   ...
 *   const data = await apiCall('GET', '/championships');
 */

// ──────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────

const API_BASE = '/api';

/** Chaves usadas para armazenar tokens no localStorage */
const ACCESS_TOKEN_KEY  = 'sortear_access_token';
const REFRESH_TOKEN_KEY = 'sortear_refresh_token';

// ──────────────────────────────────────────────
// Helpers de token
// ──────────────────────────────────────────────

/**
 * Retorna o access token armazenado, ou null se ausente.
 */
function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Persiste access token e, opcionalmente, refresh token no localStorage.
 * @param {string} accessToken
 * @param {string|null} [refreshToken]
 */
function setTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Remove ambos os tokens do localStorage (logout ou sessão inválida).
 */
function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ──────────────────────────────────────────────
// Renovação de sessão
// ──────────────────────────────────────────────

/**
 * Tenta renovar o access token usando o refresh token armazenado.
 * Requisito 2.6: refresh token com validade de 7 dias.
 *
 * @returns {Promise<boolean>} true se a renovação foi bem-sucedida, false caso contrário.
 */
async function tryRefresh() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      // Refresh expirado ou inválido (Req 2.7) — força novo login
      clearTokens();
      return false;
    }

    const { accessToken } = await res.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    return true;
  } catch {
    // Falha de rede — não limpa tokens para permitir retry manual
    return false;
  }
}

// ──────────────────────────────────────────────
// Função principal
// ──────────────────────────────────────────────

/**
 * Realiza uma chamada autenticada (ou pública) à API REST do Sorte.ar.
 *
 * Comportamento:
 *  1. Injeta `Authorization: Bearer <token>` quando `requiresAuth` for true.
 *  2. Em caso de 401, tenta renovar a sessão uma única vez via `tryRefresh()`.
 *     - Se renovado: repete a requisição original com o novo token.
 *     - Se não renovado: limpa tokens e lança AUTHENTICATION_FAILED.
 *  3. Para qualquer outro erro HTTP: lança o corpo JSON do erro.
 *  4. 204 No Content retorna `null` em vez de tentar parsear JSON vazio.
 *
 * Requisitos relacionados: 2.5, 2.6, 4.3, 4.5
 *
 * @param {'GET'|'POST'|'PATCH'|'PUT'|'DELETE'} method  Método HTTP.
 * @param {string}  path          Caminho relativo à API (ex: '/championships').
 * @param {object}  [body]        Corpo da requisição (serializado como JSON).
 * @param {boolean} [requiresAuth=true]  Se false, omite o header Authorization.
 * @returns {Promise<any>}        Dados da resposta deserializados, ou null (204).
 * @throws  {object}              Objeto de erro no formato `{ error: { code, message } }`.
 */
async function apiCall(method, path, body, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  // 1. Injetar token de acesso
  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // 2. Primeira tentativa
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  // 3. Tratamento de 401: tentar renovar sessão e repetir (Req 2.5, 2.6)
  if (res.status === 401 && requiresAuth) {
    const refreshed = await tryRefresh();

    if (refreshed) {
      // Atualiza o header com o novo access token e repete a chamada
      headers['Authorization'] = `Bearer ${getAccessToken()}`;

      const retryRes = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!retryRes.ok) {
        throw await retryRes.json();
      }

      if (retryRes.status === 204) return null;
      return retryRes.json();
    }

    // Refresh falhou — sessão encerrada, usuário precisa fazer login novamente
    clearTokens();
    throw {
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Session expired. Please log in again.'
      }
    };
  }

  // 4. Qualquer outro erro HTTP
  if (!res.ok) {
    throw await res.json();
  }

  // 5. 204 No Content — sem corpo para parsear
  if (res.status === 204) return null;

  return res.json();
}
