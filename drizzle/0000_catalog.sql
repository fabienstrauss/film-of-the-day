CREATE TYPE "public"."credit_role" AS ENUM('director');--> statement-breakpoint
CREATE TABLE "genres" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_credits" (
	"movie_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"role" "credit_role" NOT NULL,
	CONSTRAINT "movie_credits_movie_id_person_id_role_pk" PRIMARY KEY("movie_id","person_id","role")
);
--> statement-breakpoint
CREATE TABLE "movie_genres" (
	"movie_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "movie_genres_movie_id_genre_id_pk" PRIMARY KEY("movie_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" integer PRIMARY KEY NOT NULL,
	"imdb_id" text,
	"title" text NOT NULL,
	"original_title" text NOT NULL,
	"original_language" text NOT NULL,
	"overview" text,
	"tagline" text,
	"release_date" date,
	"runtime" integer,
	"poster_path" text,
	"backdrop_path" text,
	"trailer_youtube_key" text,
	"popularity" double precision NOT NULL,
	"vote_average" real NOT NULL,
	"vote_count" integer NOT NULL,
	"metadata_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"profile_path" text
);
--> statement-breakpoint
ALTER TABLE "movie_credits" ADD CONSTRAINT "movie_credits_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_credits" ADD CONSTRAINT "movie_credits_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movie_credits_person_id_index" ON "movie_credits" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "movie_genres_genre_id_index" ON "movie_genres" USING btree ("genre_id");