import { db } from "./index";
import type { Words } from "../types";
import { categoriesTable, vocabularyTable } from "./schema";
import { ALPHABET, duration } from "../helpers";
import { eq } from "drizzle-orm";

async function getFile(): Promise<Words> {
  const path = Bun.pathToFileURL("sample.json");
  const file = (await Bun.file(path).json()) as Words;
  return file;
}

async function reset() {
  await db.delete(categoriesTable);
  await db.delete(vocabularyTable);
}

async function createCategories(data: Words) {
  const letters = Object.keys(data);

  for (const letter of letters) {
    await db.insert(categoriesTable).values({ letter }).onConflictDoNothing();
  }
}

async function createWords(data: Words) {
  const letters = Object.keys(data);

  for (const letter of letters) {
    const words = Object.keys(data[letter as (typeof ALPHABET)[number]]);
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

async function seed() {
  console.log("🌱 Seeding database...");

  const start = performance.now();

  const data = await getFile();

  await createCategories(data);
  await createWords(data);

  const end = performance.now();
  const time = duration(end - start);

  console.log(`🌳 Seeding the database took ${time}.`);
}

reset();
seed();
