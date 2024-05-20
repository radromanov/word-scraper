type Match = {
  strong: string[];
  weak: string[];
};

type LexicalCategory =
  | "noun"
  | "adjective"
  | "adverb"
  | "verb"
  | "conjunction"
  | "preposition";

interface Family {
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
