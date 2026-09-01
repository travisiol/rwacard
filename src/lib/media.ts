/**
 * Art paths.
 *
 * The two clips are ~35 MB together, which is more than a Next server should
 * be handing out on every hero view. Point NEXT_PUBLIC_MEDIA_BASE at a CDN
 * (bucket laid out with the same `/media/...` keys) and they are served from
 * there instead; unset, they come from `public/`.
 *
 * `staking-grain.png` is referenced from globals.css and so always local.
 */

const base = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").replace(/\/+$/, "");

const asset = (path: string) => `${base}${path}`;

export const media = {
  logo: "/logo.png",
  arrow: asset("/media/arrow.svg"),
  key: asset("/media/key.svg"),
  bolt: asset("/media/bolt.svg"),
  heroVideo: asset("/media/hero-showcase.mp4"),
  heroPoster: asset("/media/hero-showcase-poster.png"),
  cardFront: asset("/media/card-front.png"),
  cardOrbit: asset("/media/card-orbit.png"),
  globeVideo: asset("/media/globe.mp4"),
  globePoster: asset("/media/globe-poster.png"),
} as const;
