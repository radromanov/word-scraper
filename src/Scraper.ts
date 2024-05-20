import axios from "axios";
import { load } from "cheerio";

export default class Scraper {
  constructor() {}

  async scrape(testSet?: string[]) {
    try {
      // Gets the list containing words + pages
      const alphabet = testSet ?? (await this.scrapeAlphabet());
      let words: { [key: string]: string[] } = {};

      for (const letter of alphabet) {
        // First, get the number of pages for the current letter
        const baseLink = `https://www.thesaurus.com/list/${letter}`;
        const lastPage = await this.getLastPage(baseLink, letter);
        let wordsForLetter: string[] = [];

        for (let page = 1; page <= lastPage; page++) {
          console.log(
            `Current letter: ${letter} --- Current page: ${page}/${lastPage}`
          );

          const pageLink = `${baseLink}/${page}`;
          const pageWords = await this.scrapeWords(pageLink);
          wordsForLetter.push(...pageWords);
        }

        words[letter] = wordsForLetter;
      }

      console.log(words);
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

      let lastPage = parseInt(
        $('ul [data-type="paging-arrow"] a')
          .last()
          .attr("href")
          ?.split("/")[3] || "1"
      );

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
