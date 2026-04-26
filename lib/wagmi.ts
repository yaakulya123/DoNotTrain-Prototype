import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { fallback, http } from "viem";
import { sepolia } from "wagmi/chains";

export const SEPOLIA_CHAIN_ID = sepolia.id;

// Reliable Sepolia transports. The chain's built-in default
// (rpc.sepolia.org) frequently times out in the browser, which silently
// breaks read queries — including the prior-notice findSimilar scan,
// causing the Register button to render for already-protected works.
// fallback() rotates through these in order on failure.
const sepoliaTransport = fallback([
  http("https://ethereum-sepolia-rpc.publicnode.com"),
  http("https://sepolia.gateway.tenderly.co"),
  http("https://rpc.sepolia.org"),
]);

export const wagmiConfig = getDefaultConfig({
  appName: "DoNotTrain",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "REPLACE_ME",
  chains: [sepolia],
  transports: { [sepolia.id]: sepoliaTransport },
  ssr: true,
});
