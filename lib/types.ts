import { ALPHABET } from "./helpers";

export type Suspense = {
  min: number;
  max: number;
};

export type LexicalType =
  | "noun"
  | "adjective"
  | "adverb"
  | "verb"
  | "conjunction"
  | "preposition"
  | "interjection"
  | "pronoun";

export type SynonymStrength = "strongest" | "strong" | "weak";

interface Definition {
  type: LexicalType;
  examples: string;
  synonyms: {
    [key in SynonymStrength]: string[];
  };
}

interface DefinitionDictionary {
  [word: string]: Definition[];
}

type CategoryKey = (typeof ALPHABET)[number];

export type Words = {
  [K in CategoryKey]: DefinitionDictionary;
};

export interface Variant {
  type:
    | "ONE_LETTER_NO_PAGE"
    | "MULTIPLE_LETTERS_NO_PAGE"
    | "NO_LETTER_ONE_PAGE"
    | "NO_LETTER_START_END_PAGE"
    | "ONE_LETTER_ONE_PAGE"
    | "MULTIPLE_LETTERS_ONE_PAGE"
    | "SINGLE_LETTER_START_END_PAGE"
    | "MULTIPLE_LETTERS_START_END_PAGE";
}

interface LetterParam extends Variant {
  letter: Letter;
  letters?: never;
  page?: never;
  startPage?: never;
  endPage?: never;
}
interface LettersParam extends Variant {
  letters: Letter[];
  letter?: never;
  page?: never;
  startPage?: never;
  endPage?: never;
}
interface PageParam extends Variant {
  page: number;
  letter?: never;
  letters?: never;
  startPage?: never;
  endPage?: never;
}
interface PagesParam extends Variant {
  startPage: number;
  endPage: number;
  letter?: never;
  letters?: never;
  page?: never;
}
interface LetterPageParam extends Variant {
  letter: Letter;
  page: number;
  letters?: never;
  startPage?: never;
  endPage?: never;
}
interface LettersPageParam extends Variant {
  letters: Letter[];
  page: number;
  letter?: never;
  startPage?: never;
  endPage?: never;
}
interface LetterPagesParam extends Variant {
  letter: Letter;
  startPage: number;
  endPage: number;
  letters?: never;
  page?: never;
}
interface LettersPagesParam extends Variant {
  letters: Letter[];
  startPage: number;
  endPage: number;
  letter?: never;
  page?: never;
}

export type Letter = (typeof ALPHABET)[number];

export type PrepareLinkParams =
  | (LetterParam & { type: "ONE_LETTER_NO_PAGE" })
  | (LettersParam & { type: "MULTIPLE_LETTERS_NO_PAGE" })
  | (PageParam & { type: "NO_LETTER_ONE_PAGE" })
  | (PagesParam & { type: "NO_LETTER_START_END_PAGE" })
  | (LetterPageParam & { type: "ONE_LETTER_ONE_PAGE" })
  | (LettersPageParam & { type: "MULTIPLE_LETTERS_ONE_PAGE" })
  | (LetterPagesParam & { type: "SINGLE_LETTER_START_END_PAGE" })
  | (LettersPagesParam & { type: "MULTIPLE_LETTERS_START_END_PAGE" });
