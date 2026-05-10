/**
 * Stable browser fingerprint. Used for soft rate limiting on game_sessions inserts.
 * NOT a real IP — just enough to distinguish browsers/devices to slow accidental spam.
 */
export async function getClientHash(): Promise<string> {
  const KEY = "game_setup_client_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  const data = `${navigator.userAgent}|${id}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
