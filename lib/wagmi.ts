import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const SEPOLIA_CHAIN_ID = sepolia.id;

export const wagmiConfig = getDefaultConfig({
  appName: "DoNotTrain",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "REPLACE_ME",
  chains: [sepolia],
  ssr: true,
});
