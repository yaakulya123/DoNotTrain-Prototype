"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type Hex } from "viem";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Loader2, ArrowUpRight, ShieldAlert, Copy, Check } from "lucide-react";

import { FileDropZone } from "@/components/FileDropZone";
import { HashDisplay } from "@/components/HashDisplay";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { RegistrationCard } from "@/components/RegistrationCard";
import { CONTRACT_ADDRESS, DONOTTRAIN_ABI, addressUrl, txUrl } from "@/lib/contract";
import { isImage, sha256OfFile } from "@/lib/hash";
import { hamming, PHASH_ZERO, phashOfImage } from "@/lib/phash";

/** Same threshold the lookup page uses — reasoned in lookup/page.tsx */
const PRIOR_NOTICE_THRESHOLD = 22;

type RegStatus =
  | { kind: "idle" }
  | { kind: "hashing" }
  | { kind: "ready" }
  | { kind: "submitting" }
  | { kind: "pending"; tx: Hex }
  | { kind: "confirmed"; tx: Hex; blockNumber: bigint }
  | { kind: "error"; message: string };

export default function RegisterPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const onSepolia = chainId === sepolia.id;

  const [file, setFile] = useState<File | null>(null);
  const [sha256, setSha256] = useState<Hex | null>(null);
  const [pHash, setPHash] = useState<Hex | null>(null);
  const [skippedPHash, setSkippedPHash] = useState(false);
  const [status, setStatus] = useState<RegStatus>({ kind: "idle" });

  const { writeContract, data: txHash, error: writeError, reset } = useWriteContract();
  const { data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  const {
    data: alreadyExists,
    isFetched: existsFetched,
    isFetching: existsFetching,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DONOTTRAIN_ABI,
    functionName: "isRegistered",
    args: sha256 ? [sha256] : undefined,
    query: { enabled: !!sha256 },
  });

  // ── Prior-notice safeguard: scan registry for a perceptually-similar match
  // before allowing this registration. If we find one, the user must
  // acknowledge before proceeding — so they can't accidentally (or maliciously)
  // re-register a slightly modified version of someone else's already-protected work.
  const shouldScanForPrior =
    !!pHash && pHash !== PHASH_ZERO && !alreadyExists && status.kind === "ready";

  const {
    data: similarHashes,
    isFetched: scanFetched,
    isFetching: scanFetching,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DONOTTRAIN_ABI,
    functionName: "findSimilar",
    args: pHash ? [pHash, PRIOR_NOTICE_THRESHOLD] : undefined,
    query: { enabled: shouldScanForPrior },
  });

  const priorMatchSha = similarHashes?.[0];
  const {
    data: priorMatch,
    isFetched: priorMatchFetched,
    isFetching: priorMatchFetching,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DONOTTRAIN_ABI,
    functionName: "getRegistration",
    args: priorMatchSha ? [priorMatchSha] : undefined,
    query: { enabled: !!priorMatchSha, retry: false },
  });

  const hasPriorNotice = !!priorMatchSha && !!priorMatch;

  // Gate the Register button on every contract read being fully resolved.
  // Until then we show a "Checking registry…" indicator so the user cannot
  // click Register before the prior-notice scan has had a chance to fire.
  const needsPriorScan = !!pHash && pHash !== PHASH_ZERO;
  const existsCheckDone = !!sha256 && existsFetched && !existsFetching;
  const priorScanDone =
    !needsPriorScan || alreadyExists || (scanFetched && !scanFetching);
  // If findSimilar returned a candidate, we must also wait on getRegistration.
  const priorMatchResolved =
    !priorMatchSha || (priorMatchFetched && !priorMatchFetching);
  const allChecksComplete =
    status.kind === "ready" &&
    existsCheckDone &&
    priorScanDone &&
    priorMatchResolved;

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      setStatus({ kind: "hashing" });
      setSha256(null);
      setPHash(null);
      setSkippedPHash(false);
      reset();
      try {
        const sha = await sha256OfFile(file);
        if (cancelled) return;
        setSha256(sha);
        if (isImage(file)) {
          const ph = await phashOfImage(file);
          if (cancelled) return;
          setPHash(ph);
        } else {
          setPHash(PHASH_ZERO);
          setSkippedPHash(true);
        }
        setStatus({ kind: "ready" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus({ kind: "error", message: `Hashing failed: ${msg}` });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, reset]);

  useEffect(() => {
    if (txHash && status.kind !== "pending" && status.kind !== "confirmed") {
      setStatus({ kind: "pending", tx: txHash });
    }
  }, [txHash, status.kind]);

  useEffect(() => {
    if (receipt && status.kind === "pending") {
      setStatus({ kind: "confirmed", tx: receipt.transactionHash, blockNumber: receipt.blockNumber });
    }
  }, [receipt, status.kind]);

  useEffect(() => {
    if (writeError) {
      setStatus({ kind: "error", message: friendlyError(writeError.message) });
    }
  }, [writeError]);

  const canSubmit = useMemo(
    () =>
      isConnected &&
      onSepolia &&
      status.kind === "ready" &&
      allChecksComplete &&
      !alreadyExists &&
      !!sha256 &&
      !!pHash &&
      // Hard gate: a perceptually-similar work is already on-chain → blocked.
      !hasPriorNotice,
    [isConnected, onSepolia, status.kind, allChecksComplete, alreadyExists, sha256, pHash, hasPriorNotice]
  );

  function submit() {
    if (!sha256 || !pHash) return;
    setStatus({ kind: "submitting" });
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: DONOTTRAIN_ABI,
      functionName: "register",
      args: [sha256, pHash],
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <p className="text-[11px] mono uppercase tracking-[0.2em] text-text-tertiary">Register</p>
      <h1 className="mt-3 text-[36px] sm:text-[44px] font-medium tracking-tight text-text-primary leading-[1.1]">
        Add a work to the registry.
      </h1>
      <p className="mt-4 text-[15px] text-text-secondary leading-relaxed max-w-xl">
        Drop a file. We compute its fingerprints in your browser and write them to Sepolia. Your
        file never leaves this device.
      </p>

      <div className="mt-12">
        <NetworkSwitcher />

        {!isConnected && (
          <div className="rounded-md border border-border bg-surface p-5 mb-6 text-[13px] text-text-secondary">
            Connect your wallet (top right) to register.
          </div>
        )}

        {(status.kind === "idle" || status.kind === "hashing" || status.kind === "ready") && (
          <FileDropZone onFile={setFile} />
        )}

        {file && (
          <div className="mt-8">
            <div className="text-[12px] text-text-tertiary mb-4 mono">
              <span className="text-text-primary">{file.name}</span>
              <span className="mx-2">·</span>
              {(file.size / 1024).toFixed(1)} KB
              <span className="mx-2">·</span>
              {file.type || "unknown"}
            </div>

            {status.kind === "hashing" && (
              <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Computing SHA-256 + perceptual hash…
              </div>
            )}

            {sha256 && (
              <div className="space-y-3">
                <HashDisplay label="SHA-256" value={sha256} />
                {pHash && (
                  <HashDisplay
                    label="Perceptual hash"
                    value={pHash}
                    note={
                      skippedPHash
                        ? "Non-image file: pHash skipped. Only exact-match protection applies."
                        : "Used for screenshot/recompression-resistant similarity matching."
                    }
                  />
                )}
              </div>
            )}

            {alreadyExists && (
              <div className="mt-6 rounded-md border border-warning/30 bg-warning/5 p-4">
                <div className="text-[13px] font-medium text-text-primary">Already registered</div>
                <p className="text-[12px] text-text-secondary mt-1">
                  This SHA-256 is already on the registry.{" "}
                  <Link href="/lookup" className="underline text-text-primary">
                    Look it up
                  </Link>{" "}
                  to view the existing record.
                </p>
              </div>
            )}

            {/* Registry checks in flight — covers isRegistered, findSimilar, and getRegistration */}
            {status.kind === "ready" && !allChecksComplete && !alreadyExists && (
              <div className="mt-6 flex items-center gap-2 text-[12px] text-text-tertiary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking registry for existing or similar works…
              </div>
            )}

            {/* Prior-notice match — HARD BLOCK (only after all checks resolve) */}
            {allChecksComplete && !alreadyExists && hasPriorNotice && pHash && priorMatch && priorMatchSha && (
              <PriorNoticePanel
                sha256={priorMatchSha as Hex}
                ownerAddr={priorMatch[0] as string}
                timestamp={priorMatch[1] as bigint}
                blockNumber={priorMatch[2] as bigint}
                originalPHash={(priorMatch[3] as Hex) ?? PHASH_ZERO}
                queryPHash={pHash}
              />
            )}

            {status.kind === "ready" && allChecksComplete && !alreadyExists && !hasPriorNotice && (
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-text-primary text-bg text-[14px] font-medium hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Register on-chain
              </button>
            )}
          </div>
        )}

        {status.kind === "submitting" && (
          <div className="mt-8 flex items-center gap-2 text-[13px] text-text-secondary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Confirm the transaction in your wallet…
          </div>
        )}

        {status.kind === "pending" && (
          <div className="mt-8 rounded-md border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-[13px] text-text-primary mb-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-text-secondary" />
              Broadcasting to Ethereum…
            </div>
            <p className="text-[12px] text-text-secondary mt-1">
              Waiting for confirmation (~15–30 sec).{" "}
              <a
                className="inline-flex items-center gap-1 hover:text-text-primary"
                href={txUrl(status.tx)}
                target="_blank"
                rel="noreferrer"
              >
                View on Etherscan
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </p>
          </div>
        )}

        {status.kind === "confirmed" && sha256 && pHash && (
          <div className="mt-8">
            <RegistrationCard
              heading="Registered on-chain"
              sha256={sha256}
              pHash={pHash}
              owner={(receipt?.from ?? "0x") as string}
              blockNumber={status.blockNumber}
              timestamp={Math.floor(Date.now() / 1000)}
              txHash={status.tx}
            />
          </div>
        )}

        {status.kind === "error" && (
          <div className="mt-8 rounded-md border border-danger/30 bg-danger/5 p-4">
            <div className="text-[13px] font-medium text-text-primary">Something went wrong</div>
            <p className="text-[12px] text-text-secondary mt-1">{status.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Prior-notice safeguard panel
   ───────────────────────────────────────────────────────────────────────── */

function PriorNoticePanel({
  sha256,
  ownerAddr,
  timestamp,
  blockNumber,
  originalPHash,
  queryPHash,
}: {
  sha256: Hex;
  ownerAddr: string;
  timestamp: bigint;
  blockNumber: bigint;
  originalPHash: Hex;
  queryPHash: Hex;
}) {
  const [copied, setCopied] = useState(false);
  const distance = hamming(originalPHash, queryPHash);
  const date = new Date(Number(timestamp) * 1000);
  const utc = date.toUTCString();

  return (
    <div className="mt-6 rounded-lg border border-danger/50 bg-danger/5 overflow-hidden">
      <div className="bg-danger/15 px-5 py-3 flex items-center gap-2 border-b border-danger/40">
        <ShieldAlert className="h-4 w-4 text-danger shrink-0" />
        <div className="text-[13px] font-semibold text-text-primary">
          Registration blocked. This work is already protected
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-[13px] text-text-secondary leading-[1.65]">
          A perceptually similar work
          (<span className="mono text-text-primary">{distance}/64</span> Hamming distance)
          is already on-chain. To prevent collisions and competing claims, this
          registration is <span className="text-text-primary font-medium">blocked</span>.
          If you believe this is your original work, you must contact the
          registered owner first.
        </p>

        <dl className="grid sm:grid-cols-[150px_1fr] gap-y-2.5 gap-x-5 text-[12px]">
          <Row
            k="Original owner"
            v={
              <a
                className="text-text-primary hover:underline mono inline-flex items-center gap-1 break-all"
                href={addressUrl(ownerAddr)}
                target="_blank"
                rel="noreferrer"
              >
                {ownerAddr}
                <ArrowUpRight className="h-3 w-3 shrink-0" />
              </a>
            }
          />
          <Row k="Original SHA-256" v={<span className="mono break-all text-text-primary">{sha256}</span>} />
          <Row k="Registered at" v={<span className="text-text-primary">{utc}</span>} />
          <Row k="Block" v={<span className="mono text-text-primary">{blockNumber.toString()}</span>} />
          <Row k="Similarity" v={<span className="mono text-text-primary">{distance}/64 bits flipped</span>} />
        </dl>

        {/* Contact options for the original owner */}
        <div className="rounded-md border border-border bg-surface/60 p-4 space-y-3">
          <div className="text-[11px] mono uppercase tracking-[0.18em] text-text-tertiary">
            Contact the registered owner
          </div>
          <p className="text-[12px] text-text-secondary leading-[1.65]">
            Ethereum addresses are pseudonymous. There is no email or phone on
            them by default. Reach out using one of the wallet-native channels below.
          </p>

          <ul className="text-[12px] text-text-secondary leading-[1.65] space-y-2">
            <li>
              <span className="text-text-primary font-medium">XMTP</span>: encrypted
              wallet-to-wallet messaging. Open{" "}
              <a
                href="https://xmtp.chat"
                target="_blank"
                rel="noreferrer"
                className="text-text-primary underline inline-flex items-center gap-0.5"
              >
                xmtp.chat
                <ArrowUpRight className="h-3 w-3" />
              </a>
              , connect your wallet, paste the owner address, send a message.
              Free; recipient sees it next time they open an XMTP-compatible
              client (Coinbase Wallet, Converse, Hey, etc.).
            </li>
            <li>
              <span className="text-text-primary font-medium">ENS profile</span>:
              if the owner has an ENS name, their text records may include
              email, twitter, or website. Look them up at{" "}
              <a
                href={`https://app.ens.domains/${ownerAddr}`}
                target="_blank"
                rel="noreferrer"
                className="text-text-primary underline inline-flex items-center gap-0.5"
              >
                app.ens.domains
                <ArrowUpRight className="h-3 w-3" />
              </a>
              .
            </li>
            <li>
              <span className="text-text-primary font-medium">Etherscan</span>:
              the address page sometimes shows an attached ENS name, label, or
              public profile.
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(ownerAddr);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-strong bg-surface hover:bg-surface-2 text-[12px] text-text-primary transition"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy owner address
                </>
              )}
            </button>
            <a
              href="https://xmtp.chat/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-accent/40 bg-accent/10 hover:bg-accent/20 text-[12px] text-text-primary transition"
            >
              Open XMTP messenger
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href={`https://app.ens.domains/${ownerAddr}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border-strong bg-surface hover:bg-surface-2 text-[12px] text-text-primary transition"
            >
              Owner ENS profile
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href={addressUrl(ownerAddr)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border-strong bg-surface hover:bg-surface-2 text-[12px] text-text-primary transition"
            >
              View on Etherscan
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <Link
              href="/lookup"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border-strong bg-surface hover:bg-surface-2 text-[12px] text-text-primary transition"
            >
              Look up the original record
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt className="text-[10px] mono uppercase tracking-[0.15em] text-text-tertiary pt-0.5">
        {k}
      </dt>
      <dd className="break-all">{v}</dd>
    </>
  );
}

function friendlyError(message: string): string {
  if (/User rejected|User denied/i.test(message)) {
    return "Transaction cancelled in wallet. Try again when you're ready.";
  }
  if (/insufficient funds/i.test(message)) {
    return "Not enough Sepolia ETH. Get free test ETH from the Google Cloud Web3 faucet.";
  }
  if (/AlreadyRegistered/i.test(message)) {
    return "This file is already in the registry.";
  }
  return message;
}
