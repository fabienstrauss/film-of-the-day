import { z } from "zod";

// Only the fields the app uses; zod strips the rest.
// TMDB sends "" or null for missing text depending on the endpoint, so those fields are nullish.

const genreSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const movieSummarySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  original_title: z.string(),
  original_language: z.string(),
  overview: z.string().nullish(),
  release_date: z.string().nullish(),
  poster_path: z.string().nullish(),
  backdrop_path: z.string().nullish(),
  popularity: z.number(),
  vote_average: z.number(),
  vote_count: z.number().int(),
});

export const discoverResponseSchema = z.object({
  page: z.number().int(),
  total_pages: z.number().int(),
  total_results: z.number().int(),
  results: z.array(movieSummarySchema),
});

export const movieDetailsSchema = movieSummarySchema.extend({
  imdb_id: z.string().nullish(),
  tagline: z.string().nullish(),
  runtime: z.number().int().nullish(),
  genres: z.array(genreSchema),
  credits: z.object({
    crew: z.array(
      z.object({
        id: z.number().int(),
        name: z.string(),
        job: z.string(),
        profile_path: z.string().nullish(),
      }),
    ),
  }),
  videos: z.object({
    results: z.array(
      z.object({
        key: z.string(),
        site: z.string(),
        type: z.string(),
        official: z.boolean(),
      }),
    ),
  }),
});

export type MovieSummary = z.infer<typeof movieSummarySchema>;
export type MovieDetails = z.infer<typeof movieDetailsSchema>;
