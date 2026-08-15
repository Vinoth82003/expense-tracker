import { describe, it, expect } from "vitest";
import { sanitizePii } from "@/lib/pii";

describe("sanitizePii", () => {
  it("returns empty string for falsy input", () => {
    expect(sanitizePii("")).toBe("");
    expect(sanitizePii(null)).toBe("");
    expect(sanitizePii(undefined)).toBe("");
  });

  it("redacts emails", () => {
    expect(sanitizePii("contact me at john.doe@example.com please"))
      .toBe("contact me at [EMAIL] please");
  });

  it("redacts phone numbers (10-14 digits)", () => {
    expect(sanitizePii("call 9876543210 now")).toBe("call [PHONE] now");
    expect(sanitizePii("phone +91 9876543210 ok")).toContain("[PHONE]");
  });

  it("redacts card numbers (13-16 digits, spaces or dashes allowed)", () => {
    expect(sanitizePii("card 4111111111111111 ok")).toBe("card [CARD] ok");
    expect(sanitizePii("card 4111 1111 1111 1111 ok")).toBe("card [CARD] ok");
    expect(sanitizePii("card 4111-1111-1111-1111 ok")).toBe("card [CARD] ok");
  });

  it("leaves normal text untouched", () => {
    const note = "lunch with team at cafe";
    expect(sanitizePii(note)).toBe(note);
  });

  it("does not redact short numbers (amounts)", () => {
    expect(sanitizePii("spent 750 on groceries")).toBe("spent 750 on groceries");
  });
});
