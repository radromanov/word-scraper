# Word Scraper

## Overview

The Word Scraper project is designed to scrape words along with their respective lexical types, example words, and synonyms from Thesaurus.com. This project leverages modern web scraping tools and a database to store and manage the scraped data efficiently.

## Installation

To get started with the Word Scraper project, you need to have [Bun](https://bun.sh/) installed on your machine. Follow the instructions below to set up the project:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/word-scraper.git
   cd word-scraper
   ```
2. **Install dependencies**:

   Bun handles dependencies automatically. Simply run:

   ```bash
   bun install
   ```

3. **Set up environment variables**:

   Create a .env file in the root of the project and add the following environment variables:

   ```bash
   BASE_LINK="https://www.thesaurus.com/list/"
   WORD_LINK="https://www.thesaurus.com/browse/"
   NEON_PG_CONNECTION_URL="your_database_connection_string"
   ```

## Configuration

The project requires the following environment variables to be set:

- `BASE_LINK`: The base URL for listing words on Thesaurus.com.
- `WORD_LINK`: The URL used for browsing specific words on Thesaurus.com.
- `NEON_PG_CONNECTION_URL`: The connection string for your PostgreSQL database.

## Usage

To run the scraper, use the following command:

```bash
bun dev
```

This will start the scraper, which will fetch data from Thesaurus.com and store it in the configured PostgreSQL database.

- Note: the default behavior of the scraper is to create a json file, which it then uses to seed the database. You can alter this behavior by removing the following line from `src/Scraper.ts`:

```bash
# src/Scraper.ts
class Scraper {
   constructor() { ... }

   async exec(param: PrepareLinkParams) {
      # ...function logic
      await seed(filename); # ❌ Remove this
   }
}

# lib/db/seed.ts
export async function seed(
   file: string # ❌ Remove this
) {
  # ...function logic

  const data = await getFile(file); # ❌ Remove `file`

  # ...function logic
}

async function getFile(
   filename: string # ❌ Remove this
): Promise<Words> {
  const path = Bun.pathToFileURL("path/to/file"); # Manually provide filepath

  const file = (await Bun.file(path).json()) as Words;
  return file;
}
```

Altering the above would mean you would have to run the seed script manually, using `bun db:seed`.

### Example Output

Upon successful execution, the scraper will output JSON files containing the scraped words and their synonyms. For example, running the scraper for a specific target page will generate a file named az-2.json.

### Logging

The scraper provides logs during its execution, indicating the progress of word collection, retries on failures, and summary statistics of the collected data.

## Project Structure

Here is an overview of the project's structure:

```bash

word-scraper/
├── .env                # Environment variables
├── .gitignore          # .gitignore file
├── drizzle.config.ts   # Drizzle config
├── package.json        # Project dependencies and scripts
├── lib/                # Util files
│   ├── db/             # Database specific files
│   │   ├── index.ts    # Database entry point
│   │   ├── schema.ts   # Database schema definition file
│   │   └── seed.ts     # Database seed helper
│   └── ...
├── src/
│   ├── index.ts        # Entry point of the scraper
│   ├── Scraper.ts      # Main scraper logic
│   └── ...
└── ...
```

## Database Setup

To set up the database, use the following commands:

1. **Push database schema changes**:
   ```bash
   bun db:push
   ```
2. **View and manage the database schema**:
   ```bash
   bun db:view
   ```
3. **Seed the database** (seeded automatically via `bun dev` unless `package.json` was changed as per [Usage](https://github.com/radromanov/word-scraper?tab=readme-ov-file#Usage)):
   ```bash
   bun db:seed
   ```

## License

This project is licensed under the MIT License.
