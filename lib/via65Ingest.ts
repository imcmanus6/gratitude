// Server-only: report a completion to the person's Via65 account (the shared ecosystem account),
// identified by their verified email. Uses this app's own ingest key; Via65 checks it and only
// records events of this app's type. Ritual sees them only if the person allowed it there.
const URL = process.env.VIA65_SUPABASE_URL?.trim();
const ANON = process.env.VIA65_SUPABASE_ANON_KEY_SERVER?.trim();
const KEY = process.env.VIA65_INGEST_KEY?.trim();

export async function reportToVia65(email: string, type: string, dedupeKey: string, payload: Record<string, unknown> = {}) {
  if (!URL || !ANON || !KEY) return { ok: false, reason: 'not configured' as const };
  const res = await fetch(`${URL}/rest/v1/rpc/ingest_event`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json', 'Content-Profile': 'universe' },
    body: JSON.stringify({ p_app: 'gratitude', p_key: KEY, p_email: email, p_type: type, p_dedupe_key: dedupeKey, p_payload: payload }),
  });
  if (!res.ok) return { ok: false, reason: `via65 ${res.status}` as const };
  const id = await res.json();
  return { ok: true, matched: id !== null };
}
