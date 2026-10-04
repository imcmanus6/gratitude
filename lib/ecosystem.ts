// Hand-offs from other Via65 apps (e.g. Ritual opens /open?from=morning&return=…). We remember where
// to send the person back once they finish a session. Only known app origins are accepted as return
// targets, so /open can't be used to bounce people to arbitrary sites.

const APP_NAMES: Record<string, string> = { morning: 'Ritual', gratitude: 'Gratitude', briefly: 'Briefly' };
const KEY = 'ecosystem-return';
const TTL_MS = 3 * 60 * 60 * 1000;

function allowedOrigins(): string[] {
  const fromEnv = (process.env.NEXT_PUBLIC_ECOSYSTEM_RETURN_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return fromEnv.length ? fromEnv : ['https://ritual.iskind.net', 'http://localhost:5197'];
}

// Native apps return through their own URL scheme (their origin is "null", so match by prefix).
const APP_SCHEMES = ['net.iskind.ritual://'];

export function saveEcosystemReturn(from: string | null, returnUrl: string | null): boolean {
  if (!from || !returnUrl || !APP_NAMES[from]) return false;
  const isAppScheme = APP_SCHEMES.some((scheme) => returnUrl.startsWith(scheme));
  if (!isAppScheme) {
    let origin: string;
    try { origin = new URL(returnUrl).origin; } catch { return false; }
    if (!allowedOrigins().includes(origin)) return false;
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ name: APP_NAMES[from], url: returnUrl, at: Date.now() }));
  } catch { /* storage blocked */ }
  return true;
}

export function ecosystemReturn(): { name: string; url: string } | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!saved || Date.now() - saved.at > TTL_MS) return null;
    return { name: saved.name, url: saved.url };
  } catch {
    return null;
  }
}
