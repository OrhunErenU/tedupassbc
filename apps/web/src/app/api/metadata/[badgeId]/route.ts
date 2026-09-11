import { NextRequest, NextResponse } from "next/server";
import { buildBadgeMetadata, canonicalMetadataJson, metadataContentHash } from "@/lib/metadata";

export const runtime = "nodejs";

/**
 * Public ERC-721 metadata endpoint (used as tokenURI when IPFS is not configured).
 *
 * Serves the *canonical* serialisation byte-for-byte, so hashing the response
 * reproduces the content hash written on chain at mint time. Any other
 * formatting here would silently break that check.
 */
export async function GET(_req: NextRequest, { params }: { params: { badgeId: string } }) {
  const metadata = await buildBadgeMetadata(params.badgeId);
  if (!metadata) return NextResponse.json({ error: "not-found" }, { status: 404 });

  return new NextResponse(canonicalMetadataJson(metadata), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Lets a verifier compare without re-hashing themselves, while the
      // authoritative value stays the one on chain.
      "X-Content-Hash": metadataContentHash(metadata),
      "Cache-Control": "public, max-age=60"
    }
  });
}
