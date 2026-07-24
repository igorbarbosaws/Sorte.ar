// Auth module — registration, login, logout, token refresh
export {
  AuthService,
  AppError,
  createAuthService,
  type SessionPair,
  type AccessToken,
} from "./auth.service.js";

export { authRouter } from "./auth.router.js";
