/**
 * Everything the brand owns, in one object.
 *
 * Renaming the site is this file plus `public/logo.png` — no component
 * hardcodes the name, the handle or the domain.
 */

const xUrl = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/RWACard";

export const site = {
  /** Wordmark. Rendered as-is: uppercase in the footer, in <title>, in alt text. */
  name: "RWACARD",
  /** Settlement chain, named in the nav copy, the cards panel and the footer. */
  chain: "Robinhood Chain",
  /** Stablecoin every authorisation clears in. */
  settlement: "USDG",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rwacard.site",
  x: {
    url: xUrl,
    // Derived so the handle can never drift from the link it points at.
    handle: `@${xUrl.replace(/\/+$/, "").split("/").pop() ?? "RWACard"}`,
  },
  /**
   * Where every "Get a Card" goes. The card app itself is not part of this
   * repo, so point this at wherever it lives; left as-is it expects a
   * `/get-card` route to be added here.
   */
  cta: process.env.NEXT_PUBLIC_CTA_HREF ?? "/get-card",
  tagline: "No-KYC cards on Robinhood Chain, funded by RWAs and ETH",
  description:
    "Spend real-world assets and ETH from a card on Robinhood Chain. No KYC. Settled in USDG. Choose a balance card you top up, or a collateral card that works like credit you back yourself.",
} as const;
