import "./scripts/load-env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  dbCredentials: {
    // Migrations run DDL, so they bypass the connection pooler.
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
