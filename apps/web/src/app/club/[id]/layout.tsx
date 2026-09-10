import { ReactNode } from "react";
import { requireClubManagerPage } from "@/lib/auth";

/**
 * Access guard for the whole club panel — the detail page, the new-event form and
 * the event detail page (which shows attendee names, e-mails and the check-in QR).
 * Guarding here rather than per page means a new route under /club/[id] is covered
 * the moment it is added.
 */
export default async function ClubLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { id: string };
}) {
  await requireClubManagerPage(params.id);
  return <>{children}</>;
}
