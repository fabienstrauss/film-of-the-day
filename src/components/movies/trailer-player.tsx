"use client";

import Image from "next/image";
import { useLayoutEffect, useState } from "react";

type TrailerPlayerProps = {
  youtubeKey: string;
  title: string;
  imagePath: string | null;
};

// Click-to-load: nothing is requested from YouTube until the visitor asks for the trailer.
export function TrailerPlayer({ youtubeKey, title, imagePath }: TrailerPlayerProps) {
  const [playing, setPlaying] = useState(false);

  // Next.js keeps pages you navigate away from mounted but hidden, so stop the video
  // when that happens instead of letting it play on in the background.
  useLayoutEffect(() => () => setPlaying(false), []);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1`}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="aspect-video w-full rounded-lg"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10"
    >
      {imagePath && (
        <Image
          src={imagePath}
          alt=""
          fill
          sizes="(min-width: 1024px) 600px, 100vw"
          className="object-cover opacity-50 transition duration-500 group-hover:scale-105 group-hover:opacity-70"
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center gap-2.5 rounded-full bg-white/15 px-5 py-3 text-sm font-medium backdrop-blur-md transition group-hover:bg-white/25">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
          </svg>
          Play trailer
        </span>
      </span>
    </button>
  );
}
