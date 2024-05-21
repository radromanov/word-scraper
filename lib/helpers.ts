import axios from "axios";
import { load, type AnyNode, type Cheerio, type CheerioAPI } from "cheerio";
import type { LexicalCategory, Match } from "./types";

export async function init(url: string) {
  console.log(`[INIT] Initializing Cheerio for URL: ${url}\n`);
  try {
    const response = await axios.get(url);
    const html = response.data;

    return load(html);
  } catch (error: any) {
    throw new Error(
      `[INIT] Error initializing Cheerio with URL ${url}: ${error.message}\n`
    );
  }
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
  attempt: number,
  defaultVal: T,
  callback: (attempt: number, ...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<T> {
  const MAX_RETRIES = 5;

  if (attempt < MAX_RETRIES) {
    console.log(`[LIMIT]   --- Attempt ${attempt + 1} of ${MAX_RETRIES}\n`);
    return await callback(attempt + 1, ...args);
  } else {
    console.log("[LIMIT]   --- ❌Max retries reached. Exiting.");
    return defaultVal;
  }
}

export function formatDuration(ms: number): string {
  const milliseconds = Math.floor(ms % 1000);
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  const formatted = [
    hours > 0 ? `${hours}h` : "",
    minutes > 0 ? `${minutes}m` : "",
    seconds > 0 ? `${seconds}s` : "",
    `${milliseconds}ms`,
  ]
    .filter(Boolean)
    .join(" ");

  return formatted;
}

export function isValid(word: string) {
  return (
    // Word cannot be of more than 1 set of characters, hyphens are allowed
    word.split(" ").length === 1 &&
    // word cannot include any brackets
    !word.includes("(") &&
    !word.includes(")")
  );
}
