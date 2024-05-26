import type { CheerioAPI, Element } from "cheerio";

export const AXIOS_CONFIG = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  },
  timeout: 10000, // Fails the request if it takes more than 10 seconds
  validateStatus: (status: number) => status < 500, // Resolve only if the status code is less than 500; 4xx errors are handled in catch
};

export const CATEGORIES = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
] as const;

export function splitLetters(letter: string | string[]) {
  let letters: string[] = [];

  if (typeof letter === "string") {
    letter = letter.toLowerCase();
    if (letter.length > 1) {
      const letters = letter.match(/[(\s+\-,)]/)
        ? letter.split(/[(\s+\-,)]/)
        : letter.split("");
      for (const l of letters) {
        letters.push(process.env.BASE_LINK + l.toLowerCase());
      }
    } else {
      letters = [process.env.BASE_LINK + letter];
    }
  } else {
    for (const l of letter) {
      letters.push(process.env.BASE_LINK + l.toLowerCase());
    }
  }

  return letters;
}

// Helper function to introduce a random delay
export function delay(min: number, max: number) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;

  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function linkify(category: string) {
  const link = `${process.env.BASE_LINK}${category}`;

  return link;
}

export function duration(ms: number): string {
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

export function captureExamples(cheerio: CheerioAPI, element: Element) {
  return cheerio(element)
    .find("strong")
    .map((_i, el) =>
      cheerio(el)
        .text()
        .split(/(;|,)\s+/)
        .filter((el) => el !== "," && el !== ";")
    )
    .get();
}

export function captureGroup(
  group: "Strongest" | "Strong" | "Weak",
  cheerio: CheerioAPI,
  element: Element
) {
  return cheerio(element)
    .find(`p:contains("${group} match")`)
    .next()
    .children()
    .map((_i, el) =>
      cheerio(el)
        .text()
        .split(/(,)\s+/)
        .filter((el) => el !== "," && el.length)
    )
    .get();
}

/** */
export async function getSingleLetterAllPages(letter: string): Promise<any> {
  // Implementation for getting all pages of a single letter
}
export async function getMultipleLettersAllPages(
  letters: string[]
): Promise<any> {
  // Implementation for getting all pages of multiple letters
}
export async function getAllLettersOnePage(page: number): Promise<any> {
  // Implementation for getting all letters of one page
}
export async function getAllLettersStartEndPages(
  startPage: number,
  endPage: number
): Promise<any> {
  // Implementation for getting all letters from start page to end page
}
export async function getSingleLetterOnePage(
  letter: string,
  page: number
): Promise<any> {
  // Implementation for getting a single letter on a specific page
}
export async function getMultipleLettersOnePage(
  letters: string[],
  page: number
): Promise<any> {
  // Implementation for getting multiple letters on a specific page
}
export async function getMultipleLettersStartEndPages(
  letters: string[],
  startPage: number,
  endPage: number
): Promise<any> {
  // Implementation for getting multiple letters from start page to end page
}
