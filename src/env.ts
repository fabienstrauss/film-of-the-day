import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  TMDB_API_READ_ACCESS_TOKEN: z.string().min(1),
});

export const env = envSchema.parse(process.env);
