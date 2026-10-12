"use client";

import type { ImageLoaderProps } from "next/image";

// TMDB's image CDN already serves every image in several widths, so next/image picks the
// closest one instead of resizing it again (and using up the Vercel image optimization quota).
// Capped at w1280: "original" files can be several MB, and no image here needs more.
const TMDB_WIDTHS = [92, 154, 185, 342, 500, 780, 1280];

export default function tmdbImageLoader({ src, width }: ImageLoaderProps) {
  const tmdbWidth = TMDB_WIDTHS.find((candidate) => candidate >= width) ?? 1280;
  return `https://image.tmdb.org/t/p/w${tmdbWidth}${src}`;
}
