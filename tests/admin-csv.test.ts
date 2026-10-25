import { describe, it, expect } from "vitest";
import { toCsv, toCsvCell } from "../lib/admin/csv";

describe("toCsvCell", () => {
  it("passes through a plain value", () => {
    expect(toCsvCell("hello")).toBe("hello");
    expect(toCsvCell(42)).toBe("42");
  });

  it("maps null and undefined to an empty cell", () => {
    expect(toCsvCell(null)).toBe("");
    expect(toCsvCell(undefined)).toBe("");
  });

  it("neutralises formula prefixes (CWE-1236)", () => {
    expect(toCsvCell("=1+1")).toBe("'=1+1");
    expect(toCsvCell("+cmd")).toBe("'+cmd");
    expect(toCsvCell("-2+3")).toBe("'-2+3");
    expect(toCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("quotes cells containing separators or quotes", () => {
    expect(toCsvCell("a,b")).toBe('"a,b"');
    expect(toCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(toCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("toCsv", () => {
  it("joins a header and rows with CRLF", () => {
    expect(toCsv(["a", "b"], [[1, 2], [3, 4]])).toBe("a,b\r\n1,2\r\n3,4");
  });

  it("escapes each cell independently", () => {
    expect(toCsv(["name", "note"], [["=2", "a,b"]])).toBe('name,note\r\n\'=2,"a,b"');
  });
});
