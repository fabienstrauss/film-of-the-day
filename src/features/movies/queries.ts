import { and, asc, desc, eq, gte } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/db";
import { genres, movieCredits, movieGenres, movies, people } from "@/db/schema";

// Catalog reads for pages. Cached for a day: the catalog changes at most once per sync.

const movieCardColumns = {
  id: movies.id,
  title: movies.title,
  releaseDate: movies.releaseDate,
  posterPath: movies.posterPath,
  voteAverage: movies.voteAverage,
};

export type MovieCardData = {
  id: number;
  title: string;
  releaseDate: string | null;
  posterPath: string | null;
  voteAverage: number;
};

export async function getMovie(id: number) {
  "use cache";
  cacheLife("days");

  const [[movie], movieGenreRows, directors] = await db.batch([
    db
      .select({
        ...movieCardColumns,
        originalTitle: movies.originalTitle,
        overview: movies.overview,
        tagline: movies.tagline,
        runtime: movies.runtime,
        backdropPath: movies.backdropPath,
        trailerYoutubeKey: movies.trailerYoutubeKey,
        voteCount: movies.voteCount,
      })
      .from(movies)
      .where(eq(movies.id, id)),
    db
      .select({ id: genres.id, name: genres.name })
      .from(movieGenres)
      .innerJoin(genres, eq(genres.id, movieGenres.genreId))
      .where(eq(movieGenres.movieId, id))
      .orderBy(asc(genres.name)),
    db
      .select({ id: people.id, name: people.name })
      .from(movieCredits)
      .innerJoin(people, eq(people.id, movieCredits.personId))
      .where(and(eq(movieCredits.movieId, id), eq(movieCredits.role, "director"))),
  ]);

  if (!movie) return null;
  return { ...movie, genres: movieGenreRows, directors };
}

/** Highest TMDB rating among films with enough votes for the rating to mean something. */
export async function listTopRatedMovies(limit: number): Promise<MovieCardData[]> {
  "use cache";
  cacheLife("days");

  return db
    .select(movieCardColumns)
    .from(movies)
    .where(gte(movies.voteCount, 5000))
    .orderBy(desc(movies.voteAverage))
    .limit(limit);
}

export async function listMostVotedMovies(limit: number) {
  "use cache";
  cacheLife("days");

  return db
    .select({ id: movies.id, title: movies.title })
    .from(movies)
    .orderBy(desc(movies.voteCount))
    .limit(limit);
}
