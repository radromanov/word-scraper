import axios from "axios";
import { load as chload } from "cheerio";

import { AXIOS_CONFIG, CATEGORIES, duration, isValid } from "../lib/helpers";
import type { Letter, PrepareLinkParams, Suspense } from "../lib/types";

class Scraper {
  private suspense: Suspense = { min: 0, max: 0 };
  private wordsForLetter: { [K in Letter]: string[] };

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
    await this.prepareLinks({ page: 2, type: "NO_LETTER_ONE_PAGE" });

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

  private async getSingleLetterAllPages(letter: Letter): Promise<void> {
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

  private async getMultipleLettersAllPages(letters: Letter[]): Promise<void> {
    for (const letter of letters) {
      await this.getSingleLetterAllPages(letter);
    }
  }

  private async getAllLettersOnePage(page: number): Promise<void> {
    console.log(`⚙️ Collecting page ${page} for all letters...\n`);
    let total = 0;

    for (const letter of CATEGORIES) {
      this.state.currentLetter = letter;
      const link = process.env.BASE_LINK + letter + "/";
      const lastPage = await this.getLastPage(letter);

      // If page doesn't exist, skip this iteration
      if (page > lastPage) continue;

      console.log(`⏸️ Loading words for letter ${letter}...`);

      this.state.currentLink = link + page;

      const cheerio = await this.load(this.state.currentLink);
      const items = cheerio('[data-type="browse-list"] ul li');

      if (!items.length) continue;

      let words = 0;

      items.each((_i, element) => {
        const word = cheerio(element).text().trim();

        if (!word.length) throw new Error();

        if (isValid(word)) {
          this.wordsForLetter[this.state.currentLetter].push(word);

          words++;

          this.state.currentLinkIndex += 1;
          this.state.currentWord = word;
        }
      });
      total += words;
      console.log(
        `✅ Collected ${words} ${
          words === 0 || words > 1 ? "words" : "word"
        } for letter ${letter}.\n`
      );
    }

    console.log(
      `📦 Finished collecting ${total} words on page ${page} for all letters.`
    );
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
