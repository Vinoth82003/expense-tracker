import { describe, it, expect } from "vitest";
import {
  describeNotificationStatus,
  isTerminalStatus,
  nextAttemptCount,
  redactEmails,
  sanitizeEmailErrorCode,
  sanitizeEmailErrorSummary,
  resolveCorrelationId,
  MAIL_JOB_STALE_MS,
} from "@/lib/email-jobs";

describe("email-jobs lifecycle vocabulary (spec 14)", () => {
  it("reads legacy SUCCESS as sent (provider-accepted), never delivered", () => {
    const d = describeNotificationStatus("SUCCESS");
    expect(d.key).toBe("sent");
    expect(d.label).toBe("Sent");
    expect(d.terminal).toBe(true);
    // "Sent" must never read as a delivery guarantee.
    expect(d.label).not.toBe("Delivery confirmed");
    expect(d.description).toMatch(/not independently confirmed/i);
  });

  it("only reports delivery_confirmed when the provider gave evidence", () => {
    expect(describeNotificationStatus("SUCCESS", { deliveryConfirmed: false }).key).toBe("sent");
    expect(describeNotificationStatus("SUCCESS", { deliveryConfirmed: true }).key).toBe(
      "delivery_confirmed"
    );
    expect(describeNotificationStatus("DELIVERED").key).toBe("sent");
    expect(
      describeNotificationStatus("DELIVERED", { deliveryConfirmed: true }).key
    ).toBe("delivery_confirmed");
  });

  it("distinguishes queued (accepted) from processing and terminal states", () => {
    const queued = describeNotificationStatus("QUEUED");
    expect(queued.key).toBe("queued");
    expect(queued.terminal).toBe(false);
    expect(queued.description).toMatch(/not delivered/i);

    expect(describeNotificationStatus("PROCESSING").key).toBe("processing");
    expect(describeNotificationStatus("PROCESSING").terminal).toBe(false);
    expect(describeNotificationStatus("RETRY_SCHEDULED").key).toBe("retry_scheduled");
    expect(describeNotificationStatus("RETRY_SCHEDULED").terminal).toBe(false);
    expect(describeNotificationStatus("PARTIAL").key).toBe("partial");
    expect(describeNotificationStatus("PARTIAL").terminal).toBe(true);
    expect(describeNotificationStatus("FAILED").key).toBe("failed");
    expect(describeNotificationStatus("FAILED").terminal).toBe(true);
  });

  it("treats unknown / legacy values as unknown and non-terminal", () => {
    expect(describeNotificationStatus(null).key).toBe("unknown");
    expect(describeNotificationStatus("").key).toBe("unknown");
    expect(describeNotificationStatus("SOMETHING_ELSE").key).toBe("unknown");
    expect(describeNotificationStatus("SOMETHING_ELSE").terminal).toBe(false);
  });

  it("appends attempt count without inventing a new state", () => {
    const d = describeNotificationStatus("SUCCESS", { attempts: 3 });
    expect(d.key).toBe("sent");
    expect(d.description).toMatch(/attempt 3/);
  });

  it("isTerminalStatus mirrors the descriptor", () => {
    expect(isTerminalStatus("SUCCESS")).toBe(true);
    expect(isTerminalStatus("PROCESSING")).toBe(false);
    expect(isTerminalStatus("RETRY_SCHEDULED")).toBe(false);
  });

  it("nextAttemptCount is a safe increment (retry is the same message)", () => {
    expect(nextAttemptCount(null)).toBe(1);
    expect(nextAttemptCount(undefined)).toBe(1);
    expect(nextAttemptCount(1)).toBe(2);
    expect(nextAttemptCount(4)).toBe(5);
    expect(nextAttemptCount(Number.NaN)).toBe(1);
  });

  it("sanitizes error codes to a stable, credential-free vocabulary", () => {
    expect(sanitizeEmailErrorCode(Object.assign(new Error("boom"), { code: "ETIMEDOUT" }))).toBe(
      "ETIMEDOUT"
    );
    expect(sanitizeEmailErrorCode("Connection timeout while contacting host")).toBe("ETIMEDOUT");
    expect(sanitizeEmailErrorCode("Invalid login: 535 auth failed")).toBe("EAUTH");
    expect(sanitizeEmailErrorCode("getaddrinfo ENOTFOUND smtp.example.com")).toBe("ENOTFOUND");
    expect(sanitizeEmailErrorCode(new Error("Recipient address rejected"))).toBe("EENVELOPE");
    expect(sanitizeEmailErrorCode(new Error("something vague happened"))).toBe("SMTP_ERROR");
    expect(sanitizeEmailErrorCode(null)).toBeNull();
    expect(sanitizeEmailErrorCode("")).toBeNull();
  });

  it("redacts email addresses from summaries and caps length", () => {
    expect(redactEmails("failed for bob@example.com and a@b.co")).toBe(
      "failed for [redacted-email] and [redacted-email]"
    );

    const summary = sanitizeEmailErrorSummary(
      "Delivery to someone@example.com failed: timeout"
    );
    expect(summary).not.toMatch(/@/);
    expect(summary).toMatch(/redacted-email/);

    const long = "x".repeat(500);
    const capped = sanitizeEmailErrorSummary(new Error(long), 100);
    expect(capped).not.toBeNull();
    expect((capped as string).length).toBeLessThanOrEqual(101);
  });

  it("keeps a legacy row's own id as its correlation id", () => {
    expect(resolveCorrelationId("job-1", "row-1")).toBe("job-1");
    expect(resolveCorrelationId(null, "row-1")).toBe("row-1");
    expect(resolveCorrelationId("", "row-1")).toBe("row-1");
    expect(resolveCorrelationId(null, null)).toBeNull();
  });

  it("exposes a sane stale-window constant for the health probe", () => {
    expect(MAIL_JOB_STALE_MS).toBeGreaterThan(0);
    expect(MAIL_JOB_STALE_MS).toBeLessThanOrEqual(60 * 60 * 1000);
  });
});

describe("redactEmails", () => {
  it("redacts multiple addresses and leaves the rest intact", () => {
    expect(redactEmails("a@b.co and c@d.io failed")).toBe(
      "[redacted-email] and [redacted-email] failed"
    );
    expect(redactEmails("no addresses here")).toBe("no addresses here");
  });

  it("caps a long summary at the max length", () => {
    const out = sanitizeEmailErrorSummary(`problem ${"a".repeat(400)}`, 50);
    expect(out!.length).toBeLessThanOrEqual(51);
    expect(MAIL_JOB_STALE_MS).toBeGreaterThan(0);
  });
});
