export type Match = {
  strongest: string[];
  strong: string[];
  weak: string[];
};

export type LexicalCategory =
  | "noun"
  | "adjective"
  | "adverb"
  | "verb"
  | "conjunction"
  | "preposition";

export interface Family {
  category: LexicalCategory;
  like: string;
  synonyms: Match;
  antonyms: Match;
}

export interface Word {
  word: string;
  families: Family[];
}

export type Letter = {
  [K in string]: Word[];
};
