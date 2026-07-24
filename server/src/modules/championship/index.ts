// Championship module — CRUD, score updates, finalization, feed
export {
  ChampionshipService,
  createChampionshipService,
  type Championship,
  type ChampionshipDetail,
  type PaginatedResult,
  type FeedItem,
} from "./championship.service.js";

export { championshipRouter } from "./championship.router.js";
