import axios from "axios";
import { load } from "cheerio";
import type { Letter, Word } from "../lib/types";

export default class Scraper {
  constructor() {}

  async scrape(testSet?: string[]) {
    try {
      // Gets the list containing words + pages
      const alphabet = testSet ?? (await this.scrapeAlphabet());
      let words: Letter = {};

      for (const letter of alphabet) {
        console.log(`Current letter: '${letter}'`);
        // First, get the number of pages for the current letter
        const baseLink = `https://www.thesaurus.com/list/${letter}`;
        const lastPage = await this.getLastPage(baseLink, letter);

        let wordsForLetter: Word[] = [];

        // Start scraping from page 1
        for (let page = 1; page <= lastPage; page++) {
          console.log(`  --> Page ${page}/${lastPage}`);

          const pageLink = `${baseLink}/${page}`;

          // Access each `pageLink` and scrape the page's words
          const pageWords = await this.scrapeWords(pageLink);
          wordsForLetter.push(...pageWords);
        }

        words[letter] = [...wordsForLetter];
        console.log(`✅ Finished '${letter}' successfully. Continuing...`);
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

  private wordIsValid(word: string) {
    return (
      // Word cannot be of more than 1 set of characters, hyphens are allowed
      word.split(" ").length === 1 &&
      // word cannot include any brackets
      !word.includes("(") &&
      !word.includes(")")
    );
  }

  private async scrapeWords(url: string) {
    try {
      const words: Word[] = [];

      const $ = await this.init(url);

      $('[data-type="browse-list"] ul li a').each((_index, element) => {
        const word = $(element).text().trim();

        if (this.wordIsValid(word)) {
          words.push({
            word,
            families: [
              {
                antonyms: { strong: [], weak: [] },
                synonyms: { strong: [], weak: [] },
                category: "noun",
                like: "test",
              },
              {
                antonyms: { strong: [], weak: [] },
                synonyms: { strong: [], weak: [] },
                category: "preposition",
                like: "test 2",
              },
            ],
          });
        }
      });

      return words;
    } catch (error) {
      // @ts-ignore
      throw new Error("Error scraping words: " + error.message);
    }
  }
}
