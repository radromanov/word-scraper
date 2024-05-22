import { unlink } from "node:fs/promises";
import axios from "axios";
import { load } from "cheerio";
import {
  delay,
  formatDuration,
  isValid,
  limit,
  loadState,
  prepareLinks,
  saveState,
} from "../lib/helpers";

export async function init(url: string) {
  //console.log(`[INIT] Initializing Cheerio for URL: ${url}`);
  let proxy = await obtainProxy();

  console.log(`[INIT] Initializing Cheerio for URL: ${url}`);
  console.log(`[INIT] Current proxy settings: ${proxy}\n`);

  await delay(5000);

  try {
    const response = await axios.get(url, {
      proxy,
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
  const startTime = performance.now();

  const categories = await scrapeCategories("https://www.thesaurus.com/list/a");
  const links = prepareLinks(categories);

  let state = await loadState<{
    currentLetter: string;
    currentLinkIndex: number;
    words: { [letter: string]: string[] };
  }>("scrape_state.json", {
    currentLetter: "a",
    currentLinkIndex: 0,
    words: {},
  });

  let total = 0;

  for (let i = state.currentLinkIndex; i < links.length; i++) {
    const link = links[i];
    const currentLetter = link[link.length - 1];

    // Skip to the next letter if already processed
    if (currentLetter < state.currentLetter) continue;

    try {
      const wordsForLetter = await scrapeWords(link);
      state.words[currentLetter] = wordsForLetter;

      total += wordsForLetter.length;

      state.currentLetter = currentLetter;
      state.currentLinkIndex = i + 1; // Update the current link index
      await saveState("scrape_state.json", state); // Save the state after each successful iteration
    } catch (error: any) {
      console.error(`Error scraping ${currentLetter}:`, error.message);
    }
  }

  const endTime = performance.now();
  const duration = formatDuration(endTime - startTime);
  console.log(`\n🎉Collected ${total} words -- ${duration}`);
  console.log(state.words);
  await unlink("scrape_state.json");
}

async function scrapeCategories(
  url: string,
  alphabet: string[] = [],
  attempt = 1
): Promise<string[]> {
  const filtered: string[] = [];

  try {
    const cheerio = await init(url);

    const items = cheerio('[data-type="az-menu"] menu li');

    if (items.length === 0) {
      console.log(
        `[CATEGORIES] ⏸️No category links found on attempt ${attempt}, retrying...`
      );

      return await limit<string[]>(
        "CATEGORIES",
        url,
        alphabet,
        attempt,
        scrapeCategories
      );
    } else {
      console.log(
        `[CATEGORIES] ✅Found category links on attempt ${attempt}, continuing...`
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
      console.log(
        `[CATEGORIES]   --- 💰Collected ${alphabet.length} category links.`
      );
      console.log(
        `[CATEGORIES]   --- ♻️Filtered ${filtered.length} category ${
          filtered.length > 1 ? "links" : "link"
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

async function scrapeWords(
  url: string,
  words: string[] = [],
  attempt = 1
): Promise<string[]> {
  const cheerio = await init(url);
  const currentLetter = url[url.length - 1];

  const items = cheerio('[data-type="browse-list"] ul li');

  if (items.length === 0) {
    console.log(
      `[WORDS - ${currentLetter.toUpperCase()}] ⏸️No words found on attempt ${attempt}, retrying...`
    );

    return await limit<string[]>(
      `words - ${currentLetter}`,
      url,
      words,
      attempt,
      scrapeWords
    );
  } else {
    console.log(
      `[WORDS - ${currentLetter.toUpperCase()}] ✅Found words on attempt ${attempt}, continuing...`
    );
    items.each((_i, element) => {
      const word = cheerio(element).text().trim();

      if (isValid(word)) {
        words.push(word);
      }
    });
  }

  return words;
}
