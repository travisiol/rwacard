import { media } from "@/lib/media";
import { site } from "@/lib/site";
import { XIcon } from "@/components/XIcon";

const links = [
  { href: "#features", label: "Features" },
  { href: "#cards", label: "Cards" },
  { href: "#collateral", label: "Collateral" },
];

/**
 * Both panels carry their own bar: on the canvas each one is positioned
 * against its own panel, and below 1200px only the hero's stays (fixed),
 * while the feature panel's is hidden by CSS.
 *
 * `menuId` wires the burger to its own menu — the ids have to differ because
 * both bars exist in the document at once.
 */
export function Topbar({
  menuId,
  navLabel,
}: {
  menuId: string;
  navLabel: string;
}) {
  return (
    <header className="topbar">
      <a className="logo" href="#top" aria-label="Home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.logo} width={47} height={46} alt="" />
      </a>
      <div className="navmenu" id={menuId}>
        <nav className="navlinks" aria-label={navLabel}>
          {links.map((link) => (
            <a className="pill" href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a
          className="xlink"
          href={site.x.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`${site.name} on X`}
        >
          <XIcon />
        </a>
        <a className="btn-white" href={site.cta}>
          Get a Card
        </a>
      </div>
      <button
        className="navburger"
        type="button"
        aria-label="Open menu"
        aria-expanded="false"
        aria-controls={menuId}
      >
        <span className="navburger__bars" aria-hidden="true" />
      </button>
    </header>
  );
}
