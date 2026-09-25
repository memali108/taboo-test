import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NOT_SEED, shouldDeliverWebhook } from "@/lib/seed";

describe("the seed flag", () => {
  it("keeps admin queries to real rows", () => {
    expect(NOT_SEED).toEqual({ isSeed: false });
  });

  it("never delivers a webhook for a seed attempt", () => {
    expect(shouldDeliverWebhook({ isSeed: false })).toBe(true);
    expect(shouldDeliverWebhook({ isSeed: true })).toBe(false);
  });
});

/**
 * `isE2ERequest` decides whether a row is flagged seed, which suppresses the webhook, so
 * every ambiguous case has to fail CLOSED. The dangerous direction is a real attempt
 * being marked seed and silently never mailed.
 */
describe("isE2ERequest fails closed", () => {
  const headerValue = { current: null as string | null };

  beforeEach(() => {
    vi.resetModules();
    vi.doMock("next/headers", () => ({
      headers: async () => ({ get: (k: string) => (k === "x-taboo-e2e" ? headerValue.current : null) }),
    }));
  });
  afterEach(() => {
    vi.doUnmock("next/headers");
    delete process.env.E2E_TOKEN;
    headerValue.current = null;
  });

  const load = async () => (await import("@/lib/e2e")).isE2ERequest;

  it("is false when no token is configured, whatever the header says", async () => {
    headerValue.current = "anything";
    expect(await (await load())()).toBe(false);
  });

  it("is false when the token is empty and the header is empty", async () => {
    process.env.E2E_TOKEN = "";
    headerValue.current = "";
    expect(await (await load())()).toBe(false);
  });

  it("is false for a token shorter than 16 characters, even on an exact match", async () => {
    process.env.E2E_TOKEN = "short";
    headerValue.current = "short";
    expect(await (await load())()).toBe(false);
  });

  it("is false when the header is absent", async () => {
    process.env.E2E_TOKEN = "x".repeat(32);
    headerValue.current = null;
    expect(await (await load())()).toBe(false);
  });

  it("is false for a wrong token of the same length", async () => {
    process.env.E2E_TOKEN = "a".repeat(32);
    headerValue.current = "b".repeat(32);
    expect(await (await load())()).toBe(false);
  });

  it("is true only for an exact match of a long enough token", async () => {
    const token = "e2e-" + "z".repeat(28);
    process.env.E2E_TOKEN = token;
    headerValue.current = token;
    expect(await (await load())()).toBe(true);
  });
});
