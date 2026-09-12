import { createPrivateKey } from "node:crypto";
import {
  createRemoteJWKSet,
  importPKCS8,
  jwtVerify,
  SignJWT,
  type JWTVerifyGetKey,
} from "jose";

const appleKeys = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);
export function appleCredentials() {
  const clientId = process.env.APPLE_SERVICES_ID,
    teamId = process.env.APPLE_TEAM_ID,
    keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientId || !teamId || !keyId || !privateKey)
    throw new Error("Apple is not configured.");
  const key = createPrivateKey(privateKey);
  if (
    key.asymmetricKeyType !== "ec" ||
    key.asymmetricKeyDetails?.namedCurve !== "prime256v1"
  )
    throw new Error("Invalid Apple signing key.");
  return { clientId, teamId, keyId, privateKey };
}
export async function appleClientSecret() {
  const config = appleCredentials();
  const key = await importPKCS8(config.privateKey, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: config.keyId })
    .setIssuer(config.teamId)
    .setSubject(config.clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}
export async function verifyAppleToken(
  token: string,
  clientId: string,
  nonce: string,
  keys: JWTVerifyGetKey = appleKeys,
) {
  const { payload } = await jwtVerify(token, keys, {
    issuer: "https://appleid.apple.com",
    audience: clientId,
    algorithms: ["RS256"],
    requiredClaims: ["sub", "iat", "exp", "nonce"],
  });
  if (!payload.sub || payload.nonce !== nonce)
    throw new Error("Invalid Apple identity.");
  if (
    payload.email !== undefined &&
    (typeof payload.email !== "string" ||
      (payload.email_verified !== true && payload.email_verified !== "true"))
  )
    throw new Error("Unverified Apple email.");
  return {
    subject: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}
export function appleDisplayName(user: string | undefined) {
  // Apple supplies name once, outside the signed identity token. Treat it only as editable profile text.
  if (!user || user.length > 4096) return "New friend";
  try {
    const parsed = JSON.parse(user);
    return (
      [parsed?.name?.firstName, parsed?.name?.lastName]
        .filter((value) => typeof value === "string")
        .join(" ")
        .replace(/[<>\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 60) || "New friend"
    );
  } catch {
    return "New friend";
  }
}
