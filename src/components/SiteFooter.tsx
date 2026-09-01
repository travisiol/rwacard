import { GRACE_DAYS } from "@/lib/collateral";
import { site } from "@/lib/site";
import { XIcon } from "@/components/XIcon";

export function SiteFooter() {
  return (
    <footer className="sitefoot">
      <div className="sitefoot__brand">
        <p>
          <strong>{site.name}</strong> · cards on {site.chain}, settled in {site.settlement}
        </p>
        <a
          className="sitefoot__x"
          href={site.x.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`${site.name} on X`}
        >
          <XIcon size={16} />
          <span>{site.x.handle}</span>
        </a>
      </div>
      {/* Product disclosure. Read it against the terms in lib/collateral.ts
          before changing either — they are meant to say the same thing. */}
      <p className="sitefoot__note">
        {site.name} is not a bank and card balances are not bank deposits. Cards are virtual and
        issued by our card partner. A collateral card is a secured line of credit: your deposit is
        locked while a bill is outstanding and returned in {site.settlement} once it is settled. A
        bill left unpaid for {GRACE_DAYS} days closes the card, the outstanding balance is taken
        from the collateral, and the remainder is returned.
      </p>
    </footer>
  );
}
