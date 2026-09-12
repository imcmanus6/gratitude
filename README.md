> Database update: Gratitude Circles now runs on its separate Supabase PostgreSQL project. See [migration and deployment notes](docs/SUPABASE-MIGRATION.md). Earlier SQLite descriptions below apply to the legacy prototype/test fixture, not the running app. Supabase Auth and Storage have not yet replaced the existing server authentication and image implementation.

# Gratitude Circles by NAI

A working, mobile-friendly Next.js app with the original Meditate NAI logo, white backgrounds, restrained greys, shared circles, private journaling and live gratitude sessions. This is a local first release, not a deployed service.

## Run

Requires Node.js 22 or newer and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3005. Create an account or choose **Explore the demo**. Each demo creates its own isolated sample circles and people. Ordinary accounts begin empty.

```sh
npm run typecheck
npm test
npm run build
npm start
```

With the app running, `npx playwright test` runs browser and HTTP integration tests. The configuration uses installed Google Chrome. Desktop/mobile screenshots are written to `artifacts/`.

## Implemented

- Sign-up, sign-in, sign-out, hashed passwords, expiring HTTP-only session cookies and profile names.
- Apple/Google/Facebook OAuth signup and login, plus linking in Settings. Provider buttons activate after credentials are configured; see [social sign-in setup](docs/SOCIAL-SIGN-IN.md).
- Author-only share cards: preview/edit a gratitude excerpt, download a PNG or use the device sharing menu for Instagram/Facebook. No automatic posting or public private-post links.
- Private, invitation-only family, friends, partners, work, community and custom circles.
- Invite-link/code joining, circle preview, invitation rotation, circle selection, member counts and leaving as a member.
- Chronological shared feed, a private journal, own-post filtering, search and a searchable memory view.
- Text gratitude, optional JPEG/PNG/WebP photo, audience choice and local draft recovery.
- Dictation beside the text box converts speech to text where supported. Voice-note recording, uploading, attachment and playback are disabled. Existing audio records are retained but no longer served.
- Heart/appreciation toggles, comments, own-comment deletion, author text editing, author/organiser post deletion, reporting and hiding a person's content.
- Custom prompts, a prompt library, quantity, daily/weekly frequency, day, time and IANA time zone.
- In-app reminders while the app is open; per-circle mute. Recurring `.ics` calendar reminders work outside the app after the member imports them into a calendar. No push or email delivery is claimed.
- Host-started live sessions, shared prompt, private/shared capture, closing reflections and grouped session records. Session state refreshes every 20 seconds while the page is visible.
- Export of the current user's entries as JSON (text and media references).
- Server-enforced circle/private visibility, including media access; strangers and former members cannot access circle content.

## Persistence

SQLite and media are stored in `.data/gratitude.sqlite`, outside version control. Set `GRATITUDE_DATA_DIR` to choose a different **persistent local disk** location. Back up the SQLite database with SQLite's backup facilities. Do not copy only the main file while it is writing in WAL mode.

This deployment model needs one long-running Node server with durable disk. It is not configured for ephemeral serverless hosting. A localhost invitation works only on this computer; remote participants need a shared hosted URL.

## Remaining product/design-board work

The Nai board contains a larger product roadmap than this initial app. These are not yet implemented:

- Slack/Teams installation, message publishing and channel mapping.
- Push/email delivery, reminder inbox, snooze, quiet hours, exceptions and multiple schedules.
- Email verification, password recovery and production abuse/rate-limit infrastructure.
- Co-hosts, membership management, archive/delete circle, invite approval and QR invitations.
- Facilitator-only/ephemeral audiences, speaking order/presence and reusable facilitator programmes.
- Voice notes are intentionally unsupported; browser dictation writes text instead.
- Photo mosaics, anniversaries, complete media export, annual/printed books and workplace insights.
- Reporting review console: reports are stored for an app administrator but are not automatically reviewed or notified.
- Billing/paywalls: intentionally absent, following the free-launch decision.

No external messages are sent and no service credentials from Meditate are copied.

## Source and design provenance

Reused directly from `/Users/ianmcmanus/Via Projects/Meditation App/medititation-main`:

- `components/logo.tsx` and both original raster NAI marks.
- `components/nai-lockup.tsx`, `lib/brand.ts` (product name changed), `lib/utils.ts`.
- Radix dialog and button UI components.
- Tailwind typography/token configuration, PostCSS configuration and TypeScript foundations.
- The Next.js/React architecture and dependency versions used in Meditate.

The white token palette adapts Meditate's black/white/grey system. The gratitude-specific UI, API and database are new. Meditation generation, audio-player-specific native code, payments, owner overrides and production credentials were not copied because they do not serve this app's workflows.

Requirements were recovered from the original creation of the [Nai Gratitude Circles design board](https://app.brief-ly.com/briefs/08fa44b1-48f4-49bb-b509-bbcb411f6048) in the **Design gratitude circle app** task, including the subsequent completely-free-launch change. Live Briefly reads timed out during this build, so newer changes to that board could not be verified.

### Feed-first navigation

The signed-in home is a single feed. All visible gratitudes are shown newest first, including personal thank-yous, circle and public posts. The home feed has no filter toolbar; search remains in the journal. Circles, sessions and settings live in the menu. My journal combines the author's private and shared entries; original audiences remain unchanged. A gratitude can target multiple circles through `post_circles`, with one feed entry, or explicitly target Public (visible to signed-in users). Existing private entries are never made public. Demo accounts remain isolated from the live public feed.

NAI founding-supporter cards appear periodically in the main feed. Sponsorship booking is a labelled coming-soon interaction, not a payment checkout.

### Personal thank-yous and continuous cards

The left menu contains navigation; the logo on the right opens account settings and logout. Feed cards place the author and actions on the background with no repeated heading or tagline. “Send gratitude” addresses a new private card to the author of an accessible post. The server resolves that recipient from the source post, checks blocking, and limits direct-card and media access to sender/recipient. Received cards appear chronologically alongside other gratitudes. Existing comments remain accessible on cards that already have comments. Sending to email addresses and signup invitations is not implemented.

### Profiles, replies and invitations

Tap an author name/avatar to open their public-post profile. The curved reply arrow on a card and “Send gratitude” on a profile open the same composer with an @name prefill. Addressed gratitude defaults to private and can explicitly be made Public; recipient identity is derived server-side from the accessible source post. Profile invitations are available for circles you own. Recipients see pending invitations in the left menu and must accept before membership is created; an unrelated account cannot respond on their behalf.

### Account deletion

Settings includes optional departure feedback with Skip, an export containing owned posts/comments and base64 media, owned-circle transfer/deletion choices, identity verification and typed DELETE confirmation. Password verification is checked immediately; connected-provider verification is session-bound and valid for five minutes, matching an already linked provider subject without creating a new link. Live OAuth verification still requires provider configuration. Demo deletion does not require a password.

Deletion is transactional: own posts/media and social identities/sessions are removed; other authors’ cross-posted/public/private content is preserved when a circle is deleted. Other members’ circle-only content and sessions in a deleted circle are removed after the explicit warning. Incoming addressed posts lose the recipient reference and remain available to their authors. Departure feedback is separate, without a user ID; expired feedback is purged on the next account endpoint request/deletion after 30 days. No scheduled backup retention or restore-time deletion reconciliation is configured; deployment must define this. Provider-side connected-app listings and externally downloaded copies cannot be removed by deleting local records.

### Complimentary paid access

All existing and new accounts receive ad-free access by default, without billing or a subscription. Settings explains the complimentary access. Sponsor card designs, copy and links remain intact; set `GRATITUDE_COMPLIMENTARY_PAID_ACCESS=false` and restart to show them again.

AI image creation is already enabled for every registered account when `OPENAI_API_KEY` is configured. Existing limits remain 5 requests per account and 50 across the app per rolling 24 hours. Demo visitors see the ad-free preview but must create an account to generate images. The private `gratitude.image_generations` table records requests and completion status for evaluating uptake; `uploads.generated` identifies generated assets used by posts. No additional tracking service is introduced.
