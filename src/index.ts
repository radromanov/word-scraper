import Scraper from "./Scraper";

declare module "bun" {
  interface Env {
    BASE_LINK: string;
    WORD_LINK: string;
    NEON_PG_CONNECTION_URL: string;
  }
}

const scraper = new Scraper();
await scraper.exec({ page: 3, type: "NO_LETTER_ONE_PAGE" });
