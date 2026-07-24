// Profile module — public profile, display name edit, avatar upload
export {
  ProfileService,
  createProfileService,
  type PublicProfile,
  type ProfileStats,
} from "./profile.service.js";

export { profileRouter } from "./profile.router.js";
