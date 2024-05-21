import axios from "axios";
import { load } from "cheerio";
import { formatDuration, isValid, limit } from "../lib/helpers";

export async function init(url: string) {
  //console.log(`[INIT] Initializing Cheerio for URL: ${url}`);
  try {
    const response = await axios.get(url, {
      timeout: 10000, // Fails the request if it takes more than 10 seconds
      validateStatus: (status) => status < 500, // Resolve only if the status code is less than 500; 4xx errors are handled in catch
    });

    if (response.status !== 200) {
      throw new Error(
        `[INIT] Request failed with status code ${response.status}`
      );
    }

    const contentType = response.headers["content-type"];
    // Ensure that the response content type is text/html
    if (!contentType || !contentType.includes("text/html")) {
      throw new Error("[INIT] Invalid content-type. Expected text/html");
    }

    const html = response.data;
    return load(html);
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(
        `[INIT] HTTP error: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(`[INIT] No response received: ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(
        `[INIT] Error initializing Cheerio with URL ${url}: ${error.message}`
      );
    }
  }
}

export async function scrape(dev: boolean = false) {
  const categories = await scrapeCategories();
  const links = prepareLinks(categories);
  const words = await scrapeWords(1, links, {});
}

async function scrapeCategories(attempt: number = 1): Promise<string[]> {
  const ENTRY_LINK = "https://www.thesaurus.com/list";
  const alphabet: string[] = [];
  const filtered: string[] = [];

  try {
    const cheerio = await init(ENTRY_LINK + "/a");

    const items = cheerio('[data-type="az-menu"] menu li');

    if (items.length === 0) {
      console.log(
        `[CATEGORIES] ⏸️No items found on attempt ${attempt}, retrying...`
      );

      return await limit(attempt, alphabet, scrapeCategories);
    } else {
      console.log(
        `[CATEGORIES] ✅Found items on attempt ${attempt}, continuing...`
      );
      items.each((_index, element) => {
        const letter = cheerio(element).text().trim();
        // Only add alphabetical characters
        if (/^[a-zA-Z]$/.test(letter)) {
          alphabet.push(letter);
        } else {
          filtered.push(letter);
        }
      });
      console.log(`[CATEGORIES]   --- 💰Collected ${alphabet.length} items.`);
      console.log(
        `[CATEGORIES]   --- ♻️Filtered ${filtered.length} ${
          filtered.length > 1 ? "items" : "item"
        }.`
      );
    }

    if (!alphabet.length) {
      throw new Error("[CATEGORIES] Could not capture categories list.");
    }

    return alphabet;
  } catch (error: any) {
    console.error(`[CATEGORIES] Error in scrapeCategories: ${error.message}`);
    return alphabet;
  }
}

function prepareLinks(categories: string[]) {
  const ENTRY_LINK = "https://www.thesaurus.com/list";
  const links: string[] = [];

  for (const category of categories) {
    const link = ENTRY_LINK + `/${category}`;

    links.push(link);
  }
  console.log(
    `[CATEGORIES]   --- ⚙️Prepared ${links.length} ${
      links.length > 1 ? "links" : "link"
    } for extraction, initializing...\n`
  );
  return links;
}

async function scrapeWords(
  attempt: number = 1,
  links: string[],
  words: { [letter: string]: string[] }
): Promise<{ [letter: string]: string[] }> {
  let total = 0;
  const startTime = performance.now(); // Start the timer

  for (const link of links) {
    const cheerio = await init(link);

    const currentLetter = link[link.length - 1];
    const wordsForLetter: string[] = [];

    const items = cheerio('[data-type="browse-list"] ul li');

    if (items.length === 0) {
      console.log(
        `[WORDS - ${currentLetter.toUpperCase()}] ⏸️No items found on attempt ${attempt}, retrying...`
      );

      return await limit(attempt, words, scrapeWords, links, words);
    } else {
      console.log(
        `[WORDS - ${currentLetter.toUpperCase()}] ✅Found items on attempt ${attempt}, continuing...\n`
      );
      items.each((_index, element) => {
        const word = cheerio(element).text().trim();

        if (isValid(word)) {
          wordsForLetter.push(word);
          total++;
        }
      });
    }

    words[currentLetter] = [...wordsForLetter];
  }

  const endTime = performance.now(); // Start the timer
  const duration = formatDuration(endTime - startTime);

  console.log(`[WORDS] Collected ${total} words total -- ${duration}.`);
  return words;
}
