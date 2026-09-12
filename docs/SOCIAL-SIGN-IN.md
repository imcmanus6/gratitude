# Apple and Google sign-in

Current product supports Apple and Google only. Facebook entry routes and buttons are disabled; any Facebook details below document the retained legacy integration, not launch setup. Email/password confirmation and recovery are documented in EMAIL-AUTH.md.

The integration code is implemented. Real authentication remains disabled until this app has its own provider credentials and registered callback URLs. No credentials were copied from Meditate.

## Local configuration

Create `.env.local` (ignored by git) using the variables in `.env.example`. Never use `NEXT_PUBLIC_` for a client secret, and do not put secrets in chat, source control or the browser.

- `AUTH_ORIGIN`: the exact app origin, initially `http://localhost:3005`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: credentials for a Google OAuth web application.
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`: credentials for a Meta app with Facebook Login.
- `FACEBOOK_GRAPH_VERSION`: the supported Graph API version selected in that Meta app's dashboard, including the leading `v`. It is explicit configuration rather than an assumed latest version.

Restart the server after adding them. Each button enables independently when its required configuration is present.

## Apple setup

The web flow is implemented, including Hide My Email/private relay addresses. Activation requires an Apple Developer account with:

1. A primary App ID with **Sign in with Apple** enabled.
2. A **Services ID** associated with that App ID for this website.
3. A registered HTTPS domain and exact return URL: `https://YOUR-DOMAIN/api/auth/social/apple/callback`. Apple does not accept localhost or IP-address return URLs. Set `AUTH_ORIGIN` to this HTTPS origin; update the other providers' registered callbacks to match.
4. A Sign in with Apple `.p8` private key, its Key ID and your Team ID.

Set `APPLE_SERVICES_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY` in `.env.local`. The private key can be a quoted PEM string with escaped `\n` newlines. It stays server-side. The server signs a five-minute ES256 client secret on demand, avoiding a manually maintained long-lived secret.

Apple returns the display name only on first authorization. We save it when creating the account, preserve it on later sign-ins, and let the user edit it in Settings. Identity is keyed by Apple's subject ID, so Hide My Email works without exposing a real email address or silently merging accounts. If email delivery is added, register authorised sending domains with Apple's private email relay service.

The callback supports Apple's cross-site `form_post`: a short-lived Secure, HttpOnly, SameSite=None flow cookie binds the response to the initiating browser. The server exchanges a single-use, two-minute receipt for a same-site GET before account linking, so the main login cookie remains SameSite=Lax. The receipt URL does not contain the authorization code, name or email. Apple ID tokens are verified against Apple's signing keys, issuer, audience, expiry and nonce. Refresh/access tokens are not retained.

This change implements web authentication. A future App Store build still needs its own native Sign in with Apple capability and AuthenticationServices flow, with server verification for the native bundle ID. It does not make the app an App Store submission. Account-deletion/token-revocation and Apple server notification handling remain release work.

Validation includes real locally signed JWT tests for signature, audience, nonce and expiry rejection; client-secret signatures; browser-bound single-use POST receipts; and persistence of first-login names and relay identities. Live Apple consent/login still awaits the developer credentials and registered HTTPS domain.

- [Configure Sign in with Apple for the web](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web)
- [Apple authorization responses](https://developer.apple.com/documentation/signinwithapplerestapi/request-an-authorization-to-the-sign-in-with-apple-server.)
- [Apple token validation](https://developer.apple.com/documentation/signinwithapplerestapi/generate-and-validate-tokens)

## Google setup

In Google Cloud / Google Auth Platform:

1. Set up the app branding, audience and contact details.
2. Create an OAuth client with application type **Web application**.
3. Add the exact authorised redirect URI:
   `http://localhost:3005/api/auth/social/google/callback`
4. If the app is in testing, add test users as needed.
5. For deployment, register the equivalent HTTPS callback for the real app domain and set `AUTH_ORIGIN` to that domain.

Only `openid email profile` is requested. The server uses an authorization-code flow with PKCE, verifies Google's ID token with the official `google-auth-library`, and checks the nonce. No Google API refresh/access tokens are retained.

Use a regular browser for live Google sign-in; embedded app webviews may be refused by Google's OAuth policies. This is a web app integration, not a native mobile OAuth flow.

## Facebook setup

In the Meta app dashboard:

1. Configure Facebook Login for the web app and the appropriate use case.
2. Register the exact valid OAuth redirect URI:
   `http://localhost:3005/api/auth/social/facebook/callback`
   If the Meta dashboard requires HTTPS for your setup, use an HTTPS development domain and change `AUTH_ORIGIN` and both callback registrations to match.
3. Add developer/tester accounts for development-mode testing.
4. Supply the app's public privacy-policy and data-deletion URLs and any other dashboard requirements before making the provider app public. These public policy/deletion surfaces are not supplied by this change.
5. Register the production HTTPS domain/callback and complete the dashboard's permission/review requirements before general availability.

Only `public_profile,email` is requested. Facebook may omit email; login still works using its stable app-scoped account ID. The token is exchanged server-side; profile requests use an app-secret proof. Facebook access tokens are not retained and no publishing permissions are requested.

## Returning users and existing accounts

- Provider account IDs are the identity key, not an email address.
- Returning users reach their existing circles and journal.
- A social login whose email matches an existing account is **not automatically merged**. The user signs in with their existing method, then chooses **Connect Google/Facebook** in Settings.
- Account linking requires the same authenticated app session at both the start and callback, and cannot reassign an identity belonging to another account.
- Circle invitation links survive the OAuth round trip.
- OAuth state is random, hashed in SQLite, bound to an HTTP-only browser cookie, provider-specific, single-use and expires after ten minutes. Google also uses PKCE and a nonce.
- Error messages do not include provider responses, authorization codes, secrets or tokens.

## Sharing is separate from sign-in

Facebook Login does not provide a general permission to publish to an individual's Facebook/Instagram account. Meta's Instagram publishing APIs target professional accounts.

An author's **Share image** action instead prepares a local 1080×1350 PNG of their chosen words and the NAI mark. They preview/edit the text, then deliberately save the image or use their device's file-sharing menu. Instagram/Facebook availability in that menu depends on the browser, operating system and installed apps; a download-and-upload path is always available.

This does not create a public URL for a private post, include other members' names/comments, or post automatically. No social account is required to export an image.

## Validation and remaining activation checks

Automated checks cover state binding/replay/expiry, provider mismatch, safe return paths, stable identities, email-collision handling and authenticated linking. The Facebook token/profile exchange is tested with mocked provider responses. Browser tests cover unavailable-provider messaging, the email fallback, cancellation, invitation preservation and PNG export of the author's own private entry.

Real Apple/Google/Facebook login, consent screens and general-public access still need validation after configuring the real apps. Actual posting through another phone app is controlled by that app and has not been tested here.

## Official references

- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [Google token validation](https://developers.google.com/identity/sign-in/web/backend-auth)
- [Google sign-in branding](https://developers.google.com/identity/branding-guidelines)
- [Google OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies)
- [Facebook Login manual flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/)
- [Meta Instagram API collection](https://www.postman.com/meta/instagram/folder/u4g5a2a/instagram-api-with-facebook-login)

The Google logo asset is taken from Google's official branding page (`https://developers.google.com/static/identity/images/g-logo.png`). Provider marks retain their colours while the app itself remains monochrome.
