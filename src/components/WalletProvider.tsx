"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type DiscoveredWallet,
  discoverWallets,
  forgetWallet,
  readAccounts,
  readChainId,
  rememberWallet,
  rememberedWallet,
  requestAccount,
  switchToChain,
  walletErrorMessage,
} from "@/lib/wallet";

type WalletState = {
  wallets: DiscoveredWallet[];
  wallet: DiscoveredWallet | null;
  address: string | null;
  chainId: number | null;
  /** Discovery has had its say — before this, an empty list means nothing. */
  ready: boolean;
  busy: boolean;
  error: string | null;
  connect: (wallet: DiscoveredWallet) => Promise<void>;
  switchNetwork: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
};

const WalletContext = createContext<WalletState | null>(null);

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside <WalletProvider>");
  return value;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [wallet, setWallet] = useState<DiscoveredWallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    const stop = discoverWallets(setWallets);
    // Same 400ms the legacy fallback waits: after it, "no wallets" is real.
    const settle = window.setTimeout(() => setReady(true), 450);
    return () => {
      stop();
      window.clearTimeout(settle);
    };
  }, []);

  // Silent reconnect. Only for a wallet this browser used before, and only if
  // it still reports an account — no prompt is raised on a first visit.
  useEffect(() => {
    if (restored.current || wallets.length === 0) return;
    const rdns = rememberedWallet();
    const known = wallets.find((candidate) => candidate.info.rdns === rdns);
    if (!known) return;
    restored.current = true;
    readAccounts(known).then(async (accounts) => {
      if (!accounts[0]) return;
      setWallet(known);
      setAddress(accounts[0]);
      setChainId(await readChainId(known).catch(() => null));
    });
  }, [wallets]);

  // The account and the network can both change from inside the wallet.
  useEffect(() => {
    if (!wallet) return;
    const provider = wallet.provider;

    const onAccountsChanged = (...args: never[]) => {
      const accounts = args[0] as unknown as string[] | undefined;
      setAddress(accounts?.[0] ?? null);
    };
    const onChainChanged = (...args: never[]) => {
      const hex = args[0] as unknown as string;
      setChainId(Number.parseInt(hex, 16));
    };

    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [wallet]);

  const connect = useCallback(async (candidate: DiscoveredWallet) => {
    setBusy(true);
    setError(null);
    try {
      const account = await requestAccount(candidate);
      setWallet(candidate);
      setAddress(account);
      setChainId(await readChainId(candidate).catch(() => null));
      rememberWallet(candidate.info.rdns);
    } catch (cause) {
      setError(walletErrorMessage(cause));
      throw cause;
    } finally {
      setBusy(false);
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!wallet) return;
    setBusy(true);
    setError(null);
    try {
      await switchToChain(wallet);
      setChainId(await readChainId(wallet).catch(() => null));
    } catch (cause) {
      setError(walletErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }, [wallet]);

  // A dapp cannot revoke its own access; this forgets the wallet on our side
  // and the button says as much.
  const disconnect = useCallback(() => {
    forgetWallet();
    restored.current = true;
    setWallet(null);
    setAddress(null);
    setChainId(null);
    setError(null);
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      wallets,
      wallet,
      address,
      chainId,
      ready,
      busy,
      error,
      connect,
      switchNetwork,
      disconnect,
      clearError: () => setError(null),
    }),
    [wallets, wallet, address, chainId, ready, busy, error, connect, switchNetwork, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
