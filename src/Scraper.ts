import type { Family, Letter, Word } from "../lib/types";
import { extractCategoryAndLike, init, isValid } from "../lib/helpers";

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
        const lastPage = await this.getLastPage(baseLink);

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

  private async scrapeAlphabet() {
    try {
      const $ = await init("https://www.thesaurus.com/list/a");

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

  private async getLastPage(url: string) {
    try {
      const $ = await init(url);

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
      const words: Word[] = [];

      const $ = await init(url);

      $('[data-type="browse-list"] ul li a').each((_index, element) => {
        const word = $(element).text().trim();

        if (isValid(word)) {
          words.push({
            word,
            families: [
              {
                antonyms: { strongest: [], strong: [], weak: [] },
                synonyms: { strongest: [], strong: [], weak: [] },
                category: "noun",
                like: [],
              },
              {
                antonyms: { strongest: [], strong: [], weak: [] },
                synonyms: { strongest: [], strong: [], weak: [] },
                category: "preposition",
                like: [],
              },
            ],
          });
        }
      });

      let families: Family[] = [];

      for (const word of words) {
        const family = await this.scrapeWord(word.word);

        if (family.length) {
          families.push(...family);
        } else {
          continue;
        }
      }

      console.log(families);
      return words;
    } catch (error) {
      // @ts-ignore
      throw new Error("Error scraping words: " + error.message);
    }
  }

  private async scrapeWord(word: string) {
    const $ = await init(`https://www.thesaurus.com/browse/${word}`);

    const families: Family[] = [];

    $('[data-type="synonym-and-antonym-card"]').each((_index, element) => {
      const familyElement = $(element);
      const categoryText = familyElement.find("div p").first().text().trim();
      const { category, like } = extractCategoryAndLike(categoryText);

      const family: Family = {
        category,
        like,
        synonyms: { strongest: [], strong: [], weak: [] },
        antonyms: { strongest: [], strong: [], weak: [] },
      };

      // Extracting synonyms
      familyElement.find("div div div").each((_idx, synonymElement) => {
        const strengthClass = $(synonymElement).children("p").first().text();

        let strength: "strong" | "strongest" | "weak" | null = null;

        if (strengthClass?.includes("Strongest")) {
          strength = "strongest";
        } else if (strengthClass?.includes("Strong")) {
          strength = "strong";
        } else if (strengthClass?.includes("Weak")) {
          strength = "weak";
        }

        $(synonymElement)
          .find("span")
          .each((_i, span) => {
            const synonym = $(span).text().trim();

            if (strength && !family.synonyms[strength].includes(synonym)) {
              family.synonyms[strength].push(synonym);
            }
          });
      });

      families.push(family);
    });

    console.log(families);
    return families;
  }
}
