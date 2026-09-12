import test from "node:test";
import assert from "node:assert/strict";
import { generateGratitudeBackground } from "../lib/image-generation";
test("image generation sends edited context server-side and rejects invalid images", async () => {
  const originalFetch = global.fetch,
    originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only";
  try {
    global.fetch = async (url, init) => {
      assert.equal(url, "https://api.openai.com/v1/images/generations");
      const payload = JSON.parse(init!.body as string);
      assert.match(payload.prompt, /A quiet walk/);
      assert.equal(payload.output_format, "jpeg");
      return Response.json({
        data: [
          { b64_json: Buffer.from([255, 216, 255, 0]).toString("base64") },
        ],
      });
    };
    assert.equal(
      (await generateGratitudeBackground("A quiet walk", "photo")).length,
      4,
    );
    global.fetch = async () =>
      Response.json({
        data: [{ b64_json: Buffer.from("not an image").toString("base64") }],
      });
    await assert.rejects(
      async () => await generateGratitudeBackground("A quiet walk", "photo"),
      /could not be saved/,
    );
    global.fetch = async () => new Response("", { status: 429 });
    await assert.rejects(
      async () => await generateGratitudeBackground("A quiet walk", "photo"),
      /busy/,
    );
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
