const MAX_POSTGRES_INTEGER = 2_147_483_647;

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });

export function releaseYear(releaseDate: string | null) {
  return releaseDate?.slice(0, 4) ?? null;
}

export function formatRuntime(minutes: number | null) {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function formatVoteCount(count: number) {
  return compactNumber.format(count);
}

/** URL segment for a movie, e.g. "27205-inception". Only the leading id matters when parsing. */
export function movieSlug(movie: { id: number; title: string }) {
  const words = movie.title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return words ? `${movie.id}-${words}` : String(movie.id);
}

export function movieHref(movie: { id: number; title: string }) {
  return `/movie/${movieSlug(movie)}`;
}

export function parseMovieId(slug: string) {
  const match = /^(\d+)(?:-|$)/.exec(slug);
  if (!match) return null;
  const id = Number(match[1]);
  return id > 0 && id <= MAX_POSTGRES_INTEGER ? id : null;
}
