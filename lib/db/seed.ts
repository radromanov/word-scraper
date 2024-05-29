import { db } from "./index";
import type { Words } from "../types";
import { categoriesTable, definitionsTable, vocabularyTable } from "./schema";
import { duration } from "../helpers";
import { eq } from "drizzle-orm";
import type { ALPHABET } from "../constants";

async function getFile(filename: string): Promise<Words> {
  const path = Bun.pathToFileURL(filename);

  const file = (await Bun.file(path).json()) as Words;
  return file;
}

async function createCategories(data: Words) {
  const letters = Object.keys(data) as (typeof ALPHABET)[number][];

  for (const letter of letters) {
    await db.insert(categoriesTable).values({ letter }).onConflictDoNothing();
  }
}

async function createWords(data: Words) {
  const letters = Object.keys(data) as (typeof ALPHABET)[number][];

  for (const letter of letters) {
    const words = Object.keys(data[letter]);
    const [category] = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(eq(categoriesTable.letter, letter));

    for (const word of words) {
      await db
        .insert(vocabularyTable)
        .values({ word, categoryId: category.id })
        .onConflictDoNothing();
    }
  }
}

async function createDefinitions(data: Words) {
  const letters = Object.keys(data) as (typeof ALPHABET)[number][];

  for (const letter of letters) {
    const words = Object.keys(data[letter]);

    for (const word of words) {
      const definitions = data[letter][word];

      const [w] = await db
        .select({ id: vocabularyTable.id })
        .from(vocabularyTable)
        .where(eq(vocabularyTable.word, word));

      for (const definition of definitions) {
        await db.insert(definitionsTable).values({
          wordId: w.id,
          type: definition.type,
          examples: definition.examples,
          synonyms: definition.synonyms,
        });
      }
    }
  }
}

export async function seed(file: string) {
  console.log("🌱 Initializing database seeding...");

  const start = performance.now();

  const data = await getFile(file);

  await createCategories(data);
  await createWords(data);
  await createDefinitions(data);

  const end = performance.now();
  const time = duration(end - start);

  console.log(`🌳 Seeding the database completed -- ${time}`);
}
