import axios from "axios";
import { AXIOS_CONFIG, CATEGORIES, isValid, linkify } from "../lib/helpers";
import { load as chload } from "cheerio";

const DELAY_MIN = 2500;
const DELAY_MAX = 5000;
let links: string[] = [];
const words: { word: string; link: string }[] = [];

async function load(url: string) {
  // await delay(DELAY_MIN, DELAY_MAX);

  const response = await axios.get(url, AXIOS_CONFIG);
  const html = response.data;

  return chload(html);
}

function populateLinks() {
  CATEGORIES.map((category) => {
    links.push(linkify(category));
  });

  return links;
}

async function scrapeWords(dev: boolean = false) {
  if (dev) {
    links = [process.env.CATEGORY_LINK];
  } else {
    populateLinks();
  }

  for (const link of links) {
    const cheerio = await load(link);
    const items = cheerio('[data-type="browse-list"] ul li');

    if (items.length) {
      console.log("loading words...");

      items.each((_i, element) => {
        const word = cheerio(element).text().trim();
        if (isValid(word)) {
          words.push({ word, link: process.env.WORD_LINK + word });
        }
      });
    }
  }

  console.log(words);
  return words;
}

async function scrapeWord(dev: boolean = false) {
  if (dev) {
    const cheerio = await load(process.env.WORD_LINK + "turkey");
    const items = cheerio('section [data-type="synonym-and-antonym-card"]');

    console.log(cheerio.html(items));

    items.each((_i, element) => {
      const item = cheerio(element).text();
    });
  } else {
    for (const word of words) {
      const cheerio = await load(word.link);
      const items = cheerio('[data-type="synonym-antonym-module"] div');
    }
  }
}

const scraper = {
  scrapeWords,
  scrapeWord,
};

export { scraper };
