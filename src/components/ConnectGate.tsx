"use client";

import { site } from "@/lib/site";
import { useWallet } from "@/components/WalletProvider";

export function ConnectGate({ title }: { title?: string }) {
  const { wallets, connect, busy, error, ready } = useWallet();

  return (
    <div className="connect">
      <h1 className="page-title">{title ?? "Connect your wallet"}</h1>
      <p className="page-lede">
        Connecting is a read-only request. It does not move funds and it is not a transaction. No
        email, no documents, no KYC.
      </p>

      <div className="connect__list">
        {!ready && <p className="muted">Looking for wallets…</p>}
        {ready && wallets.length === 0 && (
          <p className="muted">
            No wallet detected. Install MetaMask, Rabby, Trust or another browser wallet and reload
            this page.
          </p>
        )}
        {wallets.map((wallet) => (
          <button
            key={wallet.info.rdns || wallet.info.uuid}
            type="button"
            className="connect__wallet"
            disabled={busy}
            onClick={() => {
              // The provider already told the person what went wrong; the
              // rejection is surfaced through `error`, not thrown at the page.
              connect(wallet).catch(() => {});
            }}
          >
            {wallet.info.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wallet.info.icon} alt="" width={26} height={26} />
            ) : null}
            {wallet.info.name}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <p className="muted small" style={{ marginTop: 18 }}>
        {site.name} never asks for a seed phrase or a private key, and nothing on this page can move
        funds.
      </p>
    </div>
  );
}
