import { describe, it, expect } from "vitest";

describe("schema module exists", () => {
  it("can be imported without error", async () => {
    const mod = await import("../../convex/schema");
    expect(mod.default).toBeDefined();
  });
});
