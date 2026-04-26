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

  // Surface RPC method for log correlation
  let parsedBody: { method?: string; id?: unknown; params?: unknown } = {};
  try { parsedBody = JSON.parse(body); } catch {}
  const tag = `[rpc method=${parsedBody.method ?? "?"} id=${String(parsedBody.id ?? "?")}]`;
  const reqSummary = JSON.stringify(parsedBody.params).slice(0, 500);
  console.log(tag, "REQ", reqSummary);

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
        console.warn(tag, lastError);
        continue;
      }
      const text = await upstreamRes.text();
      // Detect an INFRASTRUCTURE-level JSON-RPC error (rate limit, parse
      // error, internal error) and rotate to the next upstream. Contract
      // execution errors (code 3, "execution reverted") are legitimate
      // responses that must be passed through to the client unchanged.
      let parsed: { error?: { message?: string; code?: number; data?: unknown } } | null = null;
      try { parsed = JSON.parse(text); } catch {}
      if (parsed && parsed.error) {
        const isExecutionRevert = parsed.error.code === 3 || typeof parsed.error.data === "string";
        if (!isExecutionRevert) {
          lastError = `${upstream} → JSON-RPC error code=${parsed.error.code} msg=${parsed.error.message}`;
          console.warn(tag, lastError);
          continue;
        }
      }
      console.log(tag, `${upstream} → ok (${text.length}B) RES:`, text.slice(0, 500));
      return new Response(text, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (e) {
      lastError = `${upstream} → ${e instanceof Error ? e.message : String(e)}`;
      console.warn(tag, lastError);
    }
  }

  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: `All upstream RPCs failed: ${lastError ?? "unknown"}` }, id: null }),
    { status: 502, headers: { "content-type": "application/json" } }
  );
}
