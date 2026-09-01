"use client";

import { ConnectGate } from "@/components/ConnectGate";
import { useWallet } from "@/components/WalletProvider";
import { chain, shortAddress } from "@/lib/chain";
import { GRACE_DAYS, MAX_LINE_USD, MIN_LINE_USD, OPEN_FEE_USD, usd } from "@/lib/collateral";
import { site } from "@/lib/site";

export default function GetCardPage() {
  const { address, wallet, chainId, busy, error, switchNetwork } = useWallet();

  if (!address) return <ConnectGate title="Connect your wallet to get a card" />;

  const onRightChain = chainId === chain.id;

  return (
    <>
      <h1 className="page-title">Get a card</h1>
      <p className="page-lede">
        Two ways to hold a card. Both are virtual, both are issued against your wallet with no KYC,
        and both are funded with ETH, {site.settlement} or tokenized real-world assets on the{" "}
        {chain.name}.
      </p>

      <div className="tile" style={{ marginTop: 28 }}>
        <h3>Wallet</h3>
        <div className="kv-grid">
          <div className="kv">
            <span>Account</span>
            <strong>{shortAddress(address)}</strong>
          </div>
          <div className="kv">
            <span>Connected with</span>
            <strong>{wallet?.info.name ?? "Browser wallet"}</strong>
          </div>
          <div className="kv">
            <span>Network</span>
            <strong className={onRightChain ? "status ok" : "status warn"}>
              {onRightChain ? chain.name : chainId ? `Chain ${chainId}` : "Unknown"}
            </strong>
          </div>
        </div>

        {!onRightChain && (
          <div className="actions" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="button button--ghost small"
              disabled={busy}
              onClick={() => switchNetwork()}
            >
              Switch to {chain.name}
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}
      </div>

      <div className="tile">
        <h3>Open a card</h3>
        <p className="muted">
          <strong>Balance card</strong> — load it, spend it, top it up whenever you like. You can
          only spend what is on it. No bill, no repayment, nothing owed.
        </p>
        <p className="muted" style={{ marginTop: 10 }}>
          <strong>Collateral card</strong> — a credit line you secure yourself. {usd(OPEN_FEE_USD)}{" "}
          to open, lines from {usd(MIN_LINE_USD)} to {usd(MAX_LINE_USD)}, no interest and no due
          date. A bill unpaid for {GRACE_DAYS} days closes the card and is taken from the
          collateral.
        </p>

        <div className="actions" style={{ marginTop: 18 }}>
          <button type="button" className="button button--primary" disabled>
            Continue
          </button>
        </div>
        {/* Deliberately dead: issuing a card is a call to the card service,
            and this site does not carry one. Nothing here pretends otherwise. */}
        <p className="muted small" style={{ marginTop: 12 }}>
          Card issuing is not connected yet, so this button does nothing. Your wallet is connected
          and no signature, approval or transaction has been requested.
        </p>
      </div>
    </>
  );
}
