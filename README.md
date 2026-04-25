# DoNotTrain

**On-chain opt-out registry for AI training data.**
Drop a file, sign one transaction, get a court-admissible record of prior notice on Ethereum. The file never leaves the browser — only a SHA-256 and a perceptual hash go on-chain.

---

### Status

| | |
|---|---|
| Network | Ethereum **Sepolia** testnet |
| Contract | [`0xA1794Fe34092aE156163CD6cCcCEeA1c08BCDc0f`](https://sepolia.etherscan.io/address/0xA1794Fe34092aE156163CD6cCcCEeA1c08BCDc0f) |
| Cost per registration | ~0.0002 SepoliaETH (free test ETH) |

### What it does

1. **Fingerprint, locally.** SHA-256 + Gaussian-blurred perceptual hash, computed in the browser.
2. **Sign on Ethereum.** One MetaMask click writes both hashes to Sepolia.
3. **Download evidence.** A receipt-style PDF with the on-chain record and a public Etherscan link.

### Safeguards

- **Anti-squatting gate.** Before allowing a new registration, the registry is scanned for a perceptually similar pHash. If a match is found, registration is **blocked** and the original owner's address is exposed for contact (XMTP, ENS profile, Etherscan).
- **No file upload, ever.** Only the 32-byte SHA-256 and 8-byte pHash leave the browser.

### Stack

Next.js 14 · TypeScript · Tailwind · wagmi v2 · RainbowKit · Solidity 0.8.20 · Hardhat · jsPDF · Paper Shaders

### Run locally

```bash
npm install
cp .env.local.example .env.local       # paste your contract + WalletConnect IDs
npm run dev                             # http://localhost:3000
npm test                                # 10 contract tests
```

### Deploy your own contract

Walk through [`SETUP.md`](./SETUP.md) — install MetaMask, get free Sepolia ETH, deploy via Remix, push the frontend to Vercel.

### License

MIT
