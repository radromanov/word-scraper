import axios from "axios";
import { load as chload } from "cheerio";
import { AXIOS_CONFIG, CATEGORIES, duration, isValid } from "../lib/helpers";
import type { Letter, PrepareLinkParams, Suspense } from "../lib/types";

class Scraper {
  private suspense: Suspense = { min: 2500, max: 5000 };
  private wordsForLetter: Record<Letter, string[]> = {} as Record<
    Letter,
    string[]
  >;

  private state = {
    currentLinkIndex: 0,
    currentLink: "",
    currentLetter: "a" as Letter,
    currentWord: "",
    attempt: 0,
    time: 0,
  };

  constructor() {
    CATEGORIES.forEach((letter) => {
      this.wordsForLetter[letter] = [];
    });
  }

  private async load(url: string) {
    try {
      const response = await axios.get(url, AXIOS_CONFIG);
      return chload(response.data);
    } catch (error) {
      throw new Error(`Unable to load Cheerio API with url ${url}`);
    }
  }

  async exec() {
    const start = performance.now();
    await this.prepareLinks({ page: 2, type: "NO_LETTER_ONE_PAGE" });
    const end = performance.now();
    this.state.time = end - start;

    console.log(this.wordsForLetter);
    console.log(`🎉 Operation complete in ${duration(this.state.time)}.`);
  }

  private async prepareLinks(param: PrepareLinkParams): Promise<any> {
    const linkHandlers = {
      ONE_LETTER_NO_PAGE: () => this.getSingleLetterAllPages(param.letter!),
      MULTIPLE_LETTERS_NO_PAGE: () =>
        this.getMultipleLettersAllPages(param.letters!),
      NO_LETTER_ONE_PAGE: () => this.getAllLettersOnePage(param.page!),
      NO_LETTER_START_END_PAGE: () =>
        this.getAllLettersStartEndPages(param.startPage!, param.endPage!),
      ONE_LETTER_ONE_PAGE: () =>
        this.getSingleLetterOnePage(param.letter!, param.page!),
      MULTIPLE_LETTERS_ONE_PAGE: () =>
        this.getMultipleLettersOnePage(param.letters!, param.page!),
      MULTIPLE_LETTERS_START_END_PAGE: () =>
        this.getMultipleLettersStartEndPages(
          param.letters!,
          param.startPage!,
          param.endPage!
        ),
    };

    if (!linkHandlers[param.type]) {
      throw new Error("Invalid type");
    }

    await linkHandlers[param.type]();
  }

  private async getLastPage(letter: Letter): Promise<number> {
    const link = `${process.env.BASE_LINK}${letter}`;
    const cheerio = await this.load(link);
    const href = cheerio(
      '#content [data-type="bottom-paging"] ul [data-type="paging-arrow"] a'
    )
      .last()
      .attr("href")
      ?.split("/");

    return href && href.length ? parseInt(href[href.length - 1], 10) : 1;
  }

  private async loadAndExtractWords(url: string): Promise<void> {
    this.state.currentLink = url;
    const wordsCount = await this.extractWords();
    console.log(`✅ Collected ${wordsCount} word(s) from ${url}.`);
  }

  private async extractWords(): Promise<number> {
    let words = 0;
    const cheerio = await this.load(this.state.currentLink);
    const items = cheerio('[data-type="browse-list"] ul li');

    if (!items.length) throw new Error("No items found");

    items.each((_i, element) => {
      const word = cheerio(element).text().trim();
      if (word.length && isValid(word)) {
        this.wordsForLetter[this.state.currentLetter].push(word);
        words++;
        this.state.currentLinkIndex++;
        this.state.currentWord = word;
      }
    });

    return words;
  }

  private async getSingleLetterAllPages(letter: Letter): Promise<void> {
    const link = `${process.env.BASE_LINK}${letter}/`;
    const lastPage = await this.getLastPage(letter);
    this.state.currentLetter = letter;

    for (let page = 1; page <= lastPage; page++) {
      await this.loadAndExtractWords(link + page);
    }
  }

  private async getMultipleLettersAllPages(letters: Letter[]): Promise<void> {
    for (const letter of letters) {
      await this.getSingleLetterAllPages(letter);
    }
  }

  private async getAllLettersOnePage(page: number): Promise<void> {
    console.log(`⚙️ Collecting page ${page} for all letters...\n`);
    for (const letter of CATEGORIES) {
      const link = `${process.env.BASE_LINK}${letter}/`;
      const lastPage = await this.getLastPage(letter);
      this.state.currentLetter = letter;

      if (page <= lastPage) {
        await this.loadAndExtractWords(link + page);
      }
    }
  }

  private async getAllLettersStartEndPages(
    startPage: number,
    endPage: number
  ): Promise<any> {
    // Implementation for getting all letters from start page to end page
  }

  private async getSingleLetterOnePage(
    letter: Letter,
    page: number
  ): Promise<any> {
    // Implementation for getting a single letter on a specific page
  }

  private async getMultipleLettersOnePage(
    letters: Letter[],
    page: number
  ): Promise<any> {
    // Implementation for getting multiple letters on a specific page
  }

  private async getMultipleLettersStartEndPages(
    letters: Letter[],
    startPage: number,
    endPage: number
  ): Promise<any> {
    // Implementation for getting multiple letters from start page to end page
  }
}

export default Scraper;
