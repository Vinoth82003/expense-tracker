/**
 * SHARED EMAIL-JOB LIFECYCLE VOCABULARY (spec 14 — cross-page mail health)
 *
 * Notifications, System Logs, Overview and System Health must all describe the
 * same email job the same way. Historically they each invented their own
 * phrasing ("Success", "Sent", "Delivered"), which is how a campaign whose SMTP
 * connection merely timed out could be shown as a success.
 *
 * Deliberate rules encoded here:
 *   - `queued` means accepted for processing, never delivered.
 *   - `SENT` / legacy `SUCCESS` means the mail provider ACCEPTED the message.
 *     It is not a delivery confirmation.
 *   - `delivery_confirmed` is reserved for an independent provider signal (DSN).
 *   - a retry is the same logical message; it must never read as a new one.
 *
 * This module is intentionally dependency-free (no Prisma, no `server-only`) so
 * both server routes and client components can render identical wording.
 */

export type EmailLifecycle =
  | "draft"
  | "validated"
  | "queued"
  | "processing"
  | "sent"
  | "delivery_confirmed"
  | "partial"
  | "retry_scheduled"
  | "failed"
  | "unknown";

export type LifecycleTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface LifecycleDescriptor {
  key: EmailLifecycle;
  /** Human label shown on Notifications / Overview / Logs. */
  label: string;
  tone: LifecycleTone;
  /** One-line explanation disambiguating accepted vs delivered. */
  description: string;
  /** True once the job will not change state without a new attempt. */
  terminal: boolean;
}

export const DEFAULT_MESSAGE_TYPE = "ANNOUNCEMENT";

/** A job left in a non-terminal state longer than this reads as "stuck". */
export const MAIL_JOB_STALE_MS = 15 * 60 * 1000;

const DESCRIPTORS: Record<EmailLifecycle, Omit<LifecycleDescriptor, "key">> = {
  draft: {
    label: "Draft",
    tone: "neutral",
    description: "Composed but not yet validated or sent.",
    terminal: false,
  },
  validated: {
    label: "Validated",
    tone: "neutral",
    description: "Inputs checked; not yet accepted for processing.",
    terminal: false,
  },
  queued: {
    label: "Queued",
    tone: "info",
    description: "Accepted for processing — not delivered.",
    terminal: false,
  },
  processing: {
    label: "Processing",
    tone: "info",
    description: "Sending in progress; no terminal outcome yet.",
    terminal: false,
  },
  sent: {
    label: "Sent",
    tone: "success",
    description:
      "Accepted by the mail provider. Delivery is not independently confirmed.",
    terminal: true,
  },
  delivery_confirmed: {
    label: "Delivery confirmed",
    tone: "success",
    description: "The provider returned independent delivery evidence (DSN).",
    terminal: true,
  },
  partial: {
    label: "Partial",
    tone: "warning",
    description: "Some recipients were accepted; some failed.",
    terminal: true,
  },
  retry_scheduled: {
    label: "Retry scheduled",
    tone: "warning",
    description: "A previous attempt failed and another is scheduled. Same message.",
    terminal: false,
  },
  failed: {
    label: "Failed",
    tone: "danger",
    description: "No recipient was accepted by the provider.",
    terminal: true,
  },
  unknown: {
    label: "Unknown",
    tone: "neutral",
    description: "Legacy or unrecognised state.",
    terminal: false,
  },
};

/**
 * Maps a stored Notification.status value onto the shared lifecycle, folding in
 * the `deliveryConfirmed` evidence flag. Legacy "SUCCESS" rows are read as
 * "sent" (accepted), never as delivered.
 */
export function describeNotificationStatus(
  status: string | null | undefined,
  opts?: { deliveryConfirmed?: boolean | null; attempts?: number | null }
): LifecycleDescriptor {
  const raw = (status ?? "").trim().toUpperCase();
  let key: EmailLifecycle;

  switch (raw) {
    case "DRAFT":
      key = "draft";
      break;
    case "VALIDATED":
      key = "validated";
      break;
    case "QUEUED":
      key = "queued";
      break;
    case "PROCESSING":
      key = "processing";
      break;
    case "RETRY_SCHEDULED":
    case "RETRYING":
      key = "retry_scheduled";
      break;
    case "PARTIAL":
      key = "partial";
      break;
    case "FAILED":
    case "ERROR":
      key = "failed";
      break;
    case "SENT":
    case "SUCCESS":
    case "DELIVERED":
      key = opts?.deliveryConfirmed ? "delivery_confirmed" : "sent";
      break;
    default:
      key = "unknown";
  }

  const descriptor = { key, ...DESCRIPTORS[key] };

  // Surface retry context without changing the state: a sent/partial job that
  // took more than one attempt reads as "N attempts", never as new messages.
  const attempts = opts?.attempts ?? 0;
  if (attempts > 1) {
    return {
      ...descriptor,
      description: `${descriptor.description} (attempt ${attempts})`,
    };
  }
  return descriptor;
}

/** True when the lifecycle will not change without a new attempt. */
export function isTerminalStatus(status: string | null | undefined): boolean {
  return describeNotificationStatus(status).terminal;
}

/**
 * Canonical, non-throwing next-attempt counter. A retry re-uses the same logical
 * message, so this increments the attempt count rather than creating a row.
 */
export function nextAttemptCount(previous: number | null | undefined): number {
  const n = typeof previous === "number" && Number.isFinite(previous) ? previous : 0;
  return n + 1;
}

const KNOWN_SMTP_CODES = new Set([
  "ETIMEDOUT",
  "ESOCKET",
  "ECONNECTION",
  "ECONNREFUSED",
  "ECONNRESET",
  "EPROTOCOL",
  "EAUTH",
  "EENVELOPE",
  "EMESSAGE",
  "EDNS",
  "ETLS",
  "ENOAUTH",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

const EMAIL_RE = /[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/g;

/** Redacts anything that looks like an email address from a message. */
export function redactEmails(text: string): string {
  return text.replace(EMAIL_RE, "[redacted-email]");
}

/**
 * Reduces an error to a stable, sanitized machine code that never contains a
 * recipient address or a credential. Returns null when there is nothing useful.
 */
export function sanitizeEmailErrorCode(raw: unknown): string | null {
  if (raw == null) return null;

  const code =
    typeof raw === "object" && raw !== null && "code" in raw
      ? String((raw as { code?: unknown }).code ?? "")
      : "";
  const message =
    raw instanceof Error
      ? raw.message
      : typeof raw === "string"
        ? raw
        : typeof raw === "object" && raw !== null && "message" in raw
          ? String((raw as { message?: unknown }).message ?? "")
          : String(raw);

  const upper = code.trim().toUpperCase();
  if (KNOWN_SMTP_CODES.has(upper)) return upper;

  const haystack = `${code} ${message}`;

  // nodemailer often buries the code in the message (e.g. "getaddrinfo
  // ENOTFOUND smtp.example.com"); recognise a known token before heuristics.
  const haystackUpper = haystack.toUpperCase();
  for (const known of KNOWN_SMTP_CODES) {
    if (haystackUpper.includes(known)) return known;
  }

  if (/timeout|timed out/i.test(haystack)) return "ETIMEDOUT";
  if (/auth|credential|login|username and password/i.test(haystack)) return "EAUTH";
  if (/connection|connect|socket|network/i.test(haystack)) return "ECONNECTION";
  if (/envelope|recipient|rejected|mailbox|address/i.test(haystack)) return "EENVELOPE";
  if (/dns|not found|resolve/i.test(haystack)) return "ENOTFOUND";

  return message.trim() ? "SMTP_ERROR" : null;
}

/**
 * A short, human-readable failure summary with email addresses redacted and a
 * hard length cap. Safe to persist and to render.
 */
export function sanitizeEmailErrorSummary(raw: unknown, max = 300): string | null {
  if (raw == null) return null;
  const message =
    raw instanceof Error
      ? raw.message
      : typeof raw === "string"
        ? raw
        : typeof raw === "object" && raw !== null && "message" in raw
          ? String((raw as { message?: unknown }).message ?? "")
          : String(raw);
  const cleaned = redactEmails(message).replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
}

/** Back-compat helper: the correlation id of a legacy row is its own id. */
export function resolveCorrelationId(
  explicit: string | null | undefined,
  fallbackId: string | null | undefined
): string | null {
  return explicit || fallbackId || null;
}
