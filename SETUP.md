# SETUP — Beginner-friendly walkthrough

This is a step-by-step guide for the team. Total time: **~25 minutes**, all of it free, no credit card needed.

## Mental model in one paragraph (read this first)

You are about to deploy a small Solidity program (a "smart contract") to **Sepolia**, which is a free practice version of Ethereum. To do that you need three things: (1) a **wallet** that holds your test ETH and signs transactions — that's MetaMask, a browser extension; (2) some free **test ETH** from a faucet — just pretend money for Sepolia; (3) **Remix**, an in-browser code editor that compiles the contract and pushes it to Sepolia. After the contract lives on-chain, the website just talks to it from the browser via **wagmi + RainbowKit**, two open-source libraries that handle the wallet UX.

Don't memorize the names. Just follow the steps.

---

## Step 1 — Install MetaMask (5 min)

MetaMask is the wallet. It's a Chrome / Brave / Firefox / Edge extension.

1. Go to <https://metamask.io/download/> in Chrome (or your browser of choice).
2. Click **Install MetaMask**.
3. When prompted, click **Create a new wallet** (NOT "Import").
4. Make a strong password.
5. **Write down the 12-word secret recovery phrase** on paper. Keep it. If you lose it, the wallet is gone forever. (For testnet only this is low-stakes, but build the muscle.)
6. Confirm the phrase when MetaMask asks.
7. You'll land on a screen showing **Account 1** with **0 ETH**. Done.

> **Why we use MetaMask:** It is the de-facto standard wallet, professor expects it, and RainbowKit (our wallet UI on the website) supports it out of the box.

## Step 2 — Switch MetaMask to Sepolia testnet (1 min)

By default MetaMask shows Ethereum mainnet (real money). We need Sepolia (fake money).

1. Click the network dropdown at the top of MetaMask (says "Ethereum Mainnet").
2. Toggle **Show test networks** ON.
3. Pick **Sepolia**.

Now your wallet is on Sepolia and the balance is **0 SepoliaETH**.

## Step 3 — Get free Sepolia test ETH (3 min)

1. In MetaMask, click your account name to copy the wallet address (looks like `0xAB12…`).
2. Go to <https://cloud.google.com/application/web3/faucet/ethereum/sepolia>.
3. Sign in with any Google account.
4. Paste your wallet address, hit **Receive 0.05 Sepolia ETH**.
5. Wait ~30 seconds. MetaMask balance should update.

Backup if Google's faucet rate-limits you:

- <https://www.alchemy.com/faucets/ethereum-sepolia> (sign in with Alchemy)
- <https://faucet.chain.link/sepolia> (Chainlink, Twitter login)

You only need a few thousandths of an ETH. 0.05 is plenty.

## Step 4 — Get a WalletConnect Project ID (2 min)

WalletConnect is a free service that powers the "connect wallet" popup on websites. Our frontend needs a free Project ID to use it.

1. Go to <https://cloud.walletconnect.com>.
2. Sign in with email or GitHub.
3. Click **New Project**.
4. Name it `DoNotTrain` (or anything). Type: **App**.
5. Copy the **Project ID** (looks like `9f2a8b4c…`).
6. In the project folder, copy `.env.local.example` to `.env.local` and paste:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your project id>
   ```

## Step 5 — Deploy the smart contract via Remix (5 min)

Remix is a web IDE. No install. Walks you through deploy with one click.

1. Open <https://remix.ethereum.org>.
2. In the **File Explorer** (left sidebar), click the New File icon and create `DoNotTrain.sol`.
3. Paste in the entire contents of `contracts/DoNotTrain.sol` from this repo.
4. Click the **Solidity Compiler** tab (left, looks like a Solidity logo).
   - Compiler version: **0.8.20** or later.
   - Click **Compile DoNotTrain.sol**. You should see a green check.
5. Click the **Deploy & Run Transactions** tab (left, the Ethereum logo with a play arrow).
   - **Environment**: choose **Injected Provider — MetaMask**. A MetaMask popup will ask permission — approve it. Confirm the small text below the dropdown says `Custom (11155111) network` — that's Sepolia's chain ID.
   - **Contract**: should already say `DoNotTrain - contracts/DoNotTrain.sol`.
   - Click the orange **Deploy** button.
   - MetaMask pops up a transaction. Click **Confirm**. Wait ~15 seconds.
6. Under **Deployed Contracts** at the bottom, expand the new entry and copy the address (the `0x…` next to the contract name).
7. Paste it into `.env.local`:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedAddress
   ```

> **Verify on Etherscan (recommended for the rubric):**
> 1. Open `https://sepolia.etherscan.io/address/<your contract address>`.
> 2. Click **Contract** → **Verify and Publish**.
> 3. Compiler 0.8.20, License: MIT, paste the same source. Submit. Wait ~30 sec.
> 4. The contract page will now show a green check + readable source. This makes "Innovation & Blockchain Application" easy points.

## Step 6 — Run the frontend locally (3 min)

```bash
npm install              # one-time, installs everything
npm run dev              # starts Next.js at http://localhost:3000
```

Open <http://localhost:3000>. The landing page should load with a counter at 0. Click **Register Work**, drop a small image, and walk through the demo flow end-to-end. Then go to **Look Up** and verify the same image hits as an exact match.

## Step 7 — Run the contract tests (1 min)

```bash
npm test
```

This runs the Hardhat test suite in `test/DoNotTrain.test.ts` — 9 tests covering register, double-register revert, similarity matching, etc. All should pass. **Show this in your demo or include the screenshot in the slide deck — it's free rubric points.**

## Step 8 — Deploy the frontend to Vercel (5 min)

1. Push the repo to GitHub (a public repo). Make sure `.gitignore` excludes `.env.local`.
2. Go to <https://vercel.com>, sign in with GitHub, click **Import Project**.
3. Choose this repo.
4. Under **Environment Variables**, add the same two from `.env.local`:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
5. Click **Deploy**. After ~1 min you'll have a public URL like `donottrain.vercel.app`.

## Demo day checklist

- [ ] Pre-fund 2–3 wallet addresses with Sepolia ETH (faucets sometimes rate-limit on demo day)
- [ ] Verified contract on Sepolia Etherscan
- [ ] Test it once on the actual demo laptop the night before
- [ ] Have one teammate's MetaMask already connected before you walk on stage
- [ ] Have an "Image A" and a screenshot of Image A pre-loaded in the file picker — the pHash similarity hit is the wow moment

---

## What does each piece do? (cheat sheet)

| Tool | What it is | Why we need it |
|---|---|---|
| **Solidity** | A programming language | The on-chain code is written in it |
| **Remix** | A web-based IDE | Compiles & deploys our Solidity code without any install |
| **MetaMask** | Browser-extension wallet | Holds your test ETH and signs transactions |
| **Sepolia** | A free test version of Ethereum | We deploy here so we don't spend real money |
| **Hardhat** | A Node.js testing framework | Runs automated tests against our contract |
| **Next.js** | A React framework | Builds the website |
| **wagmi** | A library | Lets React read & write to the contract |
| **RainbowKit** | A library | Provides the "Connect Wallet" button + popup |
| **WalletConnect** | A free service | Lets the wallet popup connect to mobile wallets too |
| **Vercel** | A hosting platform | Hosts the website on a public URL |
| **Etherscan** | A public block explorer | Anyone (including the professor) can verify the registry exists |

---

## Common errors & fixes

| Error | Fix |
|---|---|
| `MetaMask is not connecting` | Make sure the extension is installed and unlocked, then reload the page |
| `Wrong network` banner appears | Click the "Switch to Sepolia" button — MetaMask will pop up |
| `Insufficient funds` | Faucet rate-limited; try Alchemy or Chainlink faucet (links above) |
| Remix says "compiler error" | Check Solidity version is 0.8.20+ |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then run `npm install` again |
| `WalletConnect projectId required` | You forgot Step 4 — paste the project ID into `.env.local` |
