"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  label: string;
  value: string;
  note?: string;
}

export function HashDisplay({ label, value, note }: Props) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] mono uppercase tracking-[0.15em] text-text-tertiary">{label}</div>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-text-primary transition"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
      <div className="mono text-[12px] sm:text-[13px] break-all text-text-primary leading-relaxed">{value}</div>
      {note && <div className="text-[12px] text-text-tertiary mt-2">{note}</div>}
    </div>
  );
}
