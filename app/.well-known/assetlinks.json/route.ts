import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const fingerprints = (process.env.ANDROID_ASSETLINKS_SHA256 || "")
    .split(",")
    .map((fingerprint) => fingerprint.trim())
    .filter(Boolean);
  return NextResponse.json(
    fingerprints.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: "net.iskind.gratitude",
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ]
      : [],
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
