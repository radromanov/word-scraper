import axios from "axios";
import { load as chload } from "cheerio";
import {
  AXIOS_CONFIG,
  ALPHABET,
  duration,
  isValid,
  captureExamples,
  captureGroup,
} from "../lib/helpers";
import type {
  Definition,
  Letter,
  LexicalType,
  PrepareLinkParams,
} from "../lib/types";

class Scraper {
  private words: Record<Letter, Record<string, Definition[]>> = {} as Record<
    Letter,
    Record<string, Definition[]>
  >;

  private state = {
    currentLinkIndex: 0,
    currentLink: "",
    currentLetter: "a" as Letter,
    currentWord: "",
    attempt: 0,
    time: 0,
  };

  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 2000;

  constructor() {
    ALPHABET.forEach((letter) => {
      this.words[letter] = {};
    });

    this.loadExistingWords();
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
    await this.handler({
      page: 1,
      type: "NO_LETTER_ONE_PAGE",
    });
    const end = performance.now();
    this.state.time = end - start;

    await Bun.write("az-1.json", JSON.stringify(this.words));

    console.log(`🎉 Operation complete in ${duration(this.state.time)}.`);
  }

  private async handler(param: PrepareLinkParams): Promise<void> {
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
      SINGLE_LETTER_START_END_PAGE: () =>
        this.getSingleLetterStartEndPages(
          param.letter!,
          param.startPage!,
          param.endPage!
        ),
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

  private async getSingleLetterAllPages(letter: Letter): Promise<void> {
    const link = `${process.env.BASE_LINK}${letter}/`;
    const lastPage = await this.getLastPage(letter);
    this.state.currentLetter = letter;

    for (let page = 1; page <= lastPage; page++) {
      await this.loadAndExtractWordsWithRetry(link + page);
    }
  }

  private async getMultipleLettersAllPages(letters: Letter[]): Promise<void> {
    for (const letter of letters) {
      await this.getSingleLetterAllPages(letter);
    }
  }

  private async getAllLettersOnePage(page: number): Promise<void> {
    console.log(`⚙️ Collecting page ${page} for all letters...`);
    for (const letter of ALPHABET) {
      const link = `${process.env.BASE_LINK}${letter}/`;
      const lastPage = await this.getLastPage(letter);
      this.state.currentLetter = letter;

      if (page <= lastPage) {
        console.log(`✈️ Loading page ${link + page}`);
        await this.loadAndExtractWordsWithRetry(link + page);
      }
    }
  }

  private async getAllLettersStartEndPages(
    startPage: number,
    endPage: number
  ): Promise<void> {
    if (startPage > endPage)
      throw new Error("Start page must be less or equal to end page.");

    console.log(
      `⚙️ Collecting pages ${startPage}-${endPage} for all letters...\n`
    );

    for (const letter of ALPHABET) {
      const link = `${process.env.BASE_LINK}${letter}/`;
      const lastPage = await this.getLastPage(letter);
      this.state.currentLetter = letter;

      if (endPage <= lastPage) {
        for (let page = startPage; page <= endPage; page++) {
          console.log(`✈️ Loading page ${link + page}`);
          await this.loadAndExtractWordsWithRetry(link + page);
        }
      }
    }
  }

  private async getSingleLetterOnePage(
    letter: Letter,
    page: number
  ): Promise<void> {
    const link = `${process.env.BASE_LINK}${letter}/`;
    const lastPage = await this.getLastPage(letter);
    this.state.currentLetter = letter;

    if (page > lastPage)
      throw new Error(`Page ${page} for letter ${letter} doesn't exist.`);

    console.log(`✈️ Loading page ${link + page}`);
    await this.loadAndExtractWordsWithRetry(link + page);
  }

  private async getMultipleLettersOnePage(
    letters: Letter[],
    page: number
  ): Promise<void> {
    for (const letter of letters) {
      await this.getSingleLetterOnePage(letter, page);
    }
  }

  private async getSingleLetterStartEndPages(
    letter: Letter,
    startPage: number,
    endPage: number
  ): Promise<void> {
    if (startPage > endPage)
      throw new Error("Start page must be less or equal to end page.");

    const link = `${process.env.BASE_LINK}${letter}/`;
    const lastPage = await this.getLastPage(letter);
    this.state.currentLetter = letter;

    if (endPage >= lastPage)
      throw new Error(`Page ${endPage} for letter ${letter} doesn't exist.`);

    console.log(
      `⚙️ Collecting pages ${startPage}-${endPage} for letter ${letter}...\n`
    );

    for (let page = startPage; page <= endPage; page++) {
      console.log(`✈️ Loading page ${link + page}`);
      await this.loadAndExtractWordsWithRetry(link + page);
    }
  }

  private async getMultipleLettersStartEndPages(
    letters: Letter[],
    startPage: number,
    endPage: number
  ): Promise<void> {
    for (const letter of letters) {
      await this.getSingleLetterStartEndPages(letter, startPage, endPage);
    }
  }

  private async loadAndExtractWordsWithRetry(url: string): Promise<void> {
    for (let attempt = 1; attempt <= Scraper.MAX_RETRIES; attempt++) {
      try {
        await this.loadAndExtractWords(url);
        return;
      } catch (error: any) {
        console.log(
          `     ⮡ ⚠️ Letter ${this.state.currentLetter}, attempt ${attempt} failed: ${error.message}`
        );
        if (attempt < Scraper.MAX_RETRIES) {
          console.log(
            `     ⮡ ♻️ Retrying letter ${this.state.currentLetter} in ${
              Scraper.RETRY_DELAY_MS / 1000
            } seconds...`
          );
          await new Promise((res) => setTimeout(res, Scraper.RETRY_DELAY_MS));
        } else {
          console.error(
            `     ⮡ ❌ Failed to extract words from ${url} after ${Scraper.MAX_RETRIES} attempts.`
          );
        }
      }
    }
  }

  private async loadAndExtractWords(url: string): Promise<void> {
    console.log(`   ⮡ ⚙️ Collecting word(s)...`);
    this.state.currentLink = url;
    const wordsCount = await this.extractWords();
    console.log(`     ⮡ ✅ Collected ${wordsCount} word(s).`);
  }

  private async extractWords(): Promise<number> {
    let totalWords = 0;
    const cheerio = await this.load(this.state.currentLink);
    const items = cheerio('[data-type="browse-list"] ul li');

    if (!items.length) throw new Error("No items found");

    items.each((_i, element) => {
      const word = cheerio(element).text().trim();

      if (!word.length) throw new Error("No word found.");

      const existingDefinitions = this.words[this.state.currentLetter];

      if (!existingDefinitions[word] && isValid(word)) {
        this.words[this.state.currentLetter][word] = [];
        totalWords++;
        this.state.currentLinkIndex++;
      }
    });

    for (const word of Object.keys(this.words[this.state.currentLetter])) {
      this.state.currentWord = word;
      await this.loadWordDefinition(word);
    }

    return totalWords;
  }

  private async loadWordDefinition(word: string): Promise<void> {
    const selector =
      '[data-type="synonym-antonym-module"] [data-type="synonym-and-antonym-card"]';

    const cheerio = await this.load(`${process.env.WORD_LINK}${word}`);
    const items = cheerio(selector);

    // Remove object property if no word definition
    if (!items.length) delete this.words[this.state.currentLetter][word];

    items.each((_i, element) => {
      const item = cheerio(element).text().trim();

      if (!item.length) throw new Error("No word definition found.");

      const type = (item.match(/^\w+/)?.[0] ?? "") as LexicalType;
      const examples = captureExamples(cheerio, element);
      const synonyms = {
        strongest: captureGroup("Strongest", cheerio, element),
        strong: captureGroup("Strong", cheerio, element),
        weak: captureGroup("Weak", cheerio, element),
      };

      this.words[this.state.currentLetter][word].push({
        type,
        examples,
        synonyms,
      });
    });
  }

  private async loadExistingWords() {
    try {
      this.words = await Bun.file("az-1.json").json();
    } catch (error) {
      console.log("No existing data found, starting fresh.");
    }
  }
}

export default Scraper;
