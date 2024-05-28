import type { CheerioAPI, Element } from "cheerio";

// Helper function to introduce a random delay
export function delay(min: number, max: number) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;

  return new Promise((resolve) => setTimeout(resolve, delay));
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

export function captureExamples(cheerio: CheerioAPI, element: Element) {
  let examples = "";
  const items = cheerio(element)
    .find("strong")
    .each((i, el) => {
      const item = cheerio(el).text();
      const cleaned = item.replace(/[;\/]/g, ", ");

      examples += cleaned;
      if (i > 0 && i !== items.length - 1) {
        examples += ",";
      }
    });

  return examples;
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
