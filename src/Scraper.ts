import axios from "axios";
import { load } from "cheerio";

export default class Scraper {
  constructor() {}

  async scrape() {
    try {
      // Gets the list containing words + pages
      const alphabet = await this.scrapeAlphabet();
      let currentLetter = "a";
      let currentPage = "https://www.thesaurus.com/list/a/1";

      for (const letter of alphabet) {
        // First, get the number of pages for the current letter
        const baseLink = `https://www.thesaurus.com/list/${letter}`;
        const lastPage = await this.getLastPage(baseLink, letter);

        currentLetter = letter;
        currentPage = `https://www.thesaurus.com${lastPage}`;
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

  private async getLastPage(url: string, letter: string) {
    try {
      const $ = await this.init(url);

      let lastPage = $('ul [data-type="paging-arrow"] a').last().attr("href");

      // If lastPage is undefined
      if (!lastPage) {
        lastPage = `/list/${letter}/1`;
      }

      return lastPage;
    } catch (error) {
      //@ts-ignore
      throw new Error("Error getting total pages: " + error.message);
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
