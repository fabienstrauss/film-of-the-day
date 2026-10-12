import Image from "next/image";
import Link from "next/link";
import { movieHref, releaseYear } from "@/features/movies/format";
import type { MovieCardData } from "@/features/movies/queries";

export function MovieCard({ movie }: { movie: MovieCardData }) {
  const details = [releaseYear(movie.releaseDate), `★ ${movie.voteAverage.toFixed(1)}`];

  return (
    <Link href={movieHref(movie)} className="group block">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10">
        {movie.posterPath && (
          <Image
            src={movie.posterPath}
            alt=""
            fill
            sizes="(min-width: 1024px) 180px, (min-width: 640px) 25vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <h3 className="mt-3 text-sm font-medium leading-snug text-zinc-200 group-hover:text-white">
        {movie.title}
      </h3>
      <p className="mt-0.5 text-xs text-zinc-500">{details.filter(Boolean).join(" · ")}</p>
    </Link>
  );
}
