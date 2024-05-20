import axios from "axios";
import { load } from "cheerio";

export default class Scraper {
  constructor() {}

  async scrape(url: string) {
    const alphabet = await this.scrapeAlphabet(url);
  }
  private async scrapeAlphabet(url: string) {
    const response = await axios.get(url);
    const html = response.data;
    const $ = load(html);

    const alphabet =
      $("nav")
        .children("menu")
        .text()
        .match(/[a-z]*z/i)?.[0] || "";

    return alphabet.split("");
  }
  private async scrapeWord() {}
}
