import { desc, getTableColumns, inArray, isNull, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { genres, movieCredits, movieGenres, movies, people } from "@/db/schema";
import type { MovieDetails, MovieSummary } from "@/lib/tmdb/schemas";

// Writes TMDB data into the catalog. All writes are idempotent upserts, so syncs can be re-run safely.

export async function listMovieIdsMissingMetadata() {
  const rows = await db
    .select({ id: movies.id })
    .from(movies)
    .where(isNull(movies.metadataFetchedAt))
    .orderBy(desc(movies.voteCount));
  return rows.map((row) => row.id);
}

/** Stores movies from TMDB list endpoints. Refreshes list fields, leaves fetched details untouched. */
export async function upsertMovieSummaries(summaries: MovieSummary[]) {
  const rows = uniqueBy(summaries, (movie) => movie.id).map(toMovieRow);
  if (rows.length === 0) return;

  await db
    .insert(movies)
    .values(rows)
    .onConflictDoUpdate({
      target: movies.id,
      set: { ...overwriteWithIncoming(movies, rows[0]), updatedAt: sql`now()` },
    });
}

/** Stores full movie details and replaces each movie's genres and directors. */
export async function storeMovieDetails(details: MovieDetails[]) {
  const unique = uniqueBy(details, (movie) => movie.id);
  if (unique.length === 0) return;

  const movieIds = unique.map((movie) => movie.id);
  const movieRows = unique.map((movie) => ({
    ...toMovieRow(movie),
    imdbId: movie.imdb_id || null,
    tagline: movie.tagline || null,
    runtime: movie.runtime || null,
    trailerYoutubeKey: pickTrailerKey(movie.videos.results),
    metadataFetchedAt: new Date(),
  }));

  const genreRows = uniqueBy(
    unique.flatMap((movie) => movie.genres),
    (genre) => genre.id,
  );
  const movieGenreRows = unique.flatMap((movie) =>
    uniqueBy(movie.genres, (genre) => genre.id).map((genre) => ({
      movieId: movie.id,
      genreId: genre.id,
    })),
  );

  const directorsByMovie = unique.map((movie) => ({
    movieId: movie.id,
    directors: uniqueBy(
      movie.credits.crew.filter((member) => member.job === "Director"),
      (member) => member.id,
    ),
  }));
  const peopleRows = uniqueBy(
    directorsByMovie.flatMap(({ directors }) => directors),
    (person) => person.id,
  ).map((person) => ({ id: person.id, name: person.name, profilePath: person.profile_path || null }));
  const creditRows = directorsByMovie.flatMap(({ movieId, directors }) =>
    directors.map((person) => ({ movieId, personId: person.id, role: "director" as const })),
  );

  // Runs as one transaction, so a movie never ends up with half its genres or directors.
  const statements: BatchItem<"pg">[] = [
    db
      .insert(movies)
      .values(movieRows)
      .onConflictDoUpdate({
        target: movies.id,
        set: { ...overwriteWithIncoming(movies, movieRows[0]), updatedAt: sql`now()` },
      }),
    db.delete(movieGenres).where(inArray(movieGenres.movieId, movieIds)),
    db.delete(movieCredits).where(inArray(movieCredits.movieId, movieIds)),
  ];
  if (genreRows.length > 0) {
    statements.push(
      db
        .insert(genres)
        .values(genreRows)
        .onConflictDoUpdate({ target: genres.id, set: overwriteWithIncoming(genres, genreRows[0]) }),
      db.insert(movieGenres).values(movieGenreRows),
    );
  }
  if (peopleRows.length > 0) {
    statements.push(
      db
        .insert(people)
        .values(peopleRows)
        .onConflictDoUpdate({ target: people.id, set: overwriteWithIncoming(people, peopleRows[0]) }),
      db.insert(movieCredits).values(creditRows),
    );
  }
  await db.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
}

/** Removes movies that no longer exist on TMDB. Genres and credits go with them. */
export async function removeMovies(ids: number[]) {
  if (ids.length === 0) return;
  await db.delete(movies).where(inArray(movies.id, ids));
}

function toMovieRow(movie: MovieSummary) {
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    originalLanguage: movie.original_language,
    overview: movie.overview || null,
    releaseDate: movie.release_date || null,
    posterPath: movie.poster_path || null,
    backdropPath: movie.backdrop_path || null,
    popularity: movie.popularity,
    voteAverage: movie.vote_average,
    voteCount: movie.vote_count,
  };
}

function pickTrailerKey(videos: MovieDetails["videos"]["results"]) {
  const trailers = videos.filter((video) => video.site === "YouTube" && video.type === "Trailer");
  return (trailers.find((video) => video.official) ?? trailers[0])?.key ?? null;
}

/** `ON CONFLICT DO UPDATE` set that overwrites every non-key column in `row` with the incoming value. */
function overwriteWithIncoming(table: PgTable, row: object) {
  const columns = getTableColumns(table);
  return Object.fromEntries(
    Object.keys(row)
      .filter((key) => !columns[key].primary)
      .map((key) => [key, sql.raw(`excluded."${columns[key].name}"`)]),
  );
}

function uniqueBy<T>(items: T[], key: (item: T) => unknown) {
  return [...new Map(items.map((item) => [key(item), item])).values()];
}
