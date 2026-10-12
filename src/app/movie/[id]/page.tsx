import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TrailerPlayer } from "@/components/movies/trailer-player";
import {
  formatRuntime,
  formatVoteCount,
  movieHref,
  movieSlug,
  parseMovieId,
  releaseYear,
} from "@/features/movies/format";
import { getMovie, listMostVotedMovies } from "@/features/movies/queries";

type Params = PageProps<"/movie/[id]">["params"];

// The most-voted films are prerendered at build time. Every other movie renders on its
// first visit and is served from the cache after that.
export async function generateStaticParams() {
  const movies = await listMostVotedMovies(100);
  return movies.map((movie) => ({ id: movieSlug(movie) }));
}

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const movie = await loadMovie(params);
  if (!movie) notFound();

  const year = releaseYear(movie.releaseDate);
  return {
    title: year ? `${movie.title} (${year})` : movie.title,
    description: movie.overview,
    alternates: { canonical: movieHref(movie) },
  };
}

export default function MoviePage({ params }: PageProps<"/movie/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh] animate-pulse bg-zinc-900/40" />}>
      <MovieDetails params={params} />
    </Suspense>
  );
}

async function loadMovie(params: Params) {
  const id = parseMovieId((await params).id);
  return id === null ? null : getMovie(id);
}

async function MovieDetails({ params }: { params: Params }) {
  const movie = await loadMovie(params);
  if (!movie) notFound();

  const facts = [
    releaseYear(movie.releaseDate),
    formatRuntime(movie.runtime),
    movie.genres.map((genre) => genre.name).join(", "),
  ].filter(Boolean);

  return (
    <article>
      <section className="relative isolate flex min-h-[70vh] items-end overflow-hidden">
        {movie.backdropPath && (
          <Image
            src={movie.backdropPath}
            alt=""
            fill
            preload
            sizes="100vw"
            className="-z-10 object-cover"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-background via-background/60 to-background/20" />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-background/80 via-background/20 to-transparent" />

        <div className="mx-auto flex w-full max-w-6xl items-end gap-8 px-4 pb-12 pt-32 sm:px-6">
          {movie.posterPath && (
            <div className="relative hidden aspect-2/3 w-56 shrink-0 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10 md:block">
              <Image
                src={movie.posterPath}
                alt={`${movie.title} poster`}
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
          )}
          <div className="max-w-3xl">
            <p className="text-sm text-zinc-300">{facts.join(" · ")}</p>
            <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
              {movie.title}
            </h1>
            {movie.tagline && <p className="mt-4 text-lg italic text-zinc-300">{movie.tagline}</p>}
            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-2xl font-semibold">★ {movie.voteAverage.toFixed(1)}</span>
              <span className="text-sm text-zinc-400">
                TMDB · {formatVoteCount(movie.voteCount)} votes
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-4 sm:px-6 lg:grid-cols-2">
        <div>
          {movie.overview && <p className="text-lg leading-relaxed text-zinc-300">{movie.overview}</p>}
          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {movie.directors.length > 0 && (
              <>
                <dt className="text-zinc-500">Directed by</dt>
                <dd>{movie.directors.map((director) => director.name).join(", ")}</dd>
              </>
            )}
            {movie.originalTitle !== movie.title && (
              <>
                <dt className="text-zinc-500">Original title</dt>
                <dd>{movie.originalTitle}</dd>
              </>
            )}
          </dl>
        </div>
        {movie.trailerYoutubeKey && (
          <TrailerPlayer
            youtubeKey={movie.trailerYoutubeKey}
            title={movie.title}
            imagePath={movie.backdropPath}
          />
        )}
      </section>
    </article>
  );
}
