import axios from "axios";
import { load as chload } from "cheerio";

import {
  AXIOS_CONFIG,
  CATEGORIES,
  delay,
  duration,
  isValid,
  linkify,
} from "../lib/helpers";
import type { Suspense } from "../lib/types";

class Scraper {
  private dev: boolean;
  private suspense: Suspense = { min: 0, max: 0 };
  private links: string[];
  private wordsForLetter: { [K in (typeof CATEGORIES)[number]]: string[] };

  private MAX_RETRIES = 5;
  private state: {
    currentLinkIndex: number;
    currentLetter: string;
    attempt: number;
    time: number;
  };

  constructor(dev = false) {
    this.dev = dev;
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
      currentLinkIndex: 0,
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
    this.prepareLinks();
    await this.getWordsForLetter();

    const end = performance.now();
    this.state.time = end - start;

    console.log(this.wordsForLetter);

    console.log(`🎉 Operation complete in ${duration(this.state.time)}.`);
  }

  private prepareLinks() {
    console.log("🪄 Preparing links...");
    const start = performance.now();

    if (this.dev) {
      console.log("⚠️ Preparing dev mode links only.");
      this.links = [
        process.env.BASE_LINK + "a",
        process.env.BASE_LINK + "b",
        process.env.BASE_LINK + "c",
      ];
    } else {
      for (const cat of CATEGORIES) {
        this.links.push(linkify(cat));
      }
    }

    const end = performance.now();
    const time = duration(end - start);

    console.log(`🔗 Prepared ${this.links.length} links -- ${time}`);
  }

  private async getWordsForLetter(): Promise<void> {
    // await delay(this.suspense.min, this.suspense.max);

    for (let i = this.state.currentLinkIndex; i < this.links.length; i++) {
      const link = this.links[i];
      this.state.currentLetter = link.slice(-1);

      try {
        const cheerio = await this.load(link);
        const items = cheerio('[data-type="browse-list"] ul li');
        const letter = link.slice(-1) as (typeof CATEGORIES)[number];

        if (!items.length) {
          throw new Error();
        }

        // const lastPage = await this.getPagesForLetter(link);

        items.each((_i, element) => {
          const word = cheerio(element).text().trim();
          if (isValid(word)) {
            this.wordsForLetter[letter].push(word);
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

  private async getPagesForLetter(link: string) {
    const cheerio = await this.load(link);
    const href = cheerio(
      '#content [data-type="bottom-paging"] ul [data-type="paging-arrow"] a'
    )
      .last()
      .attr("href")
      ?.split("/");

    if (!href || !href.length) {
      throw new Error();
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
}

export default Scraper;
