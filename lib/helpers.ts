import axios from "axios";
import { load, type AnyNode, type Cheerio, type CheerioAPI } from "cheerio";
import type { LexicalCategory, Match } from "./types";

export async function init(url: string) {
  try {
    const response = await axios.get(url);
    const html = response.data;

    return load(html);
  } catch (error: any) {
    throw new Error(
      `Error initializing Cheerio with URL ${url}: ${error.message}`
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
  callback: (attempt: number) => Promise<T>
) {
  const MAX_RETRIES = 3;

  if (attempt < MAX_RETRIES) {
    return await callback(attempt + 1);
  } else {
    console.log("Max retries reached. Exiting.");
    return defaultVal;
  }
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
