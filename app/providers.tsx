"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

/**
 * Silence the noisy unhandled rejections from WalletConnect's WebSocket layer.
 * "Connection interrupted while trying to subscribe" is transient (happens when
 * the WC relay drops/reconnects) and does not affect wallet connectivity. In dev
 * Next.js shows it as a full-screen overlay; in prod it's a console warning at
 * worst. We swallow only this specific message — anything else still surfaces.
 */
function useSuppressWalletConnectNoise() {
  useEffect(() => {
    const noise = [
      /Connection interrupted while trying to subscribe/i,
      /Connection failed or socket disconnected/i,
      /pingTimeoutMs/i,
    ];

    const handler = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message ?? event.reason ?? "");
      if (noise.some((re) => re.test(msg))) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
}

export function Providers({ children }: { children: ReactNode }) {
  useSuppressWalletConnectNoise();
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#ECEEF2",          // white-ish, matches our primary CTA
            accentColorForeground: "#0a0b0f", // dark text on white
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
