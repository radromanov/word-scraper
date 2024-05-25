import axios from "axios";
import { load as chload } from "cheerio";

import { AXIOS_CONFIG, duration, isValid } from "../lib/helpers";
import type { Letter, PrepareLinkParams, Suspense } from "../lib/types";

class Scraper {
  private suspense: Suspense = { min: 0, max: 0 };
  private links: { link: string; lastPage: number | null }[];
  private wordsForLetter: { [K in Letter]: string[] };

  private MAX_RETRIES = 5;
  private state: {
    currentLinkIndex: number;
    currentLink: string;
    currentLetter: Letter;
    currentWord: string;
    attempt: number;
    time: number;
  };

  constructor() {
    this.suspense.min = 2500;
    this.suspense.max = 5000;
    this.links = [];
    this.wordsForLetter = {
      a: [],
      b: [],
      c: [],
      d: [],
      e: [],
      f: [],
      g: [],
      h: [],
      i: [],
      j: [],
      k: [],
      l: [],
      m: [],
      n: [],
      o: [],
      p: [],
      q: [],
      r: [],
      s: [],
      t: [],
      u: [],
      v: [],
      w: [],
      x: [],
      y: [],
      z: [],
    };
    this.state = {
      currentLetter: "a",
      currentLink: "",
      currentLinkIndex: 0,
      currentWord: "",
      attempt: 0,
      time: 0,
    };
  }

  async load(url: string) {
    // await delay(this.suspense.min, this.suspense.max);

    try {
      const response = await axios.get(url, AXIOS_CONFIG);
      const html = response.data;

      return chload(html);
    } catch (error) {
      throw new Error(`Unable to load Cheerio API with url ${url}`);
    }
  }

  async exec() {
    // Initializes the scraping
    const start = performance.now();
    await this.prepareLinks({ letter: "a", type: "ONE_LETTER_NO_PAGE" });
    // await this.getWordsForLetter();

    const end = performance.now();
    this.state.time = end - start;

    console.log(this.wordsForLetter);

    console.log(`🎉 Operation complete in ${duration(this.state.time)}.`);
  }

  private async prepareLinks(param: PrepareLinkParams): Promise<any> {
    // check type of overload
    switch (param.type) {
      case "ONE_LETTER_NO_PAGE":
        await this.getSingleLetterAllPages(param.letter);
        break;
      case "MULTIPLE_LETTERS_NO_PAGE":
        await this.getMultipleLettersAllPages(param.letters);
        break;
      case "NO_LETTER_ONE_PAGE":
        await this.getAllLettersOnePage(param.page);
        break;
      case "NO_LETTER_START_END_PAGE":
        await this.getAllLettersStartEndPages(param.startPage, param.endPage);
        break;
      case "ONE_LETTER_ONE_PAGE":
        await this.getSingleLetterOnePage(param.letter, param.page);
        break;
      case "MULTIPLE_LETTERS_ONE_PAGE":
        await this.getMultipleLettersOnePage(param.letters, param.page);
        break;
      case "MULTIPLE_LETTERS_START_END_PAGE":
        await this.getMultipleLettersStartEndPages(
          param.letters,
          param.startPage,
          param.endPage
        );
        break;
      default:
        throw new Error("Invalid type");
    }
  }

  private async getWordsForLetter(): Promise<void> {
    // await delay(this.suspense.min, this.suspense.max);

    for (let i = this.state.currentLinkIndex; i < this.links.length; i++) {
      const link = this.links[i].link;
      this.state.currentLetter = link.slice(-1) as Letter;

      try {
        const cheerio = await this.load(link);
        const items = cheerio('[data-type="browse-list"] ul li');

        if (!items.length) throw new Error();

        const lastPage = await this.getPagesForLetter();

        console.log(lastPage);

        items.each((_i, element) => {
          const word = cheerio(element).text().trim();

          if (!word.length) throw new Error();

          if (isValid(word)) {
            this.wordsForLetter[this.state.currentLetter].push(word);

            this.state.currentLinkIndex = i + 1;
            this.state.currentWord = word;
          }
        });
      } catch (error) {
        console.warn(
          `⚠️ Retrying for letter ${this.state.currentLetter} -- [${
            this.state.attempt + 1
          }/${this.MAX_RETRIES}]`
        );
        await this.retry(this.getWordsForLetter.bind(this));
      }
    }
  }

  private async getPagesForLetter() {
    const link = this.links[this.state.currentLinkIndex].link;

    const cheerio = await this.load(link);
    const href = cheerio(
      '#content [data-type="bottom-paging"] ul [data-type="paging-arrow"] a'
    )
      .last()
      .attr("href")
      ?.split("/");

    if (!href || !href.length) {
      return 1;
    }

    const lastPage = parseInt(href[href.length - 1], 10);

    return lastPage;
  }

  private async retry(callback: () => Promise<void>) {
    this.state.attempt++;
    if (this.state.attempt >= this.MAX_RETRIES) {
      console.error(`Failed operation: attempts exceeded ${this.MAX_RETRIES}`);
      throw new Error("Too many attempts");
    }

    await callback();
  }

  private async getLastPage(letter: Letter) {
    const link = process.env.BASE_LINK + letter;

    const cheerio = await this.load(link);
    const href = cheerio(
      '#content [data-type="bottom-paging"] ul [data-type="paging-arrow"] a'
    )
      .last()
      .attr("href")
      ?.split("/");

    if (!href || !href.length) {
      return 1;
    }

    const lastPage = parseInt(href[href.length - 1], 10);

    return lastPage;
  }

  private async getSingleLetterAllPages(letter: Letter): Promise<any> {
    // Implementation for getting all pages of a single letter
    const link = process.env.BASE_LINK + letter + "/";
    const lastPage = await this.getLastPage(letter);
    const allPages = Array.from({ length: lastPage }, (_, i) => i + 1);
    this.state.currentLetter = letter;

    for (const page of allPages) {
      this.state.currentLink = link + page;

      const cheerio = await this.load(this.state.currentLink);
      const items = cheerio('[data-type="browse-list"] ul li');

      if (!items.length) throw new Error();

      items.each((_i, element) => {
        const word = cheerio(element).text().trim();

        if (!word.length) throw new Error();

        if (isValid(word)) {
          this.wordsForLetter[this.state.currentLetter].push(word);

          this.state.currentLinkIndex += 1;
          this.state.currentWord = word;
        }
      });
    }
  }

  private async getMultipleLettersAllPages(letters: Letter[]): Promise<any> {
    // Implementation for getting all pages of multiple letters
  }

  private async getAllLettersOnePage(page: number): Promise<any> {
    // Implementation for getting all letters of one page
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
