import { jsPDF } from "jspdf";
import { CONTRACT_ADDRESS, addressUrl, txUrl } from "./contract";

export interface EvidenceData {
  sha256: string;
  pHash: string;
  owner: string;
  blockNumber: bigint | number;
  timestamp: bigint | number; // unix seconds
  txHash: string;
}

/* ─────────────────────────────────────────────────────────────────────────
   Page geometry
   ───────────────────────────────────────────────────────────────────────── */
const PAGE_W = 612; // Letter width in pt
const MARGIN_X = 60;
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 492
const LABEL_W = 130;
const VALUE_X = MARGIN_X + LABEL_W;
const VALUE_W = CONTENT_W - LABEL_W; // 362

const C = {
  ink: [16, 18, 24] as const,
  body: [60, 64, 72] as const,
  muted: [120, 124, 132] as const,
  rule: [220, 222, 226] as const,
};

async function loadLogoDataURL(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Generates the court-admissible evidence bundle, client-side.
 * Layout: header strip → title → details table → verification copy →
 * registry contract → legal disclaimer → footer rule.
 */
export async function downloadEvidencePDF(d: EvidenceData) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  /* ────────────── HEADER STRIP ────────────── */
  let y = 60;

  const logo = await loadLogoDataURL();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", MARGIN_X, y - 4, 26, 26);
    } catch {
      /* ignore */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.ink);
  doc.setFontSize(14);
  doc.text("DoNotTrain", MARGIN_X + (logo ? 36 : 0), y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text("EVIDENCE  ·  R-001", PAGE_W - MARGIN_X, y + 12, { align: "right" });

  y += 32;
  rule(doc, y);
  y += 22;

  /* ────────────── TITLE ────────────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...C.ink);
  doc.text("Opt-Out Evidence Bundle", MARGIN_X, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.muted);
  doc.text("Proof of prior notice — Ethereum Sepolia testnet", MARGIN_X, y);
  y += 8;

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  const generated = new Date().toUTCString();
  doc.text(`Generated  ${generated}`, PAGE_W - MARGIN_X, y, { align: "right" });
  y += 18;

  rule(doc, y);
  y += 22;

  /* ────────────── REGISTRATION DETAILS ────────────── */
  y = sectionHeader(doc, y, "Registration details");

  const tsNum = typeof d.timestamp === "bigint" ? Number(d.timestamp) : d.timestamp;
  const date = new Date(tsNum * 1000);
  const blockNum = typeof d.blockNumber === "bigint" ? d.blockNumber.toString() : `${d.blockNumber}`;

  const rows: Array<[string, string, "mono" | "text" | "url"]> = [
    ["SHA-256",                d.sha256, "mono"],
    ["Perceptual hash",        d.pHash,  "mono"],
    ["Owner address",          d.owner,  "mono"],
    ["Block number",           blockNum, "mono"],
    ["Block timestamp (UTC)",  date.toUTCString(), "text"],
    ["Block timestamp (local)", date.toString(),    "text"],
    ["Transaction hash",       d.txHash, "mono"],
    ["Etherscan URL",          txUrl(d.txHash), "url"],
  ];

  for (const [label, value, kind] of rows) {
    y = renderRow(doc, y, label, value, kind);
  }

  y += 8;
  rule(doc, y);
  y += 22;

  /* ────────────── VERIFICATION ────────────── */
  y = sectionHeader(doc, y, "How to verify");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.body);
  const verify =
    "This record is independently verifiable on the Ethereum Sepolia blockchain. " +
    "Open the Etherscan URL above in any browser. The block timestamp is set by " +
    "Ethereum consensus, not by the issuer of this PDF. The record cannot be " +
    "altered or deleted by the issuer, the wallet owner, or any third party.";
  const verifyLines = doc.splitTextToSize(verify, CONTENT_W);
  doc.text(verifyLines, MARGIN_X, y);
  y += verifyLines.length * 13 + 16;

  rule(doc, y);
  y += 22;

  /* ────────────── REGISTRY CONTRACT ────────────── */
  y = sectionHeader(doc, y, "Registry contract");

  y = renderRow(doc, y, "Contract", CONTRACT_ADDRESS, "mono");
  y = renderRow(doc, y, "Network", "Ethereum Sepolia testnet (chainId 11155111)", "text");
  y = renderRow(doc, y, "View on Etherscan", addressUrl(CONTRACT_ADDRESS), "url");

  y += 14;
  rule(doc, y);
  y += 18;

  /* ────────────── LEGAL ────────────── */
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  const legal =
    "This document is not legal advice. Consult a qualified attorney for use in litigation. " +
    "The DoNotTrain registry constitutes evidence of prior notice; it is not a determination " +
    "of authorship, ownership, or infringement.";
  const legalLines = doc.splitTextToSize(legal, CONTENT_W);
  doc.text(legalLines, MARGIN_X, y);

  /* ────────────── FOOTER ────────────── */
  const footerY = 770;
  rule(doc, footerY - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text("DoNotTrain  ·  On-chain opt-out registry", MARGIN_X, footerY);
  doc.text("Page 1 of 1", PAGE_W - MARGIN_X, footerY, { align: "right" });

  doc.save(`donottrain-evidence-${d.sha256.slice(2, 10)}.pdf`);
}

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────── */

function rule(doc: jsPDF, y: number) {
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
}

/**
 * Single-line section header (no duplicate kicker). Returns the new Y so the
 * caller doesn't need to track vertical position manually.
 */
function sectionHeader(doc: jsPDF, y: number, label: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text(label.toUpperCase(), MARGIN_X, y, { charSpace: 1.2 });
  return y + 18;
}

/**
 * Render one label/value row. URL kind hard-wraps at "/" so long Etherscan
 * links break at meaningful boundaries instead of the middle of a hash.
 */
function renderRow(
  doc: jsPDF,
  y: number,
  label: string,
  value: string,
  kind: "mono" | "text" | "url"
): number {
  // Label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text(label.toUpperCase(), MARGIN_X, y + 8);

  // Value
  if (kind === "mono" || kind === "url") {
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  }
  doc.setTextColor(...C.ink);

  const lines =
    kind === "url"
      ? wrapUrlAtSlashes(doc, value, VALUE_W)
      : doc.splitTextToSize(value, VALUE_W);

  doc.text(lines, VALUE_X, y + 8);

  const lineHeight = kind === "mono" || kind === "url" ? 11 : 13;
  return y + Math.max(20, lines.length * lineHeight + 8);
}

/**
 * Break a URL at "/" boundaries to fit `maxWidth`. Falls back to plain
 * splitTextToSize if a single segment is still too wide.
 */
function wrapUrlAtSlashes(doc: jsPDF, url: string, maxWidth: number): string[] {
  const parts = url.split(/(\/)/); // keep the slashes
  const lines: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current + part;
    if (doc.getTextWidth(candidate) > maxWidth && current) {
      lines.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  // Safety net for any line still too wide (e.g., a giant hash chunk)
  return lines.flatMap((l) =>
    doc.getTextWidth(l) > maxWidth ? doc.splitTextToSize(l, maxWidth) : [l]
  );
}
