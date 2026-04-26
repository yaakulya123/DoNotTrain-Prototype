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

const sepoliaTransport = fallback(
  isBrowser
    ? [
        http("/api/rpc"),
        http("https://ethereum-sepolia-rpc.publicnode.com"),
        http("https://sepolia.gateway.tenderly.co"),
      ]
    : [
        http("https://ethereum-sepolia-rpc.publicnode.com"),
        http("https://sepolia.gateway.tenderly.co"),
      ]
);

export const wagmiConfig = getDefaultConfig({
  appName: "DoNotTrain",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "REPLACE_ME",
  chains: [sepolia],
  transports: { [sepolia.id]: sepoliaTransport },
  ssr: true,
});
