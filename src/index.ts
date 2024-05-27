import Scraper from "./Scraper";
// import { scraper } from "./core";

declare module "bun" {
  interface Env {
    PROXY_LIST: string;
    BASE_LINK: string;
    CATEGORY_LINK: string;
    WORD_LINK: string;
    NEON_PG_CONNECTION_URL: string;
  }
}

// const { scrape } = scraper;

// await scrape();
const scraper = new Scraper();
await scraper.exec();
