"use client";

import Link from "next/link";
import { ArrowRight, Fingerprint, PenTool, FileSignature } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Phase {
  id: string;
  step: string;
  title: string;
  summary: string;
  micro: string[];
  Icon: LucideIcon;
  /** Unsplash photo ID — kept dark + grayscale so all three feel unified */
  image: string;
  accent: string;
}

const PHASES: Phase[] = [
  {
    id: "fingerprint",
    step: "01",
    title: "Fingerprint, locally.",
    summary:
      "Drop any file in your browser. We compute a SHA-256 plus a screenshot-resilient perceptual hash on your device. The file itself never leaves your computer.",
    micro: ["Drag any file", "SHA-256 in-browser", "Perceptual hash for images"],
    Icon: Fingerprint,
    image:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=70",
    accent: "rgba(99,102,241,0.35)",
  },
  {
    id: "sign",
    step: "02",
    title: "Sign on Ethereum.",
    summary:
      "One signature in your wallet writes the hashes to Sepolia. No accounts, no servers, no email. The block timestamp is set by Ethereum consensus, not by us.",
    micro: ["One MetaMask click", "Hashes etched permanently", "Block timestamped by consensus"],
    Icon: PenTool,
    image:
      "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1200&q=70",
    accent: "rgba(16,185,129,0.30)",
  },
  {
    id: "evidence",
    step: "03",
    title: "Download evidence.",
    summary:
      "Receive a court-ready PDF with the registration record and a public Etherscan link. Anyone (courts, AI labs, the public) can verify it independently.",
    micro: ["Verifiable PDF receipt", "Public Etherscan link", "Independently provable"],
    Icon: FileSignature,
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=70",
    accent: "rgba(245,158,11,0.30)",
  },
];

export function Workflow() {
  return (
    <section className="py-32">
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-16">
        <div className="text-center max-w-2xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-border bg-surface/60 text-[10px] mono uppercase tracking-[0.2em] text-text-secondary mb-6">
            Workflow
          </span>
          <h2 className="text-pretty text-[36px] sm:text-[44px] lg:text-[56px] leading-[1.05] tracking-tight font-medium text-text-primary">
            Three steps.
            <br />
            About thirty seconds.
          </h2>
          <p className="mt-6 text-text-secondary text-[15px] sm:text-[17px] leading-[1.65]">
            From dropping a file to holding a court-ready receipt, the full
            user-facing flow runs entirely in your browser plus one Ethereum
            transaction.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 text-text-primary text-[14px] hover:underline"
          >
            Try it now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {PHASES.map((phase) => (
            <PhaseCard key={phase.id} phase={phase} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PhaseCard({ phase }: { phase: Phase }) {
  const Icon = phase.Icon;
  return (
    <article className="group grid grid-rows-[auto_auto_1fr_auto] rounded-xl border border-border bg-surface/60 hover:border-text-tertiary hover:bg-surface transition overflow-hidden">
      {/* Visual header — Unsplash image, desaturated, with colored gradient overlay */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={phase.image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover grayscale opacity-50 transition group-hover:opacity-65 group-hover:scale-[1.02]"
        />
        {/* Color tint per phase */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(140deg, ${phase.accent}, transparent 70%)`,
          }}
        />
        {/* Bottom fade so the title reads off any image */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/30 to-bg/70" />

        {/* Floating icon glass-block */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-2xl border border-white/15 bg-bg/45 backdrop-blur flex items-center justify-center group-hover:scale-105 transition shadow-[0_4px_20px_-6px_rgba(0,0,0,0.6)]">
            <Icon className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Step number */}
        <div className="absolute top-4 left-4 text-[11px] mono uppercase tracking-[0.2em] text-text-secondary">
          Step {phase.step}
        </div>
      </div>

      <header className="px-6 pt-6">
        <h3 className="text-[20px] sm:text-[22px] font-medium tracking-tight text-text-primary leading-snug">
          {phase.title}
        </h3>
      </header>

      <div className="px-6 py-4">
        <p className="text-text-secondary text-[14px] leading-[1.65]">{phase.summary}</p>
        <ul className="mt-4 space-y-1.5">
          {phase.micro.map((m) => (
            <li
              key={m}
              className="flex items-center gap-2 text-[12px] text-text-tertiary mono"
            >
              <span className="h-1 w-1 rounded-full bg-text-tertiary" />
              {m}
            </li>
          ))}
        </ul>
      </div>

      <footer className="px-6 pb-6 pt-2">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-text-primary text-[13px] hover:gap-2.5 transition-all"
        >
          Read more
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </footer>
    </article>
  );
}
