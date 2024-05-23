export type Suspense = {
  min: number;
  max: number;
};
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
}
