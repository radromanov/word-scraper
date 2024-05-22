import { scraper } from "./core";

declare module "bun" {
  interface Env {
    PROXY_LIST: string;
    BASE_LINK: string;
    CATEGORY_LINK: string;
    WORD_LINK: string;
  }
}

const { scrapeWords, scrapeWord } = scraper;

// await scrapeWords(true);
console.log("============= HERE STARTS A WORD ===============");
await scrapeWord(true);
