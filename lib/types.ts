import type { CATEGORIES } from "./helpers";

export type Match = {
  strongest: string[];
  strong: string[];
  weak: string[];
};

export type LexicalType =
  | "noun"
  | "adjective"
  | "adverb"
  | "verb"
  | "conjunction"
  | "preposition";

export interface Definition {
  type: LexicalType;
  examples: string[];
  synonyms: Match;
  antonyms: Match;
}

export type Word = {
  word: string;
};

export type Letter = {
  [K in string]: Word[];
};

export type ScrapeOpts = {
  dev?: boolean;
};

export type LoadOpts = {
  url: string;
  suspense?: {
    min: number;
    max: number;
  };
};

// export type Category = (typeof CATEGORIES)[number];

export type Category = {
  [K in (typeof CATEGORIES)[number]]: {
    words: {
      [word: string]: {
        link: string;
        definition: Definition[];
      }[];
    }[];
  };
};
