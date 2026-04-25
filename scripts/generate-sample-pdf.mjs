/**
 * Standalone preview generator. Mirrors lib/pdf.ts exactly but runs in Node so
 * you can see the receipt design without going through the live site.
 *
 *   node scripts/generate-sample-pdf.mjs
 */
import { jsPDF } from "jspdf";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "sample-evidence.pdf");

/* ─── Constants identical to lib/pdf.ts ─── */
const PAGE_W = 612;
const MARGIN_X = 60;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const LABEL_W = 130;
const VALUE_X = MARGIN_X + LABEL_W;
const VALUE_W = CONTENT_W - LABEL_W;

const C = {
  ink: [16, 18, 24],
  body: [60, 64, 72],
  muted: [120, 124, 132],
  rule: [220, 222, 226],
};

/* ─── Sample evidence data (matches the eagle registration the user did) ─── */
const SAMPLE = {
  sha256: "0x534d588c348006514882a1bc5f03a71ddea83648fd6c35b937f88889b23fb668",
  pHash: "0x7321e09e8f68eca5",
  owner: "0xb29e29af3346dd0e88ad1ddd2c5634910243152a",
  blockNumber: 10729915,
  timestamp: 1777111360,
  txHash: "0x9c76344d9d3cc4497316377a385af281b57aaa229305df1d7dd6ffb6b9913d31",
};

const CONTRACT_ADDRESS = "0xA1794Fe34092aE156163CD6cCcCEeA1c08BCDc0f";
const txUrl = (h) => `https://sepolia.etherscan.io/tx/${h}`;
const addressUrl = (a) => `https://sepolia.etherscan.io/address/${a}`;

/* ─── Helpers (identical to lib/pdf.ts) ─── */
function rule(doc, y) {
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
}

function sectionHeader(doc, y, label) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text(label.toUpperCase(), MARGIN_X, y, { charSpace: 1.2 });
  return y + 18;
}

function wrapUrlAtSlashes(doc, url, maxWidth) {
  const parts = url.split(/(\/)/);
  const lines = [];
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
  return lines.flatMap((l) =>
    doc.getTextWidth(l) > maxWidth ? doc.splitTextToSize(l, maxWidth) : [l]
  );
}

function renderRow(doc, y, label, value, kind) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text(label.toUpperCase(), MARGIN_X, y + 8);

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

/* ─── Build PDF ─── */
const doc = new jsPDF({ unit: "pt", format: "letter" });
let y = 60;

// Header strip
let logoData = null;
try {
  const buf = readFileSync(resolve(ROOT, "public/logo.png"));
  logoData = `data:image/png;base64,${buf.toString("base64")}`;
} catch {}
if (logoData) {
  try {
    doc.addImage(logoData, "PNG", MARGIN_X, y - 4, 26, 26);
  } catch {}
}

doc.setFont("helvetica", "bold");
doc.setTextColor(...C.ink);
doc.setFontSize(14);
doc.text("DoNotTrain", MARGIN_X + (logoData ? 36 : 0), y + 12);

doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.setTextColor(...C.muted);
doc.text("EVIDENCE  ·  R-001", PAGE_W - MARGIN_X, y + 12, { align: "right" });

y += 32;
rule(doc, y);
y += 22;

// Title
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
doc.text(`Generated  ${new Date().toUTCString()}`, PAGE_W - MARGIN_X, y, {
  align: "right",
});
y += 18;

rule(doc, y);
y += 22;

// Registration details
y = sectionHeader(doc, y, "Registration details");

const date = new Date(SAMPLE.timestamp * 1000);

const rows = [
  ["SHA-256", SAMPLE.sha256, "mono"],
  ["Perceptual hash", SAMPLE.pHash, "mono"],
  ["Owner address", SAMPLE.owner, "mono"],
  ["Block number", String(SAMPLE.blockNumber), "mono"],
  ["Block timestamp (UTC)", date.toUTCString(), "text"],
  ["Block timestamp (local)", date.toString(), "text"],
  ["Transaction hash", SAMPLE.txHash, "mono"],
  ["Etherscan URL", txUrl(SAMPLE.txHash), "url"],
];
for (const [label, value, kind] of rows) {
  y = renderRow(doc, y, label, value, kind);
}

y += 8;
rule(doc, y);
y += 22;

// Verification
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

// Registry contract
y = sectionHeader(doc, y, "Registry contract");
y = renderRow(doc, y, "Contract", CONTRACT_ADDRESS, "mono");
y = renderRow(doc, y, "Network", "Ethereum Sepolia testnet (chainId 11155111)", "text");
y = renderRow(doc, y, "View on Etherscan", addressUrl(CONTRACT_ADDRESS), "url");

y += 14;
rule(doc, y);
y += 18;

// Legal
doc.setFont("helvetica", "italic");
doc.setFontSize(8);
doc.setTextColor(...C.muted);
const legal =
  "This document is not legal advice. Consult a qualified attorney for use in litigation. " +
  "The DoNotTrain registry constitutes evidence of prior notice; it is not a determination " +
  "of authorship, ownership, or infringement.";
const legalLines = doc.splitTextToSize(legal, CONTENT_W);
doc.text(legalLines, MARGIN_X, y);

// Footer
const footerY = 770;
rule(doc, footerY - 14);
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(...C.muted);
doc.text("DoNotTrain  ·  On-chain opt-out registry", MARGIN_X, footerY);
doc.text("Page 1 of 1", PAGE_W - MARGIN_X, footerY, { align: "right" });

const buf = Buffer.from(doc.output("arraybuffer"));
writeFileSync(OUT, buf);
console.log(`✓ Saved sample PDF to: ${OUT}`);
try {
  execSync(`open "${OUT}"`);
  console.log("✓ Opened in default viewer");
} catch {}
