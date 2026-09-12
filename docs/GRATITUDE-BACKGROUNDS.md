# Visual gratitude cards

The phone feed, composer preview and PNG export share a background palette. People can choose six colours, their own uploaded photo, or the included AI woodland sample. Longer reflections expand in the feed; exports let authors choose an excerpt. Uploads retain existing private/member access controls.

“Make an image for me” starts with an editable description from the gratitude. The user explicitly creates, previews and applies the background. Only the edited description goes to OpenAI. Set server-only OPENAI_API_KEY and optionally OPENAI_IMAGE_MODEL (default gpt-image-2), then restart the server. No credentials are bundled. The demo uses the sample rather than paid generation.

The server authenticates requests, checks origin and consent, records idempotency IDs, allows one pending request per account, and limits requests to five per account and fifty total per rolling day (including failures). Production should additionally apply deployment-level abuse controls. Generated JPEGs are stored privately and marked as AI backgrounds on cards and exports. The real paid API has not been exercised; automated tests mock its response.

API reference: https://developers.openai.com/api/docs/guides/image-generation

Sample asset: public/backgrounds/woodland.png. Created with the built-in image generation tool, photorealistic mode. Prompt: Create a single portrait 4:5 photographic background asset for a mobile gratitude card. Photorealistic-natural. Context: 'A long walk with no destination. The air felt like the beginning of autumn, and for once I wasn’t thinking about what came next. Just really grateful to be here.' An atmospheric quiet woodland path in early autumn, soft warm morning light through leaves, earthy greens and muted golden foliage, natural editorial photography, tactile organic detail, gentle grain. Compose as an immersive full-bleed image with softly defocused calm central/lower negative space where the app will overlay white text. No text, lettering, logos, border, panels, people or interface. This is a background image, not a mockup.
