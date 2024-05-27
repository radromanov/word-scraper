import { db } from "./index";
import type { SynonymStrength, Words } from "../types";
import {
  categoriesTable,
  vocabTable,
  examplesTable,
  synonymsTable,
} from "./schema";
import { duration, ALPHABET } from "../helpers";

async function getFile(): Promise<Words> {
  const path = Bun.pathToFileURL("sample.json");
  const file = (await Bun.file(path).json()) as Words;
  return file;
}

async function seed() {
  console.log("🌱 Seeding database...");

  const start = performance.now();

  const data = await getFile();

  for (const letter of Object.keys(data)) {
    const words = data[letter as (typeof ALPHABET)[number]];

    // Insert category
    const [category] = await db
      .insert(categoriesTable)
      .values({ letter })
      .onConflictDoNothing()
      .returning({ id: categoriesTable.id });

    for (const word of Object.keys(words)) {
      const wordItems = words[word];

      for (const item of wordItems) {
        const wordInsert = {
          categoryId: category.id,
          word,
          type: item.type,
        };

        // Insert word
        const [insertedWord] = await db
          .insert(vocabTable)
          .values(wordInsert)
          .onConflictDoNothing()
          .returning();

        if (insertedWord) {
          const wordId = insertedWord.id;

          // Insert examples
          const exampleInserts = item.examples.map((example) => ({
            vocabId: wordId,
            example,
          }));

          await db
            .insert(examplesTable)
            .values(exampleInserts)
            .onConflictDoNothing();

          // Insert synonyms
          for (const strength of Object.keys(item.synonyms)) {
            if (item.synonyms[strength as SynonymStrength].length) {
              const synonymInserts = item.synonyms[
                strength as SynonymStrength
              ].map((synonym) => ({
                exampleId: wordId,
                strength: strength as SynonymStrength,
                synonym,
              }));

              await db
                .insert(synonymsTable)
                .values(synonymInserts)
                .onConflictDoNothing();
            }
          }
        }
      }
    }
  }

  const end = performance.now();
  const time = duration(end - start);

  console.log(`🌳 Seeding the database took ${time}.`);
}

await db.delete(examplesTable);
await db.delete(synonymsTable);
await db.delete(vocabTable);
await db.delete(categoriesTable);

seed();
