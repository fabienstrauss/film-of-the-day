import {
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Catalog ids are TMDB ids, so upserts, URLs and API lookups need no mapping.

export const movies = pgTable("movies", {
  id: integer("id").primaryKey(),
  imdbId: text("imdb_id"),
  title: text("title").notNull(),
  originalTitle: text("original_title").notNull(),
  originalLanguage: text("original_language").notNull(),
  overview: text("overview"),
  tagline: text("tagline"),
  releaseDate: date("release_date"),
  runtime: integer("runtime"),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  trailerYoutubeKey: text("trailer_youtube_key"),
  popularity: doublePrecision("popularity").notNull(),
  voteAverage: real("vote_average").notNull(),
  voteCount: integer("vote_count").notNull(),
  // Null until the full details (runtime, genres, directors, trailer) have been fetched.
  metadataFetchedAt: timestamp("metadata_fetched_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const genres = pgTable("genres", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: integer("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.movieId, table.genreId] }), index().on(table.genreId)],
);

export const people = pgTable("people", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  profilePath: text("profile_path"),
});

// Only directors for now. Add roles (e.g. cast) when recommendations need them.
export const creditRole = pgEnum("credit_role", ["director"]);

export const movieCredits = pgTable(
  "movie_credits",
  {
    movieId: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    role: creditRole("role").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.personId, table.role] }),
    index().on(table.personId),
  ],
);
