"use client";

import Link from "next/link";
import { media } from "@/lib/media";
import { shortAddress } from "@/lib/chain";
import { site } from "@/lib/site";
import { XIcon } from "@/components/XIcon";
import { useWallet } from "@/components/WalletProvider";

/**
 * Bar and column for the app pages. The landing's own top bar does not follow
 * you here — this one is sticky and carries the connected account instead.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { address, disconnect } = useWallet();

  return (
    <div className="app">
      <header className="appbar">
        <Link className="appbar__logo" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.logo} width={30} height={30} alt="" />
          <span className="appbar__name">{site.name}</span>
        </Link>
        <nav className="appbar__links">
          <Link className="appbar__link is-active" href="/get-card">
            Get a card
          </Link>
          <a
            className="appbar__x"
            href={site.x.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${site.name} on X`}
          >
            <XIcon size={16} />
          </a>
        </nav>
        {address && (
          <div className="appbar__account">
            <span>{shortAddress(address)}</span>
            <button type="button" className="appbar__signout" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        )}
      </header>
      <main className="appmain">{children}</main>
    </div>
  );
}
