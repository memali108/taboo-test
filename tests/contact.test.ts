import { describe, it, expect } from "vitest";
import { normalizeEmail, isValidEmail } from "@/lib/contact";

describe("email normalisation", () => {
  it("lowercases and trims so repeat submissions de-dup", () => {
    expect(normalizeEmail("  Jane.Doe@Example.COM ")).toBe("jane.doe@example.com");
    expect(normalizeEmail("JANE@EXAMPLE.COM")).toBe(normalizeEmail("jane@example.com"));
  });

  it("validates shape", () => {
    expect(isValidEmail("jane@example.com")).toBe(true);
    expect(isValidEmail("jane@example")).toBe(false);
    expect(isValidEmail("not an email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("accepts the shapes real addresses take", () => {
    for (const ok of [
      "jane.doe@example.com",
      "jane+tag@example.co.uk",
      "j@example.io",
      "jane_doe-1@sub.domain.example.com",
      "o'brien@example.com",
    ]) {
      expect(isValidEmail(ok), ok).toBe(true);
    }
  });

  it("rejects the typos the old pattern let through", () => {
    for (const bad of [
      "a@b..com", // consecutive dots
      ".jane@example.com", // leading dot in the local part
      "jane.@example.com", // trailing dot in the local part
      "jane@-example.com", // domain label starts with a hyphen
      "jane@example-.com", // domain label ends with a hyphen
      "jane@example.c0m", // digit in the TLD
      "jane@example.c", // single-character TLD
      "jane doe@example.com", // space
      "jane@@example.com", // two @
      "jane@example.com.", // trailing dot
      `${"a".repeat(65)}@example.com`, // local part over 64 characters
      `jane@${"a".repeat(250)}.com`, // over 254 characters
    ]) {
      expect(isValidEmail(bad), bad).toBe(false);
    }
  });
});
