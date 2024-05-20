import axios from "axios";
import { load } from "cheerio";

export default class Scraper {
  constructor() {}

  async scrape() {
    try {
      // Gets the list containing words + pages
      const alphabet = await this.scrapeAlphabet();

      for (const letter of alphabet) {
        // Gets words page 1 of each letter
        const words = await this.scrapeWords(
          `https://www.thesaurus.com/list/${letter}`
        );

        console.log(words);
      }
    } catch (error) {
      console.error("Error occurred during scraping:", error);
    }
  }

  private async init(url: string) {
    try {
      const response = await axios.get(url);
      const html = response.data;

      const $ = load(html);
      return $;
    } catch (error) {
      throw new Error(
        // @ts-ignore
        `Error initializing Cheerio with URL ${url}: ${error.message}`
      );
    }
  }

  private async scrapeAlphabet() {
    try {
      const $ = await this.init("https://www.thesaurus.com/list/a");

      const alphabet =
        $("nav")
          .children("menu")
          .text()
          .match(/[a-z]*z/i)?.[0] || "";

      return alphabet.split("");
    } catch (error) {
      //@ts-ignore
      throw new Error("Error scraping alphabet: " + error.message);
    }
  }
  private async scrapeWords(url: string) {
    try {
      const words: string[] = [];

      const $ = await this.init(url);

      $('[data-type="browse-list"] ul li a').each((_index, element) => {
        const word = $(element).text().trim();
        words.push(word);
      });

      return words;
    } catch (error) {
      // @ts-ignore
      throw new Error("Error scraping words: " + error.message);
    }
  }
}
