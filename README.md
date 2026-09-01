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

## /get-card

"Get a Card" leads to `/get-card`, a wallet gate on the app shell (sticky bar,
centred column — no design canvas).

It discovers wallets through **EIP-6963** and talks to them over EIP-1193
directly; there is no wallet library in the dependency list, because the page
makes four calls: `eth_accounts`, `eth_requestAccounts`, `eth_chainId` and
`wallet_switchEthereumChain`. Wallets that never answer the EIP-6963
announcement are picked up 400ms later from `window.ethereum`. The chosen
wallet's rdns is remembered so a return visit reconnects silently — reading
existing permission only, never prompting on a first visit.

Once connected it shows the account, the wallet, and the network, with a
**Switch to Robinhood Chain** button when the wallet is somewhere else
(`wallet_addEthereumChain` if it has never seen the network).

Two things the live site does that this page deliberately does not:

- **No sign-in signature.** rwaspend.site signs a server nonce and gets a
  session back. A signature with no server to verify it proves nothing, so the
  page connects and says so instead of performing security theatre.
- **No card issuing.** "Continue" is disabled and labelled with why. Wiring it
  up means a card service, an issuing partner and a payment flow — none of
  which exist here.

The flow was verified against a stubbed EIP-1193 provider — discovery,
connect, wrong-network warning, switch, disconnect, and rejection (code 4001 →
"You cancelled the request in your wallet") — never against a real extension.

## Where the brand lives

`src/lib/site.ts` — name, chain, settlement token, X account, CTA target.
Plus `public/logo.png` and the app icons in `src/app/`. Nothing else hardcodes
the name; the footer handle is derived from the X URL so the two cannot drift.

The mark is built from flat artwork by `scripts/build-logo.mjs`:

```bash
node scripts/build-logo.mjs path/to/artwork.png
```

Give it any square PNG with the mark in black on white. It crops to the ink,
turns the white away into transparency, and centres the result on the white
rounded tile the site uses, writing `public/logo.png` and both app icons. PNG
decode and encode are in the script, so the repo carries no image dependency.

Env overrides are listed in `.env.example`. `NEXT_PUBLIC_MEDIA_BASE` moves the
two clips (~35 MB together) to a CDN — worth doing before this takes traffic,
since they are currently served by the app itself and are committed to the
repo.

## Not in this repo

`/dashboard` — cards, balances, transactions — and the API behind it: auth
(nonce/verify/session), `/api/bins`, `/api/assets`, `/api/checkout/*`. The CTA
target stays configurable through `NEXT_PUBLIC_CTA_HREF` if the card app lives
somewhere else.

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
