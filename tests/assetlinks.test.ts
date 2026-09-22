import test from "node:test";
import assert from "node:assert/strict";

test("asset links reflect the configured Android fingerprints", async () => {
  const original = process.env.ANDROID_ASSETLINKS_SHA256;
  const { GET } = await import("../app/.well-known/assetlinks.json/route");
  try {
    process.env.ANDROID_ASSETLINKS_SHA256 = "AA:BB:CC, DD:EE:FF";
    const configured = await GET();
    assert.deepEqual(await configured.json(), [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "net.iskind.gratitude",
          sha256_cert_fingerprints: ["AA:BB:CC", "DD:EE:FF"],
        },
      },
    ]);
    assert.equal(
      configured.headers.get("Cache-Control"),
      "public, max-age=3600",
    );
    assert.equal(configured.headers.get("Content-Type"), "application/json");

    delete process.env.ANDROID_ASSETLINKS_SHA256;
    const unconfigured = await GET();
    assert.deepEqual(await unconfigured.json(), []);
  } finally {
    if (original === undefined) delete process.env.ANDROID_ASSETLINKS_SHA256;
    else process.env.ANDROID_ASSETLINKS_SHA256 = original;
  }
});
