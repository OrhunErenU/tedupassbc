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
  }
] as const;

export function badgeRef(badgeId: string): Hex {
  return keccak256(toBytes(badgeId));
}

export function chainConfigured(): boolean {
  return Boolean(serverWallet && TEDU_PASS_ADDRESS);
}
