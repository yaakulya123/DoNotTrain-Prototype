"use client";

import { ArrowUpRight, Download } from "lucide-react";
import { addressUrl, txUrl } from "@/lib/contract";
import { downloadEvidencePDF } from "@/lib/pdf";

interface Props {
  sha256: string;
  pHash: string;
  owner: string;
  blockNumber: bigint | number;
  timestamp: bigint | number;
  txHash?: string;
  variant?: "success" | "warning";
  similarityDistance?: number;
  heading?: string;
}

export function RegistrationCard({
  sha256,
  pHash,
  owner,
  blockNumber,
  timestamp,
  txHash,
  variant = "success",
  similarityDistance,
  heading,
}: Props) {
  const tsNum = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const blockNum = typeof blockNumber === "bigint" ? blockNumber.toString() : `${blockNumber}`;
  const utc = new Date(tsNum * 1000).toUTCString();

  const accentBar =
    variant === "warning" ? "bg-warning" : "bg-success";
  const accentText =
    variant === "warning" ? "text-warning" : "text-success";
  const heading_ = heading ?? (variant === "warning" ? "Registered — do not train" : "Registered on-chain");

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className={`h-0.5 ${accentBar}`} />
      <div className="p-7">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <div>
            <div className={`text-[10px] mono uppercase tracking-[0.2em] mb-1.5 ${accentText}`}>
              {variant === "warning" ? "Match found" : "Confirmed"}
            </div>
            <div className="text-[20px] font-medium text-text-primary tracking-tight">{heading_}</div>
          </div>
          {similarityDistance !== undefined && (
            <div className="text-[12px] mono text-text-tertiary">
              Hamming distance · {similarityDistance}/64
            </div>
          )}
        </div>

        <dl className="grid sm:grid-cols-[170px_1fr] gap-y-3.5 gap-x-6 text-[13px]">
          <Row k="SHA-256" v={sha256} mono />
          <Row k="Perceptual hash" v={pHash} mono />
          <Row
            k="Owner"
            v={
              <a
                className="text-text-primary hover:underline mono inline-flex items-center gap-1"
                href={addressUrl(owner)}
                target="_blank"
                rel="noreferrer"
              >
                {owner}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            }
          />
          <Row k="Block" v={blockNum} mono />
          <Row k="Timestamp" v={utc} />
          {txHash && (
            <Row
              k="Transaction"
              v={
                <a
                  className="text-text-primary hover:underline mono inline-flex items-center gap-1"
                  href={txUrl(txHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {txHash}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              }
            />
          )}
        </dl>

        {txHash && (
          <button
            onClick={async () =>
              await downloadEvidencePDF({
                sha256,
                pHash,
                owner,
                blockNumber,
                timestamp,
                txHash,
              })
            }
            className="mt-7 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-text-primary text-bg text-[13px] font-medium hover:bg-white transition"
          >
            <Download className="h-3.5 w-3.5" />
            Download evidence PDF
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, mono = false }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <>
      <dt className="text-text-tertiary text-[10px] uppercase tracking-[0.15em] mono pt-0.5">{k}</dt>
      <dd className={`break-all text-text-primary ${mono ? "mono text-[12px] sm:text-[13px]" : ""}`}>{v}</dd>
    </>
  );
}
