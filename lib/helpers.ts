import axios from "axios";
import { load, type AnyNode, type Cheerio, type CheerioAPI } from "cheerio";
import type { LexicalCategory, Match } from "./types";

async function config(url: string) {
  const response = await axios.get(url);
  const html = response.data;
  const cheerio = load(html);

  const result: { host: string; port: number; protocol: string }[] = [];
  const lines = cheerio("section .astro-lmapxigl .overflow-auto .grid")
    .text()
    .trim()
    .split("\n");

  lines.forEach((line) => {
    const match = line.match(/^(\d+\.\d+\.\d+\.\d+)(\d+)(https|http)/);

    if (match) {
      result.push({
        host: match[1],
        port: parseInt(match[2]),
        protocol: match[3],
      });
    }
  });

  console.log(result);

  return result;
}

async function goToPage() {
  const BASE_LINK = "https://iproyal.com/free-proxy-list/";

  const response = await axios.get(BASE_LINK);
  const html = response.data;
  const cheerio = load(html);

  const lastPage = parseInt(
    cheerio("[data-v-1e25dd90] .outlined-button").prev().text().split(" ")[1],
    10
  );

  const randomPage = Math.floor(Math.random() * lastPage) + 1;
  const PAGE_LINK = BASE_LINK + `?page=${randomPage}`;
  return PAGE_LINK;
}

export async function obtainProxy() {
  const page = await goToPage();
  const proxy = await config(page);

  const randomProxy = Math.floor(Math.random() * proxy.length);

  console.log(proxy[randomProxy]);
  return proxy[randomProxy];
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractCategoryAndLike(text: string): {
  category: LexicalCategory;
  like: string[];
} {
  const category = text.split(" ")[0] as LexicalCategory;

  const likeMatch = text.match(/as in (.+)$/);
  const like = likeMatch ? likeMatch[1].trim().split(",") : [];

  return { category, like };
}

export function extractSynonymsOrAntonyms(
  $: CheerioAPI,
  familyElement: Cheerio<AnyNode>,
  type: "synonym" | "antonym"
) {
  const result: Match = { strongest: [], strong: [], weak: [] };
  const selector =
    type === "synonym"
      ? "div[data-type='synonym-list']"
      : "div[data-type='antonym-list']";

  familyElement.find(selector).each((_idx, element) => {
    const strengthClass = $(element).parent().attr("class");

    let strength: "strong" | "strongest" | "weak" | null = null;
    if (strengthClass?.includes("strongest")) {
      strength = "strongest";
    } else if (strengthClass?.includes("strong")) {
      strength = "strong";
    } else {
      strength = "weak";
    }

    $(element)
      .find("li")
      .each((_i, li) => {
        const word = $(li).text().trim();
        if (strength) result[strength].push(word);
      });
  });

  return result;
}

export async function limit<T>(
  context: string,
  url: string,
  initialVal: T,
  attempt: number,
  callback: (url: string, initialVal: T, attempt: number) => Promise<T>
): Promise<T> {
  const MAX_RETRIES = 5;

  if (attempt < MAX_RETRIES) {
    console.log(
      `[${context.toUpperCase()}]   --- Attempt ${
        attempt + 1
      } of ${MAX_RETRIES}`
    );
    return await callback(url, initialVal, attempt + 1);
  } else {
    console.log(
      `[${context.toUpperCase()}]   --- ❌Max retries reached. Exiting.`
    );
    return initialVal;
  }
}

export function prepareLinks(categories: string[]) {
  const ENTRY_LINK = "https://www.thesaurus.com/list";

  categories = categories.map((category) => `${ENTRY_LINK}/${category}`);

  if (categories.length) {
    console.log(
      `[CATEGORIES]   --- ⚙️Prepared ${categories.length} category ${
        categories.length > 1 ? "links" : "link"
      } for extraction, initializing...\n`
    );
  } else {
    console.log(`[CATEGORIES]   --- ❌No category links found. Exiting.\n`);
  }
  return categories;
}

export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  const milliseconds = Math.floor(ms % 1000);

  if (hours) {
    return `${hours}h ${minutes}m ${seconds}s ${milliseconds}ms`;
  } else if (minutes) {
    return `${minutes}m ${seconds}s ${milliseconds}ms`;
  } else if (seconds) {
    return `${seconds}s ${milliseconds}ms`;
  } else {
    return `${milliseconds}ms`;
  }
}

export function isValid(word: string) {
  return (
    word.split(" ").length === 1 &&
    word.length > 3 &&
    !/[\/\\\-.''()0-9]/.test(word)
  );
}

// Function to save state to a file
export async function saveState<T>(filename: string, state: T) {
  let newState;

  if (typeof state !== "string") {
    newState = JSON.stringify(state);
  } else {
    newState = state;
  }

  await Bun.write(filename, JSON.stringify(newState));
}

// Function to load state from a file
export async function loadState<T>(filename: string, state: T): Promise<T> {
  try {
    const file = Bun.file(filename);

    return await file.json();
  } catch (error: any) {
    let newState;
    if (typeof state !== "string") {
      newState = JSON.stringify(state);
    } else {
      newState = state;
    }

    await Bun.write(filename, newState);

    return state;
  }
}
