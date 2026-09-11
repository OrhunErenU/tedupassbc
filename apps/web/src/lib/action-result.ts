/**
 * Result type for server actions whose failure message is meant for the user.
 *
 * Next.js strips the message from any error a server action *throws* in a
 * production build and sends the client only an opaque digest — so guidance
 * like "Sadece @tedu.edu.tr adresleri eklenebilir" never reaches the person who
 * needs it. Returned values are not stripped, so expected failures (validation,
 * a refused operation we want to explain) come back as data.
 *
 * Throwing is still right for the unexpected: a missing session, a caller with
 * no business calling at all, a database that is down.
 */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

export function actionOk(): ActionResult;
export function actionOk<T>(data: T): ActionResult<T>;
export function actionOk<T>(data?: T): ActionResult<T> {
  return { ok: true, data } as ActionResult<T>;
}

export function actionError(error: string): ActionResult<never> {
  return { ok: false, error };
}
