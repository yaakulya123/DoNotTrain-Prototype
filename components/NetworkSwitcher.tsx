"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { AlertCircle } from "lucide-react";

export function NetworkSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;
  if (chainId === sepolia.id) return null;

  return (
    <div className="rounded-md border border-warning/30 bg-warning/5 p-4 flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-4 w-4 text-warning shrink-0" />
        <div>
          <div className="text-[13px] font-medium text-text-primary">Wrong network</div>
          <div className="text-[12px] text-text-secondary">DoNotTrain runs on Sepolia testnet.</div>
        </div>
      </div>
      <button
        onClick={() => switchChain({ chainId: sepolia.id })}
        disabled={isPending}
        className="shrink-0 px-3.5 py-2 rounded-md border border-border-strong text-[12px] text-text-primary hover:bg-surface-2 transition disabled:opacity-50"
      >
        {isPending ? "Switching…" : "Switch to Sepolia"}
      </button>
    </div>
  );
}
