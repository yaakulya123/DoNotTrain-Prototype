import { NextRequest } from "next/server";

// Server-side Sepolia RPC proxy. The browser POSTs to /api/rpc on the same
// origin as the app, and we forward to upstream Ethereum RPCs from Vercel's
// edge. This bypasses two real-world issues:
//   1. Network-level blocking of public Web3 RPC hostnames on campus / corp
//      networks (NYU, school Wi-Fi, hotels).
//   2. Browser CORS quirks across different public RPC providers.
//
// We rotate through a small set of reliable Sepolia endpoints; any one that
// returns 2xx wins. If they all fail we return 502 so wagmi surfaces the
// failure to the UI instead of hanging.

const UPSTREAM_RPCS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.gateway.tenderly.co",
  "https://1rpc.io/sepolia",
  "https://sepolia.drpc.org",
];

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.text();

  let lastError: string | null = null;
  for (const upstream of UPSTREAM_RPCS) {
    try {
      const upstreamRes = await fetch(upstream, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (!upstreamRes.ok) {
        lastError = `${upstream} → HTTP ${upstreamRes.status}`;
        continue;
      }
      const text = await upstreamRes.text();
      return new Response(text, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (e) {
      lastError = `${upstream} → ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: `All upstream RPCs failed: ${lastError ?? "unknown"}` }, id: null }),
    { status: 502, headers: { "content-type": "application/json" } }
  );
}
