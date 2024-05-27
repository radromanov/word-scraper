import { db } from "./index";
import type { Words } from "../types";
import { categoriesTable, definitionsTable, vocabularyTable } from "./schema";
import { ALPHABET, duration } from "../helpers";
import { eq } from "drizzle-orm";

async function getFile(): Promise<Words> {
  const path = Bun.pathToFileURL("az-1.json");
  const file = (await Bun.file(path).json()) as Words;
  return file;
}

async function reset() {
  await db.delete(definitionsTable);
  await db.delete(vocabularyTable);
  await db.delete(categoriesTable);
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

async function seed() {
  console.log("🌱 Seeding database...");

  const start = performance.now();

  const data = await getFile();

  await createCategories(data);
  await createWords(data);
  await createDefinitions(data);

  const end = performance.now();
  const time = duration(end - start);

  console.log(`🌳 Seeding the database took ${time}.`);
}

await reset();
await seed();
