import { describe, expect, it } from "vitest";
import { isReplicateConfigured } from "./replicateService";

describe("Replicate API Configuration", () => {
  it("should have REPLICATE_API_TOKEN configured", () => {
    expect(isReplicateConfigured()).toBe(true);
    expect(process.env.REPLICATE_API_TOKEN).toBeDefined();
    expect(process.env.REPLICATE_API_TOKEN).not.toBe("");
  });

  it("should have valid Replicate API token format", () => {
    const token = process.env.REPLICATE_API_TOKEN;
    expect(token).toBeDefined();
    // Replicate tokens start with 'r8_'
    expect(token?.startsWith("r8_")).toBe(true);
  });
});
