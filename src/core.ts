import axios from "axios";
import {
  AXIOS_CONFIG,
  CATEGORIES,
  captureExamples,
  captureGroup,
  isValid,
  linkify,
} from "../lib/helpers";
import { load as chload, type CheerioAPI, type Element } from "cheerio";
import type {
  Category,
  Definition,
  LexicalType,
  Match,
  Word,
} from "../lib/types";

const DELAY_MIN = 2500;
const DELAY_MAX = 5000;
const dev = true;
// const words: {
//   [W in string]: {
//     type: LexicalType;
//     examples: string[];
//     synonyms: Match;
//     antonyms: Match;
//   };
// } = {};

async function load(url: string) {
  // await delay(DELAY_MIN, DELAY_MAX);
  try {
    const response = await axios.get(url, AXIOS_CONFIG);
    const html = response.data;

    return chload(html);
  } catch (error) {
    throw new Error(`Unable to load Cheerio API with url ${url}`);
  }
}

function populateLinks() {
  let links: string[] = [];

  if (dev) {
    links = [process.env.CATEGORY_LINK];
  } else {
    CATEGORIES.map((category) => {
      links.push(linkify(category));
    });
  }

  return links;
}

async function scrapeWords() {
  const links = populateLinks();
  const words: { [word: string]: Definition } = {};

  for (const link of links) {
    const cheerio = await load(process.env.CATEGORY_LINK);
    const items = cheerio('[data-type="browse-list"] ul li');
    const wordsForLetter: string[] = [];

    if (items.length) {
      console.log("loading words...");

      items.each((_i, element) => {
        const word = cheerio(element).text().trim();
        if (isValid(word)) {
          wordsForLetter.push(word);
        }
      });

      for (const word of wordsForLetter) {
        const definition = await scrapeWord(word);

        if (!definition) continue;

        words[word] = definition;
      }
    }
  }

  await Bun.write("scraped_words.json", JSON.stringify(words));

  console.log(words);
  return words;
}

async function scrapeWord(word: string) {
  const selector =
    '[data-type="synonym-antonym-module"] [data-type="synonym-and-antonym-card"]';
  //@ts-ignore
  let definition: Definition = {};

  const cheerio = await load(process.env.WORD_LINK + word);
  const items = cheerio(selector);

  if (!items.length) return null; // No word definition found, skip

  items.each((_i, element) => {
    const item = cheerio(element).text().trim();

    const type = (item.match(/^\w+/)?.[0] ?? "") as LexicalType;

    console.log("Type?", type);

    const examples = captureExamples(cheerio, element);

    const strongest = captureGroup("Strongest", cheerio, element);
    const strong = captureGroup("Strong", cheerio, element);
    const weak = captureGroup("Weak", cheerio, element);

    definition = {
      type,
      examples,
      synonyms: {
        strongest,
        strong,
        weak,
      },
      antonyms: {
        strongest: [],
        strong: [],
        weak: [],
      },
    };
  });
  return definition;
}

const scraper = {
  scrapeWords,
  scrapeWord,
};

export { scraper };
