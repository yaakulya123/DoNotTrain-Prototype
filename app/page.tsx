"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Server,
  Lock,
  Clock,
  Globe,
} from "lucide-react";
import { CONTRACT_ADDRESS, DONOTTRAIN_ABI, addressUrl } from "@/lib/contract";
import { Marquee } from "@/components/ui/Marquee";
import { Workflow } from "@/components/Workflow";
import { Dithering } from "@paper-design/shaders-react";

const HERO_VIDEO =
  "https://videos.pexels.com/video-files/34127877/14471387_1920_1080_30fps.mp4";

export default function LandingPage() {
  const { data: total, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DONOTTRAIN_ABI,
    functionName: "totalRegistrations",
  });

  const counter = isLoading ? "—" : total !== undefined ? total.toString() : "0";
  const shortContract = `${CONTRACT_ADDRESS.slice(0, 6)}…${CONTRACT_ADDRESS.slice(-4)}`;

  return (
    <>
      {/* HERO — full-bleed video background, asymmetric bottom-aligned headline + stats marquee */}
      <section className="relative flex min-h-[88vh] w-full flex-col items-start justify-end overflow-hidden">
        {/* Solid bg sits behind the video so there's no white flash before it loads */}
        <div className="absolute inset-0 bg-bg" />
        <video
          className="absolute inset-0 h-full w-full object-cover scale-[1.02]"
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-bg/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/70 via-transparent to-bg/30" />

        {/* Top: status pill (pushed below the floating nav island) */}
        <div className="relative z-10 w-full px-6 pt-44 sm:px-10 sm:pt-52 lg:px-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-strong bg-bg/60 backdrop-blur text-[11px] tracking-wide text-text-secondary uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live · Ethereum Sepolia
          </div>
        </div>

        {/* Asymmetric bottom hero */}
        <div className="relative z-10 w-full px-6 pb-20 pt-32 sm:px-10 sm:pb-28 lg:px-16 lg:pb-32">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end">
            <div className="w-full lg:w-3/5 space-y-7">
              <h1 className="text-[40px] sm:text-[58px] lg:text-[72px] font-medium leading-[1.04] tracking-tightest text-text-primary">
                An on-chain registry for{" "}
                <span className="serif italic text-text-primary">work that should not</span>{" "}
                be used to train AI.
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-text-primary text-bg text-[14px] font-medium hover:bg-white transition"
                >
                  Register a work
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/lookup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border-strong bg-bg/40 backdrop-blur text-text-primary text-[14px] hover:border-text-secondary hover:bg-surface transition"
                >
                  Look up a hash
                </Link>
                <a
                  href={addressUrl(CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] text-text-secondary hover:text-text-primary transition"
                >
                  View contract
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            <div className="w-full lg:w-2/5 lg:pb-2">
              <p className="serif italic text-[18px] sm:text-[22px] lg:text-[24px] leading-[1.4] text-text-secondary lg:text-right">
                A creator drops a file. The browser fingerprints it. One signature on Ethereum
                produces an unforgeable, court-admissible record of prior notice — without ever
                uploading the work itself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats marquee — full-bleed band sitting BELOW the hero */}
      <StatsMarquee counter={counter} shortContract={shortContract} />

      {/* WORKFLOW — Blog7-style three-card layout */}
      <Workflow />

      <Hairline />

      {/* WHY BLOCKCHAIN — dithered shader on the left, reasons table on the right */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <div className="grid lg:grid-cols-[5fr_7fr] gap-10 items-stretch">
          {/* LEFT — dithered shader panel with kicker overlay */}
          <div className="relative rounded-xl border border-border overflow-hidden min-h-[380px] lg:min-h-[560px]">
            <div className="absolute inset-0">
              <Dithering
                style={{ height: "100%", width: "100%" }}
                colorBack="hsl(232, 25%, 6%)"
                colorFront="hsl(232, 80%, 78%)"
                shape="sphere"
                type="4x4"
                pxSize={2}
                offsetX={0}
                offsetY={0}
                scale={0.85}
                rotation={0}
                speed={0.18}
              />
            </div>
            {/* Bottom gradient so the text is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

            <div className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-bg/50 backdrop-blur text-[10px] mono uppercase tracking-[0.2em] text-text-secondary mb-5 self-start">
                The vault
              </span>
              <h2 className="text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.05] tracking-tight font-medium text-text-primary">
                Why blockchain.
              </h2>
              <p className="mt-4 text-[15px] text-text-secondary leading-relaxed max-w-md">
                A normal database can serve lookups. The blockchain isn't the user interface — it's
                the vault. Four properties only a public chain provides.
              </p>
            </div>
          </div>

          {/* RIGHT — reasons grid (the table you liked) */}
          <div className="grid sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {REASONS.map((r) => (
              <div key={r.title} className="bg-bg p-9 lg:p-10 flex flex-col gap-5">
                <div className="h-12 w-12 rounded-xl border border-border-strong bg-surface/60 flex items-center justify-center">
                  <r.Icon className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-[20px] font-medium text-text-primary tracking-tight">{r.title}</h3>
                  <p className="mt-3 text-[14px] text-text-secondary leading-[1.65]">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Hairline />

      {/* HONEST FRAMING */}
      <section className="max-w-4xl mx-auto px-6 py-28 text-center">
        <p className="text-[11px] mono uppercase tracking-[0.2em] text-text-tertiary">
          Honest scope
        </p>
        <h2 className="mt-4 serif text-[32px] sm:text-[44px] leading-[1.15] text-text-primary">
          A notice board, not a filter.
        </h2>
        <p className="mt-6 text-[15px] text-text-secondary leading-[1.7] max-w-2xl mx-auto">
          We do not detect infringement. We do not block training. But the on-chain record is
          unforgeable — if an AI lab trains on registered work afterward, the timestamp converts an
          "oops" defense into willful infringement, which unlocks higher damages in many
          jurisdictions.
        </p>
      </section>

      <Hairline />

      {/* CONTRACT FOOTER */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-lg border border-border bg-surface p-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] mono uppercase tracking-wider text-success mb-3">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                Live registry contract
              </div>
              <div className="mono text-[12px] sm:text-[13px] break-all text-text-primary">
                {CONTRACT_ADDRESS}
              </div>
              <p className="text-[12px] text-text-tertiary mt-1">Ethereum Sepolia testnet</p>
            </div>
            <a
              href={addressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 self-start sm:self-end inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border-strong text-[13px] text-text-primary hover:bg-surface-2 transition"
            >
              Verify on Etherscan
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Stats marquee ---------- */

function StatsMarquee({ counter, shortContract }: { counter: string; shortContract: string }) {
  const items = [
    { label: "Works registered", value: counter },
    { label: "Network", value: "Ethereum Sepolia" },
    { label: "Cost per registration", value: "Free" },
    { label: "Storage", value: "On-chain (forever)" },
    { label: "Contract", value: shortContract },
    { label: "Verifiable on", value: "Etherscan" },
  ];

  return (
    <div className="border-y border-border bg-bg/60 backdrop-blur-sm py-3">
      <Marquee durationSeconds={45} repeat={3} className="text-text-primary">
        {items.map((it) => (
          <div className="flex items-center gap-3 whitespace-nowrap px-4" key={it.label}>
            <span className="font-medium font-mono text-[13px] tracking-wide text-text-primary">
              {it.value}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              {it.label}
            </span>
            <span className="text-text-tertiary text-[10px] mono ml-2">·</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}

/* ---------- helpers ---------- */

function Hairline() {
  return <div className="hairline" />;
}

function SectionLabel({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <p className="text-[11px] mono uppercase tracking-[0.2em] text-text-tertiary">{kicker}</p>
      <h2 className="mt-4 text-[36px] sm:text-[44px] leading-[1.1] tracking-tight font-medium text-text-primary">
        {title}
      </h2>
    </>
  );
}

const REASONS = [
  {
    title: "Survives the issuer",
    body: "Records persist across thousands of independent nodes. We cannot lose them, and we cannot take them down.",
    Icon: Server,
  },
  {
    title: "Resists pressure",
    body: "No admin can silently delete records under a subpoena, an acquisition, or a settlement.",
    Icon: Lock,
  },
  {
    title: "Trust-minimized timestamps",
    body: "Block timestamps are set by Ethereum consensus — not by us, not by the registrant.",
    Icon: Clock,
  },
  {
    title: "Verifiable by strangers",
    body: "AI labs and courts can verify directly on Etherscan without trusting our website.",
    Icon: Globe,
  },
];
