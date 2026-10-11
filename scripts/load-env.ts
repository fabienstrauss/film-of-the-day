import { loadEnvConfig } from "@next/env";

// Loads .env* files with the same precedence as Next.js, for code that runs outside of it.
// Import this first, before anything that reads process.env.
loadEnvConfig(process.cwd());
