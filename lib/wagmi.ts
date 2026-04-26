import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { fallback, http } from "viem";
import { sepolia } from "wagmi/chains";

export const SEPOLIA_CHAIN_ID = sepolia.id;

// Sepolia transport. Browser hits are routed through our /api/rpc proxy on
// the same origin; this bypasses both CORS edge cases and network-level
// blocks of public Web3 RPC hostnames (campus / corporate / hotel networks
// often filter these). The proxy itself rotates through several upstream
// endpoints. We additionally keep a direct fallback chain for SSR (where
// relative URLs aren't valid) and as a last-resort if /api/rpc itself is
// down.
const isBrowser = typeof window !== "undefined";

// batch: false disables viem's Multicall3 batching. With batching enabled,
// every useReadContract is folded into a single aggregate3 call — and a
// single broken sub-call (or upstream RPC quirk in the multicall response)
// fails the entire batch, which is exactly what was tripping the
// prior-notice scan in production.
const httpOpts = { batch: false } as const;

const sepoliaTransport = fallback(
  isBrowser
    ? [
        http("/api/rpc", httpOpts),
        http("https://ethereum-sepolia-rpc.publicnode.com", httpOpts),
        http("https://sepolia.gateway.tenderly.co", httpOpts),
      ]
    : [
        http("https://ethereum-sepolia-rpc.publicnode.com", httpOpts),
        http("https://sepolia.gateway.tenderly.co", httpOpts),
      ]
);

export const wagmiConfig = getDefaultConfig({
  appName: "DoNotTrain",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "REPLACE_ME",
  chains: [sepolia],
  transports: { [sepolia.id]: sepoliaTransport },
  // Disable client-level batching too — same issue, just at a higher layer
  batch: { multicall: false },
  ssr: true,
});
