import { describe, expect, it } from "vitest";
import { performFaceSwap } from "./replicateService";

describe("Face Swap Integration", () => {
  it("should have Replicate API configured", () => {
    expect(process.env.REPLICATE_API_TOKEN).toBeDefined();
    expect(process.env.REPLICATE_API_TOKEN?.startsWith("r8_")).toBe(true);
  });

  // This test requires actual API call and takes time
  // Run manually with: pnpm test faceswap.integration.test.ts
  it.skip("should perform face swap successfully", async () => {
    const result = await performFaceSwap({
      sourceImageUrl: "https://replicate.delivery/pbxt/KJRjMKb4hhNVqjJW3WLVWBfXRJDCJgvPPKCPPJKKdkFkKMJO/out-0.png",
      targetMediaUrl: "https://replicate.delivery/pbxt/KJRjMKb4hhNVqjJW3WLVWBfXRJDCJgvPPKCPPJKKdkFkKMJO/out-0.png",
      targetMediaType: "image",
    });

    expect(result.success).toBe(true);
    expect(result.outputUrl).toBeDefined();
  }, 60000); // 60 second timeout
});
