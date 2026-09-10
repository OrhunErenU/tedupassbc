import { publicClient, BADGE_ABI, badgeRef, TEDU_PASS_ADDRESS, chainConfigured } from "@/lib/chain";

export type BadgeChainRecord =
  | { state: "unconfigured" }
  /** Contract reachable, but this badge has no token — not minted (yet). */
  | { state: "absent" }
  | {
      state: "present";
      tokenId: string;
      owner: string;
      locked: boolean;
      /** Owner on chain matches the wallet we recorded for the student. */
      ownerMatches: boolean;
    }
  /** The node could not be reached; we say so rather than implying "not minted". */
  | { state: "unreachable" };

/**
 * Read a badge straight off the contract.
 *
 * The verification page used to show only what our own database said, which is
 * exactly the claim an employer is trying to check independently. Reading
 * badgeRefToToken (plus ownerOf / locked) means the page proves the token
 * really exists on chain and belongs to the wallet we claim.
 */
export async function readBadgeChainRecord(
  badgeId: string,
  expectedOwner: string | null
): Promise<BadgeChainRecord> {
  if (!chainConfigured() || !TEDU_PASS_ADDRESS) return { state: "unconfigured" };

  try {
    const tokenId = await publicClient.readContract({
      address: TEDU_PASS_ADDRESS,
      abi: BADGE_ABI,
      functionName: "badgeRefToToken",
      args: [badgeRef(badgeId)]
    });

    if (tokenId === 0n) return { state: "absent" };

    const [owner, locked] = await Promise.all([
      publicClient.readContract({
        address: TEDU_PASS_ADDRESS,
        abi: BADGE_ABI,
        functionName: "ownerOf",
        args: [tokenId]
      }),
      publicClient.readContract({
        address: TEDU_PASS_ADDRESS,
        abi: BADGE_ABI,
        functionName: "locked",
        args: [tokenId]
      })
    ]);

    return {
      state: "present",
      tokenId: tokenId.toString(),
      owner,
      locked,
      ownerMatches: Boolean(expectedOwner) && owner.toLowerCase() === expectedOwner!.toLowerCase()
    };
  } catch {
    return { state: "unreachable" };
  }
}
