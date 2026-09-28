// Development fallback only. Serverless instances do not share this Map.
// Replace with Upstash Redis or another shared atomic limiter before public launch.
const hits = new Map<string, { count: number; resetAt: number }>();
export function allowRequest(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
