import axios from "axios";
import {
  AXIOS_CONFIG,
  CATEGORIES,
  captureExamples,
  captureGroup,
  delay,
  duration,
  isValid,
  linkify,
} from "../lib/helpers";
import { load as chload } from "cheerio";
import type { Definition, LexicalType } from "../lib/types";

const DELAY_MIN = 2500;
const DELAY_MAX = 5000;
const dev = true;
const words: { [word: string]: Definition } = {};
const wordsForLetter: { [letter: string]: string[] } = {};

let totalSynonyms = 0;

async function load(url: string) {
  await delay(DELAY_MIN, DELAY_MAX);
  try {
    const response = await axios.get(url, AXIOS_CONFIG);
    const html = response.data;

    return chload(html);
  } catch (error) {
    throw new Error(`Unable to load Cheerio API with url ${url}`);
  }
}

function populateLinks() {
  const startTime = performance.now();
  console.log("🪄 Preparing links...");

  let links: string[] = [];

  if (dev) {
    links = [process.env.BASE_LINK + "a", process.env.BASE_LINK + "b"];
  } else {
    CATEGORIES.map((category) => {
      links.push(linkify(category));
    });
  }

  const endTime = performance.now();
  const takentime = duration(endTime - startTime);

  console.log(`🔗 Prepared ${links.length} links -- ${takentime}.`);

  return links;
}

async function scrape() {
  console.log("🕷️ Launching crawler, please wait...");

  const startTime = performance.now();

  await scrapeWords();

  console.log(`💰 Collected a total of ${totalSynonyms} synonyms.`);

  await Bun.write("scraped_words.json", JSON.stringify(words));

  const endTime = performance.now();
  const takenTime = duration(endTime - startTime);

  console.log(wordsForLetter);

  console.log(`🎉 Process finished in ${takenTime}.`);
}

async function scrapeWords() {
  await delay(DELAY_MIN, DELAY_MAX);
  const links = populateLinks();
  let collected = 0;

  console.log("📚 Building words library...");
  const startTime = performance.now();

  for (let i = 0; i < links.length; i++) {
    let link = links[i];
    let letter = link[link.length - 1];
    console.log(
      `Scraping for the letter ${letter} -- [${i + 1}/${links.length}]`
    );

    const cheerio = await load(process.env.BASE_LINK + letter);
    const items = cheerio('[data-type="browse-list"] ul li');

    if (items.length) {
      items.each((_i, element) => {
        const word = cheerio(element).text().trim();

        if (isValid(word)) {
          if (!wordsForLetter[letter]) {
            wordsForLetter[letter] = [];
          }

          wordsForLetter[letter].push(word);
          collected++;
        }
      });
    }

    console.log(wordsForLetter[letter]);

    for (const word of wordsForLetter[letter]) {
      await scrapeWord(word);
    }
  }

  const endTime = performance.now();
  const takenTime = duration(endTime - startTime);

  console.log(`📦 Collected a total of ${collected} words -- ${takenTime}.`);
}

async function scrapeWord(word: string) {
  await delay(1500, 3000);

  const selector =
    '[data-type="synonym-antonym-module"] [data-type="synonym-and-antonym-card"]';

  const cheerio = await load(process.env.WORD_LINK + word);
  const items = cheerio(selector);

  if (!items.length) return null; // No word definition found, skip

  items.each((_i, element) => {
    const item = cheerio(element).text().trim();

    const type = (item.match(/^\w+/)?.[0] ?? "") as LexicalType;
    const examples = captureExamples(cheerio, element);
    const synonyms = {
      strongest: captureGroup("Strongest", cheerio, element),
      strong: captureGroup("Strong", cheerio, element),
      weak: captureGroup("Weak", cheerio, element),
    };

    words[word] = {
      type,
      examples,
      synonyms,
    };

    totalSynonyms +=
      synonyms.strongest.length + synonyms.strong.length + synonyms.weak.length;
  });
}

const scraper = {
  scrape,
};

export { scraper };
