import type { z } from "zod";
import { env } from "@/env";
import { discoverResponseSchema, movieDetailsSchema } from "./schemas";

const BASE_URL = "https://api.themoviedb.org/3";
const MAX_ATTEMPTS = 5;

type QueryParams = Record<string, string | number | boolean | undefined>;

export class TmdbError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`TMDB ${path} responded with ${status}`);
  }
}

// Retries rate limits (429), server errors and network failures with exponential backoff.
async function request<T>(path: string, params: QueryParams, schema: z.ZodType<T>): Promise<T> {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  for (let attempt = 1; ; attempt++) {
    let response: Response | undefined;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${env.TMDB_API_READ_ACCESS_TOKEN}`,
          Accept: "application/json",
        },
      });
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
    }

    if (response?.ok) return schema.parse(await response.json());

    const retryable = !response || response.status === 429 || response.status >= 500;
    if (response && (!retryable || attempt === MAX_ATTEMPTS)) {
      throw new TmdbError(response.status, path);
    }

    const retryAfterSeconds = Number(response?.headers.get("retry-after"));
    const delayMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 500 * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export function discoverMovies(params: QueryParams) {
  return request(
    "/discover/movie",
    { include_adult: false, include_video: false, ...params },
    discoverResponseSchema,
  );
}

export function getMovieDetails(id: number) {
  return request(`/movie/${id}`, { append_to_response: "credits,videos" }, movieDetailsSchema);
}
