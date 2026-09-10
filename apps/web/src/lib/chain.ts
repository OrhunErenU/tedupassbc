import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toBytes,
  type Address,
  type Hex
} from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const PK = process.env.SERVER_WALLET_PRIVATE_KEY;
const CONTRACT = process.env.TEDU_PASS_CONTRACT_ADDRESS as Address | undefined;

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL)
});

export const serverAccount = PK ? privateKeyToAccount(PK as Hex) : null;

export const serverWallet = serverAccount
  ? createWalletClient({
      account: serverAccount,
      chain: baseSepolia,
      transport: http(RPC_URL)
    })
  : null;

export const TEDU_PASS_ADDRESS = CONTRACT;

export const BADGE_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "uri", type: "string" },
      { name: "badgeRef", type: "bytes32" }
    ],
    outputs: [{ name: "tokenId", type: "uint256" }]
  },
  {
    type: "function",
    name: "batchMint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipients", type: "address[]" },
      { name: "uris", type: "string[]" },
      { name: "badgeRefs", type: "bytes32[]" }
    ],
    outputs: [{ name: "tokenIds", type: "uint256[]" }]
  },
  {
    type: "function",
    name: "badgeRefToToken",
    stateMutability: "view",
    inputs: [{ name: "badgeRef", type: "bytes32" }],
    outputs: [{ name: "tokenId", type: "uint256" }]
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "owner", type: "address" }]
  },
  {
    type: "function",
    name: "locked",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  },
  {
    // Emitted once per minted badge. batchMint settles a whole cohort in one
    // transaction, so the receipt logs are the only way to learn which tokenId
    // belongs to which badge.
    type: "event",
    name: "BadgeMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "badgeRef", type: "bytes32", indexed: true },
      { name: "tokenURI", type: "string", indexed: false }
    ]
  }
] as const;

export function badgeRef(badgeId: string): Hex {
  return keccak256(toBytes(badgeId));
}

export function chainConfigured(): boolean {
  return Boolean(serverWallet && TEDU_PASS_ADDRESS);
}

export type ChainStatus =
  | { configured: true; address: Address; minter: Address; rpcUrl: string }
  | { configured: false; missing: string[] };

/**
 * Why the chain is or is not usable.
 *
 * The panels used to fall back to "queued" with no explanation when the
 * contract address or server key was missing, so a club could run a whole
 * event believing badges were being issued. Every surface that can mint now
 * reads this and says plainly that nothing is going on chain.
 */
export function chainStatus(): ChainStatus {
  const missing: string[] = [];
  if (!PK) missing.push("SERVER_WALLET_PRIVATE_KEY");
  if (!CONTRACT) missing.push("TEDU_PASS_CONTRACT_ADDRESS");
  if (missing.length > 0 || !serverAccount || !TEDU_PASS_ADDRESS) {
    return { configured: false, missing };
  }
  return {
    configured: true,
    address: TEDU_PASS_ADDRESS,
    minter: serverAccount.address,
    rpcUrl: RPC_URL
  };
}
