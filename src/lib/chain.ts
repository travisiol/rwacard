/**
 * Robinhood Chain, the network the cards settle on.
 *
 * These values match what rwaspend.site ships and what the public RPC answers
 * (`eth_chainId` → 0x1237 = 4663). Confirm against Robinhood's own docs before
 * this page starts asking anyone to add the network to their wallet.
 */
export const chain = {
  id: 4663,
  name: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  explorerUrl: "https://robinhoodchain.blockscout.com",
  nativeSymbol: "ETH",
  nativeDecimals: 18,
} as const;

export const chainIdHex = `0x${chain.id.toString(16)}`;

export function shortAddress(address: string) {
  return address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}
