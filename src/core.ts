import axios from "axios";
import { load } from "cheerio";
import { limit } from "../lib/helpers";

export async function init(url: string) {
  try {
    const response = await axios.get(url, {
      timeout: 10000, // Fails the request if it takes more than 10 seconds
      validateStatus: (status) => status < 500, // Resolve only if the status code is less than 500; 4xx errors are handled in catch
    });

    if (response.status !== 200) {
      throw new Error(`Request failed with status code ${response.status}`);
    }

    const contentType = response.headers["content-type"];
    // Ensure that the response content type is text/html
    if (!contentType || !contentType.includes("text/html")) {
      throw new Error("Invalid content-type. Expected text/html");
    }

    const html = response.data;
    return load(html);
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(
        `HTTP error: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(`No response received: ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(
        `Error initializing Cheerio with URL ${url}: ${error.message}`
      );
    }
  }
}

export async function scrape(dev: boolean = false) {
  const categories = await scrapeCategories();
}

async function scrapeCategories(attempt: number = 1): Promise<string[]> {
  const ENTRY_LINK = "https://www.thesaurus.com/list";
  const alphabet: string[] = [];

  try {
    const cheerio = await init(ENTRY_LINK + "/a");

    const items = cheerio('[data-type="az-menu"] menu li');

    if (items.length === 0) {
      console.log("No items found, retrying...", attempt);

      return await limit(attempt, alphabet, scrapeCategories);
    } else {
      items.each((_index, element) => {
        const letter = cheerio(element).text().trim();
        alphabet.push(letter);
      });
    }

    if (!alphabet.length) {
      throw new Error("Could not capture categories list.");
    }

    return alphabet;
  } catch (error: any) {
    console.error(`Error in scrapeCategories: ${error.message}`);
    return alphabet;
  }
}
