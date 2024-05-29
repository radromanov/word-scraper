import { relations } from "drizzle-orm";
import { uniqueIndex } from "drizzle-orm/pg-core";
import {
  integer,
  json,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const categoriesTable = pgTable(
  "questaurus_categories",
  {
    id: serial("id").primaryKey(),
    letter: varchar("letter", { length: 1 }).notNull().unique(),
  },
  (table) => {
    return {
      letterIndex: uniqueIndex("letter_idx").on(table.letter),
    };
  }
);

export const vocabularyTable = pgTable(
  "questaurus_vocabulary",
  {
    id: serial("id").primaryKey(),
    word: varchar("word", { length: 255 }).notNull().unique(),
    categoryId: integer("category_id").references(() => categoriesTable.id),
  },
  (table) => {
    return {
      wordIndex: uniqueIndex("word_idx").on(table.word),
    };
  }
);

export const definitionsTable = pgTable("questaurus_definitions", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id").references(() => vocabularyTable.id),
  type: text("type", {
    enum: [
      "noun",
      "adjective",
      "adverb",
      "verb",
      "conjunction",
      "preposition",
      "interjection",
      "pronoun",
    ],
  }).notNull(),
  examples: text("examples").notNull(),
  synonyms: json("synonyms").notNull(),
});

// Relations

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  words: many(vocabularyTable),
}));

export const vocabularyRelations = relations(
  vocabularyTable,
  ({ one, many }) => ({
    letter: one(categoriesTable, {
      fields: [vocabularyTable.categoryId],
      references: [categoriesTable.id],
    }),
    definitions: many(definitionsTable),
  })
);

export const definitionsRelations = relations(definitionsTable, ({ one }) => ({
  word: one(vocabularyTable, {
    fields: [definitionsTable.wordId],
    references: [vocabularyTable.id],
  }),
}));
