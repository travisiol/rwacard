# RWACARD

Landing page for RWACARD — cards on the Robinhood Chain, no KYC, funded by
real-world assets and ETH, settled in USDG.

This is a rebrand of the rwaspend.site landing: same layout, same geometry,
same motion, name changed throughout. The art (card renders, hero clip, globe
clip, bolt mark) is carried over from that site and now lives in `public/`.

## Running it

```bash
npm install
npm run dev
```

`.claude/launch.json` starts it on port 3010.

## How the page is built

**The desktop layout is a fixed design canvas.** Panels one and two are
authored at 1685 x 1073 and scaled to the viewport:
`src/components/StageChoreography.tsx` measures the window and sets `--scale`,
`--layout-width` and `--layout-height` on `#stage`; `globals.css` positions
everything inside in whole design pixels. Those pixel values *are* the design
— they are not arbitrary numbers waiting to be replaced with flexbox.

Below 1200px the canvas is dropped entirely and the same markup re-flows as
ordinary blocks (see the media queries in the second half of `globals.css`).
Between 600px and 1199px the feature cards keep their authored art and are
scaled into their column, with the empty space above each surface cropped via
`--crop-top` / `--card-scale`.

**The hero → features move is scripted, not scrolled.** On the canvas a wheel
tick does not scroll: it is swallowed and plays a 3.4s sequence (1.6s coming
back) that throws the hero out, snaps the document to the second panel at the
800ms mark, and reveals the feature panel's parts on a stagger. Every step is
a CSS custom property written frame by frame — the schedule is the
`FEATURE_REVEALS` table in `StageChoreography.tsx`. Off the canvas, and under
`prefers-reduced-motion`, none of it runs and the page is a normal scroll.

**Everything else is static markup.** Only the collateral sandbox is a React
client component; the two panels are server-rendered and the few interactive
bits inside them (nav pills, burger menus, showcase dots) are wired by the
same effect that owns the motion.

## Where the brand lives

`src/lib/site.ts` — name, chain, settlement token, X account, CTA target.
Plus `public/logo.png` and the app icons in `src/app/`. Nothing else hardcodes
the name; the footer handle is derived from the X URL so the two cannot drift.

Env overrides are listed in `.env.example`. `NEXT_PUBLIC_MEDIA_BASE` moves the
two clips (~35 MB together) to a CDN — worth doing before this takes traffic,
since they are currently served by the app itself and are committed to the
repo.

## Not in this repo

`/get-card` and `/dashboard` — the wallet-gated card app — were out of scope
for the rebrand, so every "Get a Card" points at a `/get-card` route that does
not exist here yet. Set `NEXT_PUBLIC_CTA_HREF` to send them at the app
wherever it lives, or port those routes in.

## Before this goes near a real domain

- **The X handle is a guess.** `https://x.com/RWACard` follows from the name;
  nobody has checked that the account exists or is yours. Same for the
  `rwacard.site` domain in `NEXT_PUBLIC_SITE_URL`, and for the trademark.
- **The card renders carry a Visa mark** and the footer says cards are "issued
  by our card partner". That pairing is a claim about a real relationship.
- **The no-KYC and custody claims** in the hero, the first feature card and
  the footer are product claims, not marketing colour. They should survive a
  compliance read as written.
- **The collateral terms** — $15 to open, $50–$1,000 lines, no interest, 30
  days to closure — live in `src/lib/collateral.ts` and are repeated in the
  lede, the sandbox and the footer disclosure. Change them in one place.

The sandbox itself is honest about what it is: it says on the card that
nothing there touches the chain.
