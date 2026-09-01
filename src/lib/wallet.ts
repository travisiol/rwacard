import { chain, chainIdHex } from "@/lib/chain";

/**
 * Browser-wallet plumbing: EIP-6963 discovery over EIP-1193 providers. No
 * library — the four calls this page makes are `eth_accounts`,
 * `eth_requestAccounts`, `eth_chainId` and `wallet_switchEthereumChain`.
 */

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: never[]) => void) => void;
  removeListener?: (event: string, handler: (...args: never[]) => void) => void;
};

export type WalletInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

export type DiscoveredWallet = {
  info: WalletInfo;
  provider: Eip1193Provider;
};

type AnnounceEvent = CustomEvent<DiscoveredWallet>;

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": AnnounceEvent;
  }
  interface Window {
    ethereum?: Eip1193Provider & {
      isMetaMask?: boolean;
      isTrust?: boolean;
      isCoinbaseWallet?: boolean;
    };
  }
}

const STORAGE_KEY = "rwacard_wallet_rdns";

/**
 * Announcements arrive whenever a wallet feels like it, so this reports the
 * growing set through `onChange` rather than resolving once. Returns a cleanup.
 */
export function discoverWallets(onChange: (wallets: DiscoveredWallet[]) => void) {
  const found = new Map<string, DiscoveredWallet>();
  const publish = () => onChange(Array.from(found.values()));

  const onAnnounce = (event: AnnounceEvent) => {
    const detail = event.detail;
    if (!detail?.info?.uuid || !detail.provider) return;
    found.set(detail.info.rdns || detail.info.uuid, detail);
    publish();
  };

  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  // Older wallets never answer the announcement. If nothing has spoken up by
  // then, fall back to whatever injected itself as window.ethereum.
  const timer = window.setTimeout(() => {
    if (found.size > 0 || !window.ethereum) return;
    const injected = window.ethereum;
    const name = injected.isMetaMask
      ? "MetaMask"
      : injected.isTrust
        ? "Trust Wallet"
        : injected.isCoinbaseWallet
          ? "Coinbase Wallet"
          : "Browser wallet";
    found.set("legacy", {
      info: { uuid: "legacy", name, icon: "", rdns: "legacy" },
      provider: injected,
    });
    publish();
  }, 400);

  return () => {
    window.removeEventListener("eip6963:announceProvider", onAnnounce);
    window.clearTimeout(timer);
  };
}

/** Accounts already granted — never prompts. */
export async function readAccounts(wallet: DiscoveredWallet) {
  try {
    return ((await wallet.provider.request({ method: "eth_accounts" })) ?? []) as string[];
  } catch {
    return [];
  }
}

/** Prompts. Throws if the person closes the wallet without picking one. */
export async function requestAccount(wallet: DiscoveredWallet) {
  const accounts = (await wallet.provider.request({
    method: "eth_requestAccounts",
  })) as string[] | undefined;
  if (!accounts?.length) throw new Error("No account selected");
  return accounts[0];
}

export async function readChainId(wallet: DiscoveredWallet) {
  const hex = (await wallet.provider.request({ method: "eth_chainId" })) as string;
  return Number.parseInt(hex, 16);
}

/** Switches to Robinhood Chain, adding it first if the wallet has never seen it. */
export async function switchToChain(wallet: DiscoveredWallet) {
  try {
    await wallet.provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    // 4902: unknown chain. -32603: some wallets wrap the same thing.
    if (code !== 4902 && code !== -32603) throw error;
    await wallet.provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: chain.name,
          nativeCurrency: {
            name: "Ether",
            symbol: chain.nativeSymbol,
            decimals: chain.nativeDecimals,
          },
          rpcUrls: [chain.rpcUrl],
          blockExplorerUrls: chain.explorerUrl ? [chain.explorerUrl] : [],
        },
      ],
    });
  }
}

export function rememberWallet(rdns: string) {
  try {
    localStorage.setItem(STORAGE_KEY, rdns);
  } catch {
    // Private windows and blocked storage: reconnecting stays manual.
  }
}

export function forgetWallet() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // As above.
  }
}

export function rememberedWallet() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Wallet errors are inconsistent; this is the part worth showing a person. */
export function walletErrorMessage(error: unknown) {
  const code = (error as { code?: number | string }).code;
  if (code === 4001 || code === "ACTION_REJECTED") {
    return "You cancelled the request in your wallet";
  }
  if (code === -32002) {
    return "Your wallet already has a request open. Finish it there, then try again.";
  }
  const message = (error as { message?: string }).message;
  return message ?? "Something went wrong with your wallet";
}
