"use client";

import { useEffect, useState } from "react";
import { type Hex } from "viem";
import { useReadContract } from "wagmi";
import { Loader2 } from "lucide-react";

import { FileDropZone } from "@/components/FileDropZone";
import { HashDisplay } from "@/components/HashDisplay";
import { RegistrationCard } from "@/components/RegistrationCard";
import { CONTRACT_ADDRESS, DONOTTRAIN_ABI } from "@/lib/contract";
import { isImage, sha256OfFile } from "@/lib/hash";
import { hamming, PHASH_ZERO, phashOfImage } from "@/lib/phash";

// Hamming threshold for "similar" pHash matches. 22/64 catches most realistic
// modifications (re-encodes, recompressions, screenshots, annotations,
// scaling, watermarks, light cropping). With Gaussian-blurred pHash, false
// positives at this threshold are rare across distinct images.
const HAMMING_THRESHOLD = 22;

type Mode = "file" | "hash";
type Phase = "idle" | "hashing" | "ready";

export default function LookupPage() {
  const [mode, setMode] = useState<Mode>("file");
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [pastedHash, setPastedHash] = useState("");
  const [sha256, setSha256] = useState<Hex | null>(null);
  const [pHash, setPHash] = useState<Hex | null>(null);
  const [searched, setSearched] = useState(false);

  const exact = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DONOTTRAIN_ABI,
    functionName: "getRegistration",
    args: sha256 ? [sha256] : undefined,
    query: { enabled: searched && !!sha256, retry: false },
  });

  const exactFound = !exact.isError && !!exact.data;
  const shouldQuerySimilar =
    searched && !!pHash && pHash !== PHASH_ZERO && exact.isError;

  const similar = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DONOTTRAIN_ABI,
    functionName: "findSimilar",
    args: pHash ? [pHash, HAMMING_THRESHOLD] : undefined,
    query: { enabled: shouldQuerySimilar },
  });

  const firstSimilarSha = similar.data?.[0];
  const similarReg = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DONOTTRAIN_ABI,
    functionName: "getRegistration",
    args: firstSimilarSha ? [firstSimilarSha] : undefined,
    query: { enabled: !!firstSimilarSha },
  });

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      setPhase("hashing");
      setSearched(false);
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
        }
        setPhase("ready");
      } catch {
        setPhase("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  function searchByHash() {
    const cleaned = pastedHash.trim().toLowerCase();
    if (!/^0x[0-9a-f]{64}$/.test(cleaned)) return;
    setSha256(cleaned as Hex);
    setPHash(null);
    setSearched(true);
  }

  function searchByFile() {
    if (!sha256) return;
    setSearched(true);
  }

  const loading =
    searched &&
    (exact.isLoading || (shouldQuerySimilar && (similar.isLoading || similarReg.isLoading)));

  return (
    <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <p className="text-[11px] mono uppercase tracking-[0.2em] text-text-tertiary">Look up</p>
      <h1 className="mt-3 text-[36px] sm:text-[44px] font-medium tracking-tight text-text-primary leading-[1.1]">
        Search the registry.
      </h1>
      <p className="mt-4 text-[15px] text-text-secondary leading-relaxed max-w-xl">
        Drop a file or paste a SHA-256 hash. We check for exact and (for images) screenshot-resilient matches.
      </p>

      <div className="mt-10 inline-flex p-1 rounded-md bg-surface border border-border">
        <ModeButton active={mode === "file"} onClick={() => setMode("file")}>
          Upload file
        </ModeButton>
        <ModeButton active={mode === "hash"} onClick={() => setMode("hash")}>
          Paste hash
        </ModeButton>
      </div>

      <div className="mt-6">
        {mode === "file" && phase !== "ready" && <FileDropZone onFile={setFile} />}

        {mode === "file" && file && (
          <div>
            <div className="text-[12px] text-text-tertiary mb-4 mono">
              <span className="text-text-primary">{file.name}</span>
              <span className="mx-2">·</span>
              {(file.size / 1024).toFixed(1)} KB
            </div>
            {phase === "hashing" && (
              <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Computing fingerprints…
              </div>
            )}
            {sha256 && (
              <div className="space-y-3">
                <HashDisplay label="SHA-256" value={sha256} />
                {pHash && pHash !== PHASH_ZERO && (
                  <HashDisplay label="Perceptual hash" value={pHash} />
                )}
              </div>
            )}
            {phase === "ready" && (
              <button
                onClick={searchByFile}
                className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-text-primary text-bg text-[14px] font-medium hover:bg-white transition"
              >
                Search registry
              </button>
            )}
          </div>
        )}

        {mode === "hash" && (
          <div className="space-y-4">
            <input
              type="text"
              value={pastedHash}
              onChange={(e) => setPastedHash(e.target.value)}
              placeholder="0x… (66 chars: 0x + 64 hex)"
              className="w-full bg-surface border border-border rounded-md px-4 py-3 mono text-[13px] focus:outline-none focus:border-text-secondary text-text-primary"
            />
            <button
              onClick={searchByHash}
              disabled={!/^0x[0-9a-f]{64}$/i.test(pastedHash.trim())}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-text-primary text-bg text-[14px] font-medium hover:bg-white transition disabled:opacity-30"
            >
              Search registry
            </button>
          </div>
        )}

        {/* Results */}
        {searched && (
          <div className="mt-12">
            {loading && (
              <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching on-chain…
              </div>
            )}

            {!loading && exactFound && exact.data && sha256 && (
              <RegistrationCard
                heading="Registered. Do not train"
                variant="warning"
                sha256={sha256}
                pHash={(exact.data[3] as Hex) ?? PHASH_ZERO}
                owner={exact.data[0] as string}
                blockNumber={exact.data[2] as bigint}
                timestamp={exact.data[1] as bigint}
              />
            )}

            {!loading && !exactFound && firstSimilarSha && similarReg.data && pHash && (
              <RegistrationCard
                heading="Similar work registered. Possibly a modified copy"
                variant="warning"
                sha256={firstSimilarSha}
                pHash={(similarReg.data[3] as Hex) ?? PHASH_ZERO}
                owner={similarReg.data[0] as string}
                blockNumber={similarReg.data[2] as bigint}
                timestamp={similarReg.data[1] as bigint}
                similarityDistance={hamming(pHash, (similarReg.data[3] as Hex) ?? PHASH_ZERO)}
              />
            )}

            {!loading &&
              !exactFound &&
              (!shouldQuerySimilar || (similar.data && similar.data.length === 0)) && (
                <div className="rounded-lg border border-border bg-surface p-7">
                  <div className="text-[10px] mono uppercase tracking-[0.2em] text-success mb-1.5">No match</div>
                  <div className="text-[20px] font-medium text-text-primary tracking-tight">Not registered</div>
                  <p className="text-[13px] text-text-secondary mt-2">
                    No opt-out claim exists for this work in the DoNotTrain registry on Sepolia.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded text-[13px] transition ${
        active
          ? "bg-bg text-text-primary"
          : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
