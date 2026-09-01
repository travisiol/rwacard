import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The hero and globe clips are static files served straight from public/
  // (or from NEXT_PUBLIC_MEDIA_BASE). Nothing here needs image optimisation:
  // every raster on the page is drawn at a fixed size on the design canvas.
};

export default nextConfig;
