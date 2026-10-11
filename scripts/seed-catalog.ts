import "./load-env";
import { parseArgs } from "node:util";
import {
  listMovieIdsMissingMetadata,
  removeMovies,
  storeMovieDetails,
  upsertMovieSummaries,
} from "@/features/movies/sync";
import { discoverMovies, getMovieDetails, TmdbError } from "@/lib/tmdb/client";
import type { MovieDetails } from "@/lib/tmdb/schemas";

// Seeds the catalog in two resumable steps:
// 1. discover: list every film above the vote threshold, one release year at a time,
//    because TMDB caps a single discover query at 500 pages.
// 2. details: fetch runtime, genres, directors and trailer for every movie that lacks them.
// Safe to re-run: step 1 refreshes list fields, step 2 only fetches what is missing.
//
//   pnpm catalog:seed                                  full seed
//   pnpm catalog:seed --from-year 2010 --to-year 2010  small test run
//   pnpm catalog:seed --skip-discover                  only fill in missing details

const DETAILS_CHUNK_SIZE = 20;

const { values: options } = parseArgs({
  options: {
    "min-votes": { type: "string", default: "200" },
    "from-year": { type: "string", default: "1890" },
    "to-year": { type: "string", default: String(new Date().getUTCFullYear()) },
    "skip-discover": { type: "boolean", default: false },
  },
});

async function discover(minVotes: number, fromYear: number, toYear: number) {
  let total = 0;
  for (let year = fromYear; year <= toYear; year++) {
    const query = {
      primary_release_year: year,
      "vote_count.gte": minVotes,
      sort_by: "vote_count.desc",
    };
    const firstPage = await discoverMovies({ ...query, page: 1 });
    const otherPages = await Promise.all(
      range(2, Math.min(firstPage.total_pages, 500)).map((page) => discoverMovies({ ...query, page })),
    );
    const found = [firstPage, ...otherPages].flatMap((response) => response.results);

    await upsertMovieSummaries(found);
    total += found.length;
    if (found.length > 0) console.log(`${year}: ${found.length} movies`);
  }
  console.log(`Discovered ${total} movies with at least ${minVotes} votes.`);
}

async function fetchMissingDetails() {
  const ids = await listMovieIdsMissingMetadata();
  console.log(`Fetching details for ${ids.length} movies.`);

  let stored = 0;
  let removed = 0;
  let failed = 0;
  for (let start = 0; start < ids.length; start += DETAILS_CHUNK_SIZE) {
    const chunk = ids.slice(start, start + DETAILS_CHUNK_SIZE);
    const results = await Promise.allSettled(chunk.map((id) => getMovieDetails(id)));

    const fetched: MovieDetails[] = [];
    const gone: number[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        fetched.push(result.value);
      } else if (result.reason instanceof TmdbError && result.reason.status === 404) {
        gone.push(chunk[index]);
      } else {
        failed++;
        console.warn(`Movie ${chunk[index]} failed, will retry on the next run:`, result.reason);
      }
    });

    await storeMovieDetails(fetched);
    await removeMovies(gone);
    stored += fetched.length;
    removed += gone.length;

    const processed = start + chunk.length;
    if (processed % 500 < DETAILS_CHUNK_SIZE || processed === ids.length) {
      console.log(`${processed}/${ids.length} processed`);
    }
  }
  console.log(`Stored ${stored}, removed ${removed} gone from TMDB, ${failed} failed.`);
}

function range(from: number, to: number) {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
}

async function main() {
  if (!options["skip-discover"]) {
    await discover(
      Number(options["min-votes"]),
      Number(options["from-year"]),
      Number(options["to-year"]),
    );
  }
  await fetchMissingDetails();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
