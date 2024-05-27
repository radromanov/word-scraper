import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEON_PG_CONNECTION_URL!,
  },
  verbose: true,
  strict: true,
});
