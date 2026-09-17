import type { BadgeMetadata } from "@/lib/metadata";
import { canonicalMetadataJson } from "@/lib/metadata";

/**
 * Optional IPFS pinning via Pinata.
 *
 * With PINATA_JWT set, badge metadata is pinned and tokenURI becomes
 * ipfs://<cid>, so a badge outlives our domain. Without it we fall back to
 * serving metadata ourselves — which is why the mint also writes a keccak256
 * of the document on chain: the metadata stays tamper-evident either way.
 */
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export function ipfsConfigured(): boolean {
  return Boolean(PINATA_JWT);
}

/**
 * Pins the canonical document and returns its ipfs:// URI, or null if pinning
 * is off or the service is unreachable. Never throws: a pinning outage must
 * not block badge issuance, it only downgrades tokenURI to our own URL.
 */
export async function pinBadgeMetadata(
  badgeId: string,
  metadata: BadgeMetadata
): Promise<string | null> {
  if (!PINATA_JWT) return null;

  try {
    const res = await fetch(PINATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`
      },
      // The pinned bytes must be the canonical document, otherwise the
      // on-chain content hash would not match what IPFS serves.
      body: JSON.stringify({
        pinataMetadata: { name: `tedu-pass-badge-${badgeId}` },
        pinataContent: JSON.parse(canonicalMetadataJson(metadata))
      }),
      signal: AbortSignal.timeout(15_000)
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { IpfsHash?: string };
    return json.IpfsHash ? `ipfs://${json.IpfsHash}` : null;
  } catch {
    return null;
  }
}
