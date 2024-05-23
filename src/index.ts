import Scraper from "./Scraper";
// import { scraper } from "./core";

declare module "bun" {
  interface Env {
    PROXY_LIST: string;
    BASE_LINK: string;
    CATEGORY_LINK: string;
    WORD_LINK: string;
  }
}

// const { scrape } = scraper;

// await scrape();
const scraper = new Scraper(true);
await scraper.exec();
