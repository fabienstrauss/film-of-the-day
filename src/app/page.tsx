import { MovieCard } from "@/components/movies/movie-card";
import { listTopRatedMovies } from "@/features/movies/queries";

export default async function Home() {
  const movies = await listTopRatedMovies(12);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pt-36">
      <h1 className="font-display text-5xl leading-none tracking-tight sm:text-7xl">
        One great movie.
        <br />
        Every day.
      </h1>
      <p className="mt-5 max-w-md text-zinc-400">
        The daily pick lands here soon. Until then, some of the highest rated films to start with.
      </p>

      <section className="mt-16">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Highest rated
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
          {movies.map((movie) => (
            <li key={movie.id}>
              <MovieCard movie={movie} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
