import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { addressUrl, CONTRACT_ADDRESS } from "@/lib/contract";

export const metadata: Metadata = {
  title: "DoNotTrain · On-chain registry for AI training opt-out",
  description:
    "Court-admissible, on-chain proof of prior notice. Register a hash of your work in seconds. Free, global, uncensorable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteHeader />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-border/60 mt-12 py-10">
            <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-text-tertiary">
              <div>DoNotTrain · On-chain opt-out registry</div>
              <div className="flex items-center gap-5">
                <a
                  href={addressUrl(CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text-primary transition"
                >
                  Etherscan
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text-primary transition"
                >
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
