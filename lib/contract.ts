import type { Address } from "viem";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;

export const SEPOLIA_ETHERSCAN = "https://sepolia.etherscan.io";

export const txUrl = (hash: string) => `${SEPOLIA_ETHERSCAN}/tx/${hash}`;
export const addressUrl = (addr: string) => `${SEPOLIA_ETHERSCAN}/address/${addr}`;

export const DONOTTRAIN_ABI = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sha256Hash", type: "bytes32" },
      { name: "pHash", type: "bytes8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isRegistered",
    stateMutability: "view",
    inputs: [{ name: "sha256Hash", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "getRegistration",
    stateMutability: "view",
    inputs: [{ name: "sha256Hash", type: "bytes32" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "blockNumber", type: "uint256" },
      { name: "pHash", type: "bytes8" },
    ],
  },
  {
    type: "function",
    name: "findSimilar",
    stateMutability: "view",
    inputs: [
      { name: "queryPHash", type: "bytes8" },
      { name: "maxDistance", type: "uint8" },
    ],
    outputs: [{ type: "bytes32[]" }],
  },
  {
    type: "function",
    name: "totalRegistrations",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "HashRegistered",
    inputs: [
      { name: "sha256Hash", type: "bytes32", indexed: true },
      { name: "pHash", type: "bytes8", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "blockNumber", type: "uint256", indexed: false },
    ],
  },
  { type: "error", name: "AlreadyRegistered", inputs: [] },
  { type: "error", name: "NotRegistered", inputs: [] },
  { type: "error", name: "HammingDistanceTooLarge", inputs: [] },
] as const;
