import "server-only";

import { isTrustedInternalRequest } from "@/lib/internal-api-auth";
import { ENTRY_SOURCE, type EntrySource } from "@/lib/transaction-source";

/**
 * Server-only half of transaction provenance. See `lib/transaction-source.ts`
 * for the values and the reasoning behind deriving provenance server-side.
 *
 * This lives apart from the shared module because resolving a request requires
 * the internal API secret, which transitively imports `next-auth` and the
 * mailer. Client components import the shared module for labels and
 * normalisation, so anything imported from here would drag Node-only code
 * (and the mail transport) into the browser bundle.
 */

/**
 * Resolve the provenance for a transaction being created through an HTTP route.
 *
 * There are two distinct callers of `POST /api/expenses` and `POST /api/income`:
 *
 *   1. The browser, driving the add-expense / add-income forms. The user typed
 *      this in, so it is MANUAL.
 *   2. `lib/chat/v2/engine.ts`, which reaches the same routes through
 *      `lib/chat/v1/api-gateway.ts` using a signed internal header. That is
 *      Sage, so it is SAGE.
 *
 * The two are told apart by the verified internal API secret rather than by a
 * client-supplied field, so a browser request cannot claim to be Sage.
 */
export const resolveEntrySource = (request: Request): EntrySource =>
  isTrustedInternalRequest(request) ? ENTRY_SOURCE.SAGE : ENTRY_SOURCE.MANUAL;