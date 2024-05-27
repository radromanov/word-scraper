import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("questaurus_categories", {
  id: serial("id").primaryKey(),
  letter: varchar("letter", { length: 1 }).notNull().unique(),
});

export const vocabularyTable = pgTable("questaurus_vocabulary", {
  id: serial("id").primaryKey(),
  word: varchar("word", { length: 255 }).notNull().unique(),
  categoryId: integer("category_id").references(() => categoriesTable.id),
});

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  words: many(vocabularyTable),
}));

export const vocabularyRelations = relations(vocabularyTable, ({ one }) => ({
  letter: one(categoriesTable, {
    fields: [vocabularyTable.categoryId],
    references: [categoriesTable.id],
  }),
}));
